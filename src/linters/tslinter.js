'use strict';
const tslint = require('tslint');
const path = require('path');

let {rulesDirectory, configurationFilename} = require('../../environment');

class TSLinter {
    constructor() {
        this.options = {
            fix: false,
            formatter: 'json',
            rulesDirectory: rulesDirectory
        };
    }

    lintOneFile(filename, fileContents) {
        const tsLinter = new tslint.Linter(this.options);
        const config = tslint.Configuration.loadConfigurationFromPath(path.resolve(process.cwd(), configurationFilename));

        tsLinter.lint(filename, fileContents, config);

        return tsLinter.getResult().failures.map(failure => (
            {
                rule: failure.ruleName,
                text: failure.failure,
                line: failure.startPosition.lineAndCharacter.line
            }
        ));
    }

    lintFewFiles(files) {
        return files.map(({filename, fileData}) => ({
            filename: filename,
            lintResult: this.lintOneFile(filename, fileData)
        }));
    }
}

module.exports = TSLinter;
