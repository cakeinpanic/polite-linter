'use strict';
const git = require('simple-git/promise')(process.cwd()).silent(true);
const colors = require('colors');
const {execSync} = require('child_process');

class PoliteHook {
    constructor(linter, filemask) {
        this.linter = linter;
        this.filemask = filemask;
    }

    getAllFilesContent(filePaths) {
        return Promise
            .all(filePaths.map(filename =>
                git.show(['HEAD:' + filename])
                   .then(data => ({
                       filename,
                       fileData: data
                   }))
                   .catch(() => ({}))
            ))
            .then(filesData => filesData.filter(({fileData}) => !!fileData))
    }

    checkoutPrevCommit() {
        execSync(`git checkout HEAD^`, {stdio : 'pipe' });
        const isPushed = execSync(`git branch -r --contains HEAD`).toString().trim();
        return isPushed && execSync('git rev-parse HEAD', {stdio : 'pipe' }).toString().trim();
    }


    stash() {
        const filesChanged = execSync('git status | egrep -w "modified|deleted" | wc -l',{stdio : 'pipe' }).toString();
        if (filesChanged > 0) {
            execSync('git add .').toString();
            execSync('git commit --no-verify  -am "temp"').toString();
            this.stashed = true;
        }
    }


    unstash(startBranch) {
        execSync(`git checkout ${startBranch}`, {stdio : 'pipe' }).toString();
        if (this.stashed) {
            execSync(`git reset HEAD^ --soft`,  {stdio : 'pipe' }).toString();
        }
        this.stashed = false;
    }


    getLastPushedCommit() {
        this.stashed = false;

        const startBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
        this.stash();
        let current = this.checkoutPrevCommit();

        while (!current) {
            current = this.checkoutPrevCommit();
        }
        this.unstash(startBranch);

        return current;
    }


    getAllCommittedFilenames() {
        const lastPushedCommit = this.getLastPushedCommit();
        return git.diff(['HEAD', lastPushedCommit, '--name-only'])
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
