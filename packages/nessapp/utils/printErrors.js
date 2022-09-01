var chalk = require('chalk');

function printErrors(summary, errors, verbose) {
  console.log(chalk.red(summary));
  console.log();
  errors.forEach(function (err) {
    if (verbose) console.log(err);else console.log(err.message || err);
    console.log();
  });
}

module.exports = printErrors;