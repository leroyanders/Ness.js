import * as colors from './colors.js';

export default function printErrors(summary, errors, verbose) {
  console.log(colors.red(summary));
  console.log();
  for (const error of errors) {
    console.log(verbose ? error : error.message || error);
    console.log();
  }
}
