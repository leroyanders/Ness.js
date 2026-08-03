#!/usr/bin/env node

/**
 * Copyright (c) 2022-present, Leroy Anders.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const currentNodeVersion = process.versions.node;
const [majorVersion] = currentNodeVersion.split('.').map(Number);
const supported = majorVersion >= 16;

if (!supported) {
  console.error(
    'You are running Node ' +
      currentNodeVersion +
      '.\n' +
      'Ness.js requires Node 16 or higher. \n' +
      'Please update your version of Node.',
  );
  process.exit(1);
}

const { init } = await import('../src/index.js');

init().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
