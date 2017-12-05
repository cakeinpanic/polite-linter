'use strict';
const git = require('simple-git/promise')(process.cwd());
const colors = require('colors');
const TSLinter = require('./src/tslinter');

class PoliteHook {
    constructor(linter, filemask) {
        this.tsLinter = linter;
        this.filemask = filemask;
    }

    getAllFilesContent(filePaths) {
        return Promise.all(filePaths.map(filename =>
            git.show(['HEAD:' + filename])
               .then(data => ({
                   filename,
                   fileData: data
               }))
        ));
    }

    getAllCommittedFilenames() {
        return git.raw(['status', '-sb'])
                  .then(statusReport => {
                          let aheadCount = /ahead (\d+)/.exec(statusReport)[1];
                          return git.revparse(['HEAD~' + aheadCount]);
                      }
                  )
                  .then((lastPushedCommit) => git.diff(['HEAD', lastPushedCommit.trim(), '--name-only']))
                  .then((info) => info.split('\n').filter(file => !!file))
                  .catch(() => {
                      return [];
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
        this.getAllCommittedFilenames()
            .then(filenames => filenames.filter(filename => this.filemask.test(filename)))
            .then(filenames => {
                if (!filenames.length) {
                    console.log(colors.green('No files to lint'));
                    return [];
                }
                return this.getAllFilesContent(filenames);
            })
            .then((files) => this.tsLinter.lintFewFiles(files))
            .then(lintData => this.outputErrors(lintData))
            .catch(err => {
                console.log(colors.red(err));
                process.exit(0);
            });
    }
}

let linter = new TSLinter();
let politeTsLintHook = new PoliteHook(linter, /\.ts|js$/);

module.exports = politeTsLintHook.lintCommitted.bind(politeTsLintHook);
