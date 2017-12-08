'use strict';
const git = require('simple-git/promise')(process.cwd()).silent(true);
const colors = require('colors');
const {exec} = require('child_process');

class PoliteHook {
    constructor(linter, filemask) {
        this.linter = linter;
        this.filemask = filemask;
    }

    getAllFilesContent(filePaths) {
        return Promise
            .all(
                filePaths.map(filename => {
                        // cant use git.show cause it produces fatal error
                        return new Promise((resolve) => {
                            exec(`git show HEAD:${filename}`,
                                (error, data) => {
                                    resolve({
                                        filename,
                                        fileData: data
                                    });
                                });
                        });
                    }
                )
            )
            .then(filesData => filesData.filter(({fileData}) => !!fileData))
    }

    getOriginBranch() {
        return git.revparse(['--abbrev-ref', 'HEAD'])
                  .then((branchName) => {
                      return git.revparse([`HEAD/${branchName.trim()}`])
                                .then(() => branchName)
                  })
                  .catch(() => {
                      // https://gist.github.com/joechrysler/6073741
                      return new Promise((resolve) => {
                          exec("git show-branch -a \\\n" +
                              "| grep '\\*' \\\n" +
                              "| grep -v `git rev-parse --abbrev-ref HEAD` \\\n" +
                              "| head -n1 \\\n" +
                              "| sed 's/.*\\[\\(.*\\)\\].*/\\1/' \\\n" +
                              "| sed 's/[\\^~].*//'",
                              (error, branchName) => {
                                  resolve(branchName);
                              });
                      })
                  })
                  .then(branchName => `origin/${branchName.trim()}`)
    }

    getAllCommittedFilenames() {
        return this.getOriginBranch()
                   .then((branchName) => git.revparse([branchName]))
                   .then((lastPushedCommit) => git.diff(['HEAD', lastPushedCommit.trim(), '--name-only']))
                   .then((info) => info.split('\n'))
                   .catch(() => []);

    }

    outputErrors(lintResults) {
        if (lintResults.length) {
            console.log(colors.blue(`I have linted files by mask ${this.filemask} committed since last push and there are lint errors:`));
        } else {
            console.log(colors.green(`All files were successfully linted! (mask ${this.filemask})`));
        }

        lintResults.forEach(fileData => {
            console.log(colors.magenta(fileData.filename));
            fileData.lintResult.forEach(({text, rule, line}) => {
                console.log('\t', colors.red(text), 'line:', colors.blue(line), 'rule: ' + colors.magenta(rule));
            });
        });

        if (lintResults.length) {
            process.exit(1);
        }
    }


    lintCommitted() {
        this.getAllCommittedFilenames()
            .then(filenames => filenames.filter(filename => this.filemask.test(filename)))
            .then(filenames => {
                if (!filenames.length) {
                    console.log(colors.green(`No files to lint (mask ${this.filemask})`));
                    return [];
                }
                return this.getAllFilesContent(filenames);
            })
            .then((files) => this.linter.lintFewFiles(files))
            .then(lintData => lintData.filter(({lintResult}) => lintResult.length))
            .then(lintData => this.outputErrors(lintData))
            .catch(err => {
                console.log(colors.red(err));
                process.exit(1);
            });
    }
}

module.exports = PoliteHook;
