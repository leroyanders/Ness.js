#! /usr/bin/env node
process.env.NODE_ENV = 'production';

const childProcess = require('child_process');
const chalk = require('chalk');
const path = require('path');
const paths = require('nessapp/config/paths');

const sade = require('sade');
const spawn = require('react-dev-utils/crossSpawn');
const pkg = require('../package.json');
const prog = sade('nessapp');

function dispatchScript(script) {
    const result = spawn.sync('node', [require.resolve('../scripts/' + script)].concat(process.argv.slice(3)), { stdio: 'inherit' });

    // if script was killed by SIGKILL or SIGTERM
    if (result.signal) {
        if (result.signal === 'SIGKILL') console.log('The build failed because the process exited too early. ' + '\nThis probably means the system ran out of memory or someone called ' + '\n`kill -9` on the process.');
        else if (result.signal === 'SIGTERM') console.log('The build failed because the process exited too early. ' + '\nSomeone might have called `kill` or `killall`, or the system could ' + '\nbe shutting down.');
        process.exit(1);
    }
    
    const server = spawn.sync('node', path.join(__dirname, 'deploy', 'server.js'), { stdio: 'inherit' });

    // if script was killed by SIGKILL or SIGTERM
    if (server.signal) {
        if (server.signal === 'SIGKILL') console.log('The build failed because the process exited too early. ' + '\nThis probably means the system ran out of memory or someone called ' + '\n`kill -9` on the process.');
        else if (server.signal === 'SIGTERM') console.log('The build failed because the process exited too early. ' + '\nSomeone might have called `kill` or `killall`, or the system could ' + '\nbe shutting down.');
        process.exit(1);
    } else {
        console.log(chalk.bgBlue.bold(' PRODUCTION '), `🌱 NessApp running on: ${chalk.hex('#5590CB').bold('http://localhost:3000')}`);
    }
}

dispatchScript('build')


// NODE_ENV=production nessapp build && node deploy/server.js


// function runScript(scriptPath, callback) {
//     // keep track of whether callback has been invoked to prevent multiple invocations
//     var invoked = false;
//     const process = childProcess.fork(scriptPath);

//     // listen for errors as they may prevent the exit event from firing
//     process.on('error', function (err) {
//         if (invoked) return;
//         invoked = true;

//         callback(err);
//     });

//     // execute the callback once the process has finished running
//     process.on('exit', function (code) {
//         if (invoked) return;
//         invoked = true;
        
//         const err = code === 0 ? null : new Error('exit code ' + code);
//         callback(err);
//     });

// }

// // build the application
// runScript(path.join(__dirname, './build'), function (err) {
//     if (err) throw err;
//     console.clear();

//     runScript(path.join(paths.appdeploy, './server.js'));
//     console.log(chalk.bgBlue.bold(' PRODUCTION '), `🌱 NessApp running on: ${chalk.hex('#5590CB').bold('http://localhost:3000')}`);
// });