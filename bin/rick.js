#!/usr/bin/env node

'use strict';

var url = process.argv[2];
var job = process.argv[3];

require('../')(url, job, function(success) {
  process.exit(success ? 0 : 1);
});
