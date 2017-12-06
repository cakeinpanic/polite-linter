#! /usr/bin/env node
let PoliteHook = require('../src/hook.js');
let TSLinter = require('../src/linters/tslinter.js');
let tslinter = new TSLinter();

let politeTsLintHook = new PoliteHook(tslinter, /\.(ts|js)$/);

politeTsLintHook.lintCommitted();
