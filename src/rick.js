'use strict';

var patchProtocol = function(url) {
  var protocolStr = 'http://';
  if(0 !== url.indexOf(protocolStr)) {
    url = protocolStr + url;
  }
  return url;
};

var patchTrailingSlash = function(url) {
  var lastIndex = url.length-1;
  var lastChar = url[lastIndex];

  if('/' === lastChar) {
    url = url.substr(0, lastIndex);
  }
  return url;
};

var patchUrl = function(url) {
  return patchProtocol(patchTrailingSlash(url));
};

module.exports = function(url, job, onComplete) {
  if(!(url && job)) {
    console.error('please specify a url and job');
    onComplete && onComplete(false);
    return;
  }

  var jenkins = require('jenkins')(patchUrl(url));

  jenkins.job.get(job, function(err, data) {
    if (err) { throw err; }
    var color = data.color;
    console.log(job + '\'s color is', color);
    var successful = 'blue' === color || 'blue_anime' === color;
    onComplete && onComplete(successful);
  });
};
