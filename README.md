# Rick

Rick is the build enforcer. Point him at a Jenkins job and he will exit 0 when your Jenkins job is blue and 1 otherwise. Rick's job is to warn you before you push to the masterbranch on a red build.

## Command Line Usage

If you'd like to just run this on the command line, you can install the cli and execute it ad hoc.
```bash
$ npm install -g rick-cli
$ rick <url> <jobName>
```

## Git Hook Usage

The best way to employ Rick, is in a server-side `update` git hook. That way, he can protect all your developers from pushing on red with minimal effort. See http://git-scm.com/book/zh/v2/Customizing-Git-Git-Hooks for more information on setting up git hooks.

If you, like me, don't have access to the server that your git repo is hosted on (ie. github), then you can still employ Rick client-side in the `pre-push` git hook. See `examples/pre-push` for a template. 
```bash
$ git push origin HEAD
```
