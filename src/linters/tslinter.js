'use strict';
const tslint = require('tslint');
const path = require('path');

let {rulesDirectory, configurationFilename} = require('../../environment');

class TSLinter {
    constructor() {
        const options = {
            fix: false,
            formatter: 'json',
            rulesDirectory: rulesDirectory
        };

        this.tsLinter = new tslint.Linter(options);
        this.config = tslint.Configuration.loadConfigurationFromPath(path.resolve(process.cwd(), configurationFilename));
    }

    lintOneFile(filename, fileContents) {
        this.tsLinter.lint(filename, fileContents, this.config);

        return this.tsLinter.getResult().failures
                   .map(failure => (
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