'use strict';
const tslint = require('tslint');
const path = require('path');
const git = require('simple-git/promise')(process.cwd());
const colors = require('colors');

let {rulesDirectory, configurationFilename} = require('./environment');

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

class PoliteHook {
    constructor(linter) {
        this.tsLinter = linter;
    }

    getAllFilesContent(filePaths){
        return Promise.all(filePaths.map(filename =>
            git.show(['HEAD:' + filename])
               .then(data => ({
                   filename,
                   fileData: data
               }))
        ));
    }

    getAllCommittedFiles() {
        return git.raw(['status', '-sb'])
                  .then(statusReport => {
                          let aheadCount = /ahead (\d+)/.exec(statusReport)[1];
                          return git.revparse(['HEAD~' + aheadCount]);
                      }
                  )
                  .then((lastPushedCommit) => git.diff(['HEAD', lastPushedCommit.trim(), '--name-only']))
                  .then((info) => {
                      return info.split('\n').filter(file => !!file);
                  })
                  .then(files => {
                    return this.getAllFilesContent(files);
                  });
    }

    outputErrors(lintResults) {
        if (lintResults.length) {
            console.log(colors.blue('I have linted files committed since last push and there are lint errors:'));
        }

        lintResults.forEach(fileData => {
            console.log(colors.magenta(fileData.filename));
            fileData.lintResult.forEach(({text, rule, line}) => {
                console.log('\t', colors.red(text), 'line:', colors.blue(line), 'rule: ' + colors.magenta(rule));
            });
        });

        if (lintResults.length) {
            process.exit(0);
        }
    }


    lintCommitted() {
        this.getAllCommittedFiles()
            .then((files) => {
                return this.tsLinter
                           .lintFewFiles(files.filter(file => /\.ts|js$/.test(file.filename)))
            })
            .then(data => this.outputErrors(data))
            .catch(err => {
                console.log(colors.red(err));
                process.exit(0);
            });
    }
}

let linter = new TSLinter();
let politeTsLintHook = new PoliteHook(linter);

module.exports = politeTsLintHook.lintCommitted.bind(politeTsLintHook);
