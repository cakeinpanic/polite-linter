'use strict';
const tslint = require('tslint');
const path = require('path');
const git = require('simple-git/promise')(process.cwd());
const colors = require('colors');

let {rulesDirectory, configurationFilename} = require('./environment');

const options = {
    fix: false,
    formatter: 'json',
    rulesDirectory: rulesDirectory
};

function lintMe(filename, fileContents) {
    let linter = new tslint.Linter(options);

    let config = tslint.Configuration.loadConfigurationFromPath(path.resolve(process.cwd(), configurationFilename));

    linter.lint(filename, fileContents, config);

    return linter.getResult().failures
                 .map(function (failure) {
                     return {
                         rule: failure.ruleName,
                         text: failure.failure,
                         line: failure.startPosition.lineAndCharacter.line
                     }

                 });

}

function getGit() {
    git
        .revparse(['--abbrev-ref', 'HEAD'])
        .then((branchName) => git.revparse(['origin/HEAD']))
        .catch((err) => 'origin/develop')
        .then((lastPushedCommit) => git.diff(['HEAD', lastPushedCommit.trim(), '--name-only']))
        .then((info) => {
            let files = info.split('\n').filter(t => !!t);
            return Promise.all(files.map(filename => {
                return git.show(['HEAD:' + filename]).then(data => ({
                    filename,
                    lintResult: lintMe(filename, data)
                }));
            }));
        })
        .then(data => {
            if (data.length) {
                console.log(colors.blue('I have linted files committed since last push and there are lint errors:'));
            }
            data.forEach(fileData => {
                console.log(colors.magenta(fileData.filename));
                fileData.lintResult.forEach(({text, rule, line}) => {
                    console.log('\t', colors.red(text), 'line:', colors.blue(line), 'rule: ' + colors.magenta(rule))
                })
            });
            if (data.length) {
                process.exit(0);
            }
        })
        .catch(err => {
            console.log(colors.red(err));
            process.exit(0);
        });


}

getGit();
