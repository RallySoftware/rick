'use strict';

var fs = require('fs');
var path = require('path');
var promptjs = require('prompt');
var cwd = process.cwd();

var greet = function() {
  console.log(
    'Hi, I\'m Rick.\n'
      + 'I can help you protect the Jenkins build by '
      + 'dropping a pre-push git-hook in your repo.\n'
      + 'That way, I\'ll be able to warn you if you are pushing to'
      + ' a broken build.\n');
};

var isRootDir = function(dir) {
  return '/' === dir;
};

var createFile = function(grunt, callback) {
  var tryDir = cwd;
  while(!isRootDir(tryDir) && !tryCreate(tryDir, grunt, callback)) {
    tryDir = path.resolve(tryDir, '..');
  }
  
  if(isRootDir(tryDir)) {
    console.error('Aborting... Please try again from a git repo.');
    callback && callback(false);
  }
};

var tryCreate = function(dir, grunt, callback) {
  var gitDir = dir + '/.git/hooks';
  
  if(!fs.existsSync(gitDir)) {
    return false;
  }

  var file = gitDir + '/pre-push';
  var options = {
    encoding: 'utf8',
    mode: '0755'
  };

  createHook(grunt, function(contents) {
    fs.writeFile(file, contents, options, function(err) {
      if(err) { throw err; }
      displayHook(file, contents);
      callback && callback(true);
    });
  });
  return true;
};

var displayHook = function(file, contents) {
  console.log('\nHere\'s your pre-push hook.');
  console.log('------------------------------------------------------------');
  console.log(contents);
  console.log('------------------------------------------------------------');
  console.log('I\'ve put it in', file, '\n');
};

var createHook = function(grunt, callback) {
  var defaults = {
    branch: 'master',
    repo: getGitOrigin(),
    gruntfile: getGruntFile()
  };

  var prompts = [
    {
      name: 'branch',
      default: defaults.branch,
      description: 'Branch Jenkins is monitoring'
    }, 
    {
      name: 'repo',
      default: defaults.repo,
      description: 'Repo Jenkins is monitoring',
      before: function(value) {
        return createRepoPattern(value);
      }
    }
  ];
  if (grunt) {
    prompts.push({
      name: 'gruntfile',
      default: defaults.gruntfile,
      description: 'Gruntfile',
      before: function(value) {
        return path.resolve(value);
      }
    });
  }
  promptjs.get(prompts, function(err, result) {
    if(err) { throw err; }
    if(grunt) {
      callback(generateHook(result));
    } else {
      promptRickConfig(result, callback);
    }
  });
};

var getGitOrigin = function() {
  require('shelljs/global');
  return exec('git config --get remote.origin.url', {silent: true}).output.trim();
};

var getGruntFile = function() {
  var tryDir = cwd;
  var gruntfile = gruntFileExistsSync(tryDir);
  while(!isRootDir(tryDir) && !gruntfile){
    tryDir = path.resolve(tryDir, '..');
    gruntfile = gruntFileExistsSync(tryDir);
  }
  if(isRootDir(tryDir)) {
    return path.resolve(cwd + '/Gruntfile.js');
  } else {
    return gruntfile;
  }
};

var gruntFileExistsSync = function(dir) {
  var jsPath = path.resolve(dir + '/Gruntfile.js');
  var coffeePath = path.resolve(dir + '/Gruntfile.coffee');
  if (fs.existsSync(jsPath)) {
    return jsPath;
  }
  if (fs.existsSync(coffeePath)) {
    return coffeePath;
  }
  return false;
};

var promptRickConfig = function(data, callback) {
  var prompts = [
    {
      name: 'url',
      required: true,
      description: 'Jenkins URL'
    },
    {
      name: 'job',
      required: true,
      description: 'Jenkins job name'
    },
    {
      name: 'more',
      required: true,
      default: 'n', 
      description: 'Do you want to check other jobs (y/n)?',
      pattern: /^[yn]$/,
      message: 'Please enter \'y\' or \'n\''
    }
  ];
  promptjs.get(prompts, function(err, result) {
    if(err) { throw err; }
    var both = deepClone(data);
    if(!both.jobs) {
      both.jobs = [];
    }
    both.jobs.push(result);
    if('n' === result.more) {
      callback(generateHook(both));
    } else if ('y' === result.more) {
      promptRickConfig(both, callback);
    }
  });
};

