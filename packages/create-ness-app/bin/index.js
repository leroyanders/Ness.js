#!/usr/bin/env node

/**
 * Copyright (c) 2022-present, Leroy Wagner.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
*/

'use strict';

const currentNodeVersion = process.versions.node;
const semver = currentNodeVersion.split('.');
const major = semver[0];

if (major < 15) {
  console.error(
    'You are running Node ' +
      currentNodeVersion +
      '.\n' +
      'Create Ness App requires Node 15 or higher. \n' +
      'Please update your version of Node.'
  );
  process.exit(1);
}

const { init } = require('../scripts/init');

init();