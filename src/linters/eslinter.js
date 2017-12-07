'use strict';
let CLIEngine = require('eslint').CLIEngine;

class ESLinter {
    constructor() {
        this.cli = new CLIEngine({
            // rulePaths: ''
            // useEslintrc: false
        });
    }

    lintOneFile(filename, fileContents) {
        let result = this.cli.executeOnText(fileContents, filename);
        return result.results[0].messages.map(failure =>
            ({
                rule: failure.ruleId,
                text: failure.message,
                line: failure.line
            }));

    }

    lintFewFiles(files) {
        return files.map(({filename, fileData}) => ({
            filename: filename,
            lintResult: this.lintOneFile(filename, fileData)
        }));
    }
}

module.exports = ESLinter;

