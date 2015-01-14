# Rick 
[![NPM](https://nodei.co/npm/rick-cli.png)](https://nodei.co/npm/rick-cli/)

Rick is the build enforcer. Point him at a Jenkins job and he will exit 0 when your Jenkins job is blue and 1 otherwise. Rick's job is to warn you before you push to the masterbranch on a red build.

## Usage

There are a number of ways to employ Rick in your project.
The best way to employ Rick, is in a server-side `update` git hook. That way, he can protect all your developers from pushing on red with minimal effort. See http://git-scm.com/book/zh/v2/Customizing-Git-Git-Hooks for more information on setting up git hooks.
If you, like me, don't have access to the server that your git repo is hosted on (ie. github), then you can still employ Rick client-side in the `pre-push` git hook.

### Grunt

Check out [grunt-rick](https://github.com/RallySoftware/grunt-rick) to enable the build enforcer in your [Grunt](http://gruntjs.com/) project.

### Command Line

If you don't want to use [Grunt](http://gruntjs.com/) in your project, a global install of Rick, will make his services available anywhere.

```bash
$ npm install -g rick-cli
$ rick <url> <jobName>
```

Once installed, the `rick me` command can generate a pre-push git-hook for you and put it in your project's '.git/hooks' directory. It will prompt you for the variables it needs to create a hook specifically for your project.

```bash
$ rick me
Hi, I'm Rick.
I can help you protect the Jenkins build by dropping a pre-push git-hook in your repo.
That way, I'll be able to warn you if you are pushing to a broken build.

prompt: Branch Jenkins is monitoring:  (master)
prompt: Repo Jenkins is monitoring:  (git@github.com:yourAwesomeRepo.git)
prompt: Jenkins URL:  jenkins.yourorg.com
prompt: Jenkins job name:  yourJobName
prompt: Do you want to check other jobs (y/n)?:  (n) y
...
```

Rick will take your answers and display your custom git-hook so that you can check it for errors. He will also tell you where he placed the hook.

If you made a mistake in the config, you can re-run `rick me` to overwrite the old hook, edit the file by hand, or simply delete it.


