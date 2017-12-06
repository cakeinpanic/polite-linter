#! /usr/bin/env node
let PoliteHook = require('../src/hook.js');
let ESLinter = require('../src/linters/eslinter.js');
let eslinter = new ESLinter();

let politeEsLintHook = new PoliteHook(eslinter, /\.js$/);

politeEsLintHook.lintCommitted();
