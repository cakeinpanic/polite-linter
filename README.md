# Polite linter for git prepush hooks

Everybody likes git prepush hooks – they prevent us from pushing invalid code to repository.

But there are always two problems:
* hooks run on current INDEX, so if your commits are pure, but INDEX is dirty and contains some lint errors, it won't be pushed
* linters run on whole project, no matter that you have committed one file

*Polite linter* analyzes your log and runs linter only on files which are _committed_ since last push, linting their _HEAD_ version.

# How to use
Polite linter for now supports [eslint](https://eslint.org/) and [tslint](https://palantir.github.io/tslint/) linters(contributions for another linters are welcome!)

`npm i polite-linter --save-dev`

 If you are using husky, just add to your `package.json`

 `"prepush": "polite-tslint --rules=path_to_custom_rules --config=path_to_tslint_config`

 or

  `"prepush": "polite-eslint"`

--
 If you are using pure git hooks, use in your `pre-push`

 `npm run polite-tslint --rules=path_to_custom_rules --config=path_to_tslint_config`

## Options

### tslint
 If you are using _tslint_, there are two options you can provide:
 *  `--rules` – path to your custom rules directory(if you are using one)
 *  `--config` – path to your basic config file. By default `./tslint.json` is used

### eslint
_Eslint_ for now does not support any flags – it will find `.eslintrc` by itself and use it to lint your files

# License
MIT



