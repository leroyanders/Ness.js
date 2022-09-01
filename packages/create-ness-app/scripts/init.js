/**
 * Copyright (c) 2022-present, Leroy Wagner.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
*/

const https = require('https');
const chalk = require('chalk');
const semver = require('semver');
const spawn = require('cross-spawn');
const os = require('os');
const path = require('path');
const execSync = require('child_process').execSync;
const fs = require('fs-extra');
const envinfo = require('envinfo');
const commander = require('commander');
const package = require('../package.json');

// Check all agents
const isYarn = () => (process.env.npm_config_user_agent || '').indexOf('yarn') === 0; 
const isNpm  = () => (process.env.npm_config_user_agent || '').indexOf('npm')  === 0; 
const isPnp  = () => (process.env.npm_config_user_agent || '').indexOf('pnp')  === 0; 

// This is project name which will passed to package.json into installed app directory.
var projectName = null;

// Init script
const init = () => {
    const app = new commander.Command(package.name)
        .version(package.version)
        .description(package.description)
        // mark as required
        .arguments('<project_name>')
        .usage(`${chalk.green('<project_name>')} [options]`)
        // set name
        .action(name => {
            projectName = name;
        })
        // template
        .option('--template <path-to-template>', 'specify a template for the created project')
        .option('--info', 'print environment debug info')
        // allow unknown arguments
        .allowUnknownOption()

        // help section
        .on('--help', () => {
            console.log(`You need to set ${chalk.blue('application name')}\n`);
            console.log(`A custom ${chalk.blue('--template')} can be one of: \n\n`);
            console.log(chalk.green('  - ness-template-typescript'));
            console.log(chalk.green('  - ness-template-*'));

            console.log('\nIf you have any problems, do not hesitate to file an issue:\n');
            console.log(chalk.cyan('https://github.com/leroywagner/Ness.js/issues/new'));
        })
        .parse(process.argv);

    if (app.info) {
        console.log(chalk.bold('\nEnvironment Info:'));
        console.log(`\nCurrent version of ${package.name}: ${package.version}`);
        console.log(`\nRunning from ${__dirname}`);

        return envinfo
            .run({
                System: ['OS', 'CPU'],
                Binaries: ['Node', 'npm', 'Yarn'],
                Browsers: [
                    'Chrome',
                    'Edge',
                    'Internet Explorer',
                    'Firefox',
                    'Safari',
                ],
                npmPackages: ['nessapp', 'ness-template-default'],
                npmGlobalPackages: ['create-ness-app'],
            },
            {
                duplicates: true,
                showNotFound: true,
            })
        .then(console.log);
    }

    if (typeof projectName === 'object' || typeof projectName === null) {
        console.error('\n\nPlease specify the project directory:');
        console.log(`${chalk.cyan(app.name())} ${chalk.green('<project-directory>')}\n`);

        console.log('For example:');
        console.log(`${chalk.cyan(app.name())} ${chalk.green('my-ness-app')}\n`);
        
        console.log(`Run ${chalk.cyan(`${app.name()} --help`)} to see all options.\n\n`);

        process.exit(1);
    }

    // Check is new version of package is available
    checkForLatestVersion(package.name)
    .catch(() => {
        try {
            return execSync('npm view create-ness-app version').toString().trim();
        } catch (e) {
            return null;
        }
    })
    .then(latest => {
        if (latest && semver.lt(package.version, latest)) {
            console.log();
            console.error(
                chalk.yellow(
                    `You are running \`create-ness-app\` ${package.version}, which is behind the latest release (${latest}).\n\n` +
                    'We recommend always using the latest version of create-ness-app if possible.'
                )
            );
      } else {
            const useYarn = isYarn();
            // create a new application
            createApp(
                projectName,
                app.template,
                useYarn
            );
        }
    });
}

