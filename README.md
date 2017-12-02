# Polite linter for git hooks

Everybody likes git hooks – they prevent us from pushing invalid code to repository.
But there are always two problems:
* hooks run on current index, so if your commits are pure, but index is dirty and contains some lint errors, it won't be pushed
* linters run on whole project which is slow

*Polite linter* analyzes our log and runs tslint only on files which are _committed_ since last push

# How to use

`npm i polite-linter --save-dev`

 If you are using husky, just add to your package.json

 `"prepush": "polite-linter --rules=path_to_custom_rules --config=path_to_tslint_config`

 If you are using pure git hooks, use `npm run polite-linter --rules=path_to_custom_rules --config=path_to_tslint_config`