var deepClone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

var createRepoPattern = function(url) {
  var pat = url;
  var sshPattern = /.*@/;
  var httpPattern = /https?:\/\//;

  if (0 === url.search(sshPattern)) { 
    pat = pat.replace(sshPattern, '');
  } else if (0 === url.search(httpPattern)) {
      pat = pat.replace(httpPattern, '');
  }
  return '*' + pat;
};

var generateHook = function(data) {
  var branch = data.branch;
  var repo = data.repo;
  var grunt = data.gruntfile ? true : false;
  var gruntCmdDef = '\nGRUNTCMD=\'grunt --gruntfile ' + data.gruntfile+ '\'';
  var testCmd = grunt ? '${GRUNTCMD} --help | grep rick' : 'command -v rick';
  var runCmd = grunt ? '${GRUNTCMD} rick' : genRickRun(data.jobs);
  var prog = grunt ? 'grunt-rick' : 'rick';
  
  var s = '';
  s += '#!/bin/sh';
  s += '\n' + '';
  s += '\n' + '# This hook runs when `git push` is invoked and prevents you from';
  s += '\n' + '# accidentally pushing to ' + branch + ' on a broken build.';
  s += '\n' + '#';
  s += '\n' + '# If you are pushing to the ' + branch + ' branch of '+ repo + ' and ' + prog + ' fails, ';
  s += '\n' + '# the push will also fail, letting you know how to get around it if need be.';
  s += '\n' + '';
  s += '\n' + 'remote="$1"';
  s += '\n' + 'url="$2"';
  s += '\n' + '';
  s += '\n' + 'JENKINS_BRANCH=\'refs/heads/' + branch + '\'';
  s += '\n' + 'JENKINS_REPO=\'' + repo +'\'';
  s += (grunt ? gruntCmdDef : '');
  s += '\n' + '';
  s += '\n' + 'IFS=\' \'';
  s += '\n' + 'while read local_ref local_sha remote_ref remote_sha';
  s += '\n' + 'do';
  s += '\n' + '    # only protect the branch Jenkins monitors';
  s += '\n' + '    # don\'t care about forked repos';
  s += '\n' + '    # only if ' + prog  + ' is installed';
  s += '\n' + '    if [[ $remote_ref == ${JENKINS_BRANCH} ]] && \\';
  s += '\n' + '       [[ $url == ${JENKINS_REPO} ]] && \\';
  s += '\n' + '       ' + testCmd + ' &> /dev/null';
  s += '\n' + '    then';
  s += '\n' + '        echo "I see you\'re attempting to push to ' + branch + '. I\'ll check Jenkins for you."';
  s += '\n' + '        ' + runCmd + ' && rc=$?';
  s += '\n' + '        if [[ $rc != 0 ]]';
  s += '\n' + '        then';
  s += '\n' + '            echo "Warning: the build is RED! You should only push if you\'re trying to fix the build."';
  s += '\n' + '            echo "If you still want to push, you can run \'git push --no-verify origin HEAD\'."';
  s += '\n' + '            exit 1';
  s += '\n' + '        fi';
  s += '\n' + '    fi';
  s += '\n' + 'done';
  s += '\n' + '';
  s += '\n' + 'exit 0';
  s += '\n';
  return s;
};

var genRickRun = function(jobs) {
  return jobs.reduce(function(prev, current) {
    var s = prev;
    s += prev ? ' && \\\n        ' : '';
    s += 'rick ' + current.url + ' ' + current.job;
    return s;
  }, '');
};

var hook = function(grunt, callback) {
  greet();
  createFile(grunt, callback);
};

module.exports = hook;