const createApp = (name, template, useYarn) => {
    const unsupportedNodeVersion = !semver.satisfies(semver.coerce(process.version), '>=15');

    if (unsupportedNodeVersion) {
        console.log(
          chalk.yellow(
            `You are using Node ${process.version} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
            `Please update to Node 15 or higher for a better, fully supported experience.\n`
          )
        );
        
        process.exit(1);
    }

    const root = path.resolve(name);
    const appName = path.basename(root);

    fs.ensureDirSync(name);

    console.log(`Creating a new Ness app in ${chalk.blue(root)}.`);

    const applicationPackage = {
        name: appName,
        version: package.version,
        private: true,
        scripts: {
            'start': 'nessapp start',
            'build': 'nessapp build',
            'start:prod': 'nessapp production',
            'generate': 'nessapp generate'
        }
    };

    // Create a new package.json in application folder
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(applicationPackage, null, 2) + os.EOL);

    const originalDirectory = process.cwd();
    process.chdir(root);

    run(root, appName, applicationPackage.version, originalDirectory, template, useYarn);
}

const run = (root, name, version, originalDirectory, template, useYarn) => {
    const tmp = template !== undefined ? template : 'ness-template-default';

    getPackageInfo(tmp).then(async () => {
        const dependencies = ['nessapp', 'ness-tailwind', tmp];

        console.log(chalk.green(`Installing: ${dependencies.join(', ')}`));
        console.log('\nInstalling packages. This might take a couple of minutes.');

        await install(root, dependencies);

        console.log(chalk.blue(`\nInstalling ${tmp === 'ness-template-default' ? 'default template' : `${tmp} template.`}`));

        try {
            const template_dir = path.join(path.join(root, 'node_modules', tmp), 'template');
            // install template
            fs.copySync(template_dir, root, { overwrite: true })

            // uninstall template as package
            await uninstall(root, [tmp]).then(() => {
                console.log(`${chalk.green(`\nSuccess! Created "${name}"`)}`);
                console.log(`${chalk.green(`Inside that directory, you can run several commands:\n`)}`);

                console.log(`${chalk.green(`     ${chalk.green('npm run start')}`)}`);
                console.log(`${chalk.green(`     Starts the development server.`)}\n`);

                console.log(`${chalk.green(`     ${chalk.green('npm run build')}`)}`);
                console.log(`${chalk.green(`     Bundles the app into static files for production.`)}\n`);

                console.log(`${chalk.green(`     ${chalk.green('npm run generate')}`)}`);
                console.log(`${chalk.green(`     Generate pages, hooks and also.`)}\n`);

                console.log(`${chalk.green(`${chalk.green('We suggest that you begin by typing:')}`)}\n`);
                console.log(`${chalk.green(`cd ${chalk.green(name)} && ${chalk.green('npm run start')}`)}\n`);
                console.log(`${chalk.green('Sweet coding!')}`);
            });
        } catch (err) {
            console.error(err)
        }

    }).catch(err => {
        console.error(chalk.red(`Cannot find package for template: ${tmp}\n`));
        console.log(err);
    })
}

const getPackageInfo = (installPackage) => {
    if (installPackage.match(/^.+\.(tgz|tar\.gz)$/)) {
        return getTemporaryDirectory()
            .then(obj => {
                let stream;

                if (/^http/.test(installPackage)) {
                    stream = hyperquest(installPackage);
                } else {
                    stream = fs.createReadStream(installPackage);
                }
                return extractStream(stream, obj.tmpdir).then(() => obj);
            })
            .then(obj => {
                const { name, version } = require(path.join(obj.tmpdir, 'package.json'));
                obj.cleanup();
                
                return { name, version };
            })
            .catch(err => {
                console.log(`Could not extract the package name from the archive: ${err.message}`);
                const assumedProjectName = installPackage.match(
                    /^.+\/(.+?)(?:-\d+.+)?\.(tgz|tar\.gz)$/
                )[1];
                console.log(`Based on the filename, assuming it is "${chalk.cyan(assumedProjectName)}"`);
                return Promise.resolve({ name: assumedProjectName });
            });
    } else if (installPackage.startsWith('git+')) {
        return Promise.resolve({
            name: installPackage.match(/([^/]+)\.git(#.*)?$/)[1],
        });
    } else if (installPackage.match(/.+@/)) {
        // Do not match @scope/ when stripping off @version or @tag
        return Promise.resolve({
            name: installPackage.charAt(0) + installPackage.substr(1).split('@')[0],
            version: installPackage.split('@')[1],
        });
    } else if (installPackage.match(/^file:/)) {
        const installPackagePath = installPackage.match(/^file:(.*)?$/)[1];
        const { name, version } = require(path.join(installPackagePath, 'package.json'));

        return Promise.resolve({ name, version });
    }

    return Promise.resolve({ name: installPackage });
}

const checkForLatestVersion = (package) => {
    return new Promise((resolve, reject) => {
        https.get(`https://registry.npmjs.org/-/package/${package}/dist-tags`,
            res => {
                if (res.statusCode === 200) {
                    let body = '';
                    res.on('data', data => (body += data));
                    res.on('end', () => {
                        resolve(JSON.parse(body).latest);
                    });
                } else {
                    reject();
                }
        }).on('error', () => {
            reject();
        });
    });
}

const uninstall = (root, dependencies) => {
    return new Promise((resolve, reject) => {
        var command = 'npm';
        var args = [
          'uninstall',
          '--no-audit',
          '--save',
          '--save-exact',
          '--loglevel',
          'error',
        ].concat(dependencies);

        const child = spawn(command, args, { stdio: 'inherit' });

        child.on('close', code => {
            if (code !== 0) {
                reject({
                    command: `${command} ${args.join(' ')}`,
                });
                return;
            }
            resolve();
        });
    });
}

const install = (root, dependencies) => {
    return new Promise((resolve, reject) => {
        var command = 'npm';
        var args = [
          'install',
          '--no-audit',
          '--save',
          '--save-exact',
          '--loglevel',
          'error',
        ].concat(dependencies);

        const child = spawn(command, args, { stdio: 'inherit' });

        child.on('close', code => {
            if (code !== 0) {
                reject({
                    command: `${command} ${args.join(' ')}`,
                });
                return;
            }
            resolve();
        });
    });
}

module.exports = { init }