# CodeShield

CodeShield is an open-source Static Application Security Testing (SAST) wrapper that simplifies the process of scanning code for vulnerabilities across multiple programming languages. It leverages Dockerized security tools to provide efficient and consistent results, making it easy to integrate into CI/CD pipelines.

## About
CodeShield is a versatile SAST (Static Application Security Testing) wrapper tool that automates the vulnerability scanning process for Ruby, Python, and JavaScript projects. It integrates popular open-source tools such as Brakeman, Bandit, and Semgrep to identify security risks in your codebase

## Supported Languages and Tools
- **Ruby**: [Brakeman](https://brakemanscanner.org/)
- **Python**: [Bandit](https://bandit.readthedocs.io/en/latest/)
- **JavaScript**: [Semgrep](https://semgrep.dev/)

## Features
- Automated security scanning for Ruby, Python, and JavaScript codebases.
- Interactive command-line interface using `inquirer` for an intuitive user experience.
- Support for scanning specific files or the entire codebase.
- Dockerized scans ensure consistency across environments.
- Provides detailed scan results, including vulnerability types and warnings.

## Prerequisites
- **Docker**: Ensure Docker is installed and running on your machine.
- **Node.js**: CodeShield is built using Node.js, so you'll need it installed to run the wrapper.

## Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/your-repo/CodeShield.git
    cd CodeShield
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

## Usage

1. Run CodeShield:
    ```bash
    npm start
    ```

2. Select the programming language you want to scan (Ruby, Python, or JavaScript).

3. Provide the absolute path to the code you wish to scan.

4. Choose whether you want to scan the entire codebase or specific files.

5. For Ruby projects, you can optionally pass additional Brakeman options.

### Example Workflow
```bash
? Which programming language do you want to scan? (Use arrow keys)
  ❯ Ruby
    Python
    JavaScript

? Please enter the absolute path of the code to be scanned: /Users/yourname/project

? Do you want to scan the whole codebase? (y/N)

? Please enter the specific file paths (comma separated): app/controllers/passes_controller.rb, app/models/user.rb

Pulling Docker image for Ruby...
Running SAST tool for Ruby on /Users/yourname/project...
Executing command: docker run --rm -v "/Users/yourname/project":/code presidentbeef/brakeman --quiet --only-files app/controllers/passes_controller.rb app/models/user.rb
Scan completed.
```
### Contributing
We welcome contributions! Feel free to open issues or submit pull requests to improve CodeShield.

### License
CodeShield is open-source and licensed under the MIT License.


