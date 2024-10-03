import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';
const execPromise = promisify(exec);
const languageOptions = [
    {
        name: 'Ruby',
        dockerImage: 'presidentbeef/brakeman',
        commandTemplate: (codePath, filesToScan, scanWholeCode, additionalOptions) => {
            const formattedFilesToScan = filesToScan.split(',').map(file => `${file.trim()}`).join(' ');
            return scanWholeCode
                ? `docker run --rm -v "${codePath}":/code presidentbeef/brakeman --quiet ${additionalOptions}`
                : `docker run --rm -v "${codePath}":/code presidentbeef/brakeman --quiet ${additionalOptions} --only-files ${formattedFilesToScan}`;
        },
        helpCommand: 'docker run --rm presidentbeef/brakeman --help',
    },
    {
        name: 'Python',
        dockerImage: 'ghcr.io/pycqa/bandit/bandit',
        commandTemplate: (codePath, filesToScan, scanWholeCode, additionalOptions) => {
            const formattedFilesToScan = filesToScan.split(',').map(file => `${file.trim()}`).join(' ');
            return scanWholeCode
                ? `docker run --rm -v "${codePath}":/code ghcr.io/pycqa/bandit/bandit -r . ${additionalOptions}`
                : `docker run --rm -v "${codePath}":/code ghcr.io/pycqa/bandit/bandit ${additionalOptions} ${formattedFilesToScan}`;
        },
        helpCommand: 'docker run --rm ghcr.io/pycqa/bandit/bandit --help',
    },
    {
        name: 'JavaScript',
        dockerImage: 'semgrep/semgrep',
        commandTemplate: (codePath, filesToScan, scanWholeCode, additionalOptions) => {
            const formattedFilesToScan = filesToScan.split(',').map(file => `${file.trim()}`).join(' ');
            return scanWholeCode
                ? `docker run --rm -v "${codePath}":/code semgrep/semgrep --config auto ${additionalOptions}`
                : `docker run --rm -v "${codePath}":/code semgrep/semgrep --config auto --include ${formattedFilesToScan} ${additionalOptions}`;
        },
        helpCommand: 'docker run --rm semgrep/semgrep --help',
    }
];
class SASTWrapper {
    async selectLanguage() {
        const { languageName } = await inquirer.prompt([
            {
                type: 'list',
                name: 'languageName',
                message: 'Which programming language do you want to scan?',
                choices: languageOptions.map(option => option.name),
            }
        ]);
        const selectedLanguage = languageOptions.find(lang => lang.name === languageName);
        if (!selectedLanguage) {
            throw new Error(`Language support for ${languageName} is not implemented yet.`);
        }
        return selectedLanguage;
    }
    async getCodePath() {
        const { codePath } = await inquirer.prompt([
            {
                type: 'input',
                name: 'codePath',
                message: 'Please enter the absolute path of the code to be scanned:',
                validate: (input) => input ? true : 'Code path cannot be empty',
            }
        ]);
        return codePath;
    }
    async shouldScanWholeCode() {
        const { scanWholeCode } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'scanWholeCode',
                message: 'Do you want to scan the whole codebase?',
            }
        ]);
        return scanWholeCode;
    }
    async getSpecificFiles() {
        const { specificFiles } = await inquirer.prompt([
            {
                type: 'input',
                name: 'specificFiles',
                message: 'Please enter the specific file paths (comma separated):',
                validate: (input) => input ? true : 'You must enter at least one file',
            }
        ]);
        return specificFiles;
    }
    async getAdditionalOptions(language) {
        const { additionalOptions } = await inquirer.prompt([
            {
                type: 'input',
                name: 'additionalOptions',
                message: `Enter any additional options for ${language.name} (or leave blank for none):`,
            }
        ]);
        return additionalOptions.trim();
    }
    async showHelp(language) {
        console.log(`Showing help for ${language.name}...`);
        const { stdout, stderr } = await execPromise(language.helpCommand);
        if (stderr) {
            console.error('Error showing help:', stderr);
        }
        console.log(stdout);
    }
    async pullDockerImage(language) {
        console.log(`Pulling Docker image for ${language.name}...`);
        await execPromise(`docker pull ${language.dockerImage}`);
    }
    async runDockerCommand(language, codePath, filesToScan, scanWholeCode, additionalOptions) {
        const command = language.commandTemplate(codePath, filesToScan, scanWholeCode, additionalOptions);
        console.log('Executing command:', command);
        try {
            const { stdout, stderr } = await execPromise(command);
            if (stderr) {
                console.error('Docker stderr:', stderr);
            }
            return stdout;
        }
        catch (error) {
            if (error.stdout) {
                console.warn('The scan completed with findings (vulnerabilities were detected):');
                return error.stdout;
            }
            else {
                console.error(`Error executing command ${command}:`, error);
                throw error;
            }
        }
    }
    displayResults(stdout) {
        const overviewSection = stdout.match(/== Overview ==[\s\S]*?(?== Warning Types ==)/);
        const warningTypesSection = stdout.match(/== Warning Types ==[\s\S]*?(?=\n==|$)/);
        const warningsSection = stdout.match(/== Warnings ==[\s\S]*?(?=File:|$|== Overview ==)/g) || [];
        console.log('\n======= Scan Results =========\n');
        if (overviewSection) {
            console.log('Overview:');
            console.log(overviewSection[0]);
        }
        if (warningTypesSection) {
            console.log('Warning Types:');
            console.log(warningTypesSection[0]);
        }
        else {
            console.log('Warning Types: No warning types found');
        }
        if (warningsSection.length > 0) {
            console.log('Warnings:');
            warningsSection.forEach((warning, index) => {
                console.log(`Warning ${index + 1}:\n${warning.trim()}`);
            });
        }
        else {
            console.log('Warnings: No vulnerabilities found.');
        }
        console.log('\n=============================\n');
    }
    async run() {
        try {
            const language = await this.selectLanguage();
            const codePath = await this.getCodePath();
            const scanWholeCode = await this.shouldScanWholeCode();
            let filesToScan = '';
            if (!scanWholeCode) {
                filesToScan = await this.getSpecificFiles();
            }
            const additionalOptions = await this.getAdditionalOptions(language);
            await this.pullDockerImage(language);
            console.log(`Running SAST tool for ${language.name} on ${codePath}...`);
            const stdout = await this.runDockerCommand(language, codePath, filesToScan, scanWholeCode, additionalOptions);
            console.log('Scan completed.');
            this.displayResults(stdout);
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`Error: ${error.message}`);
            }
        }
    }
}
const sastWrapper = new SASTWrapper();
sastWrapper.run();
