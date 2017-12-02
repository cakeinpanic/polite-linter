let yargs = require('yargs');

const argv = yargs.strict().options({
    'rules': {
        string: true,
        desc: 'folder containing custom rules'
    },
    'config': {
        string: true,
        default: './tslint.json',
        desc: 'path to tslint.json'
    },

}).argv;

function getFlag(flag, alias) {
    return argv[flag]
        || process.env['npm_config_' + flag.replace(/-/g, '_').replace(/[A-Z]/g, '_$1')]
        || (alias && process.env[alias]);
}

module.exports = {configurationFilename: getFlag('config'), rulesDirectory: getFlag('rules')};
