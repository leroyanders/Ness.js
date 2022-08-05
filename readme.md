<p align="center">
  <a href="https://nessjs.org">
		<br/><br/><br/><br/><br/>
    <img src="https://user-images.githubusercontent.com/106757584/175770221-a634f207-c3de-4afc-991c-d2fb32953941.png" height="128">
		<br/><br/><br/><br/><br/>
  </a>
</p>

## About NessJS  
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/leroywagner/ness.js/license) [![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/) [![Ness Version](https://img.shields.io/badge/v3.0.9-NessJS-blue)]()

<i>NessJS - is an **open source** framework based on React.js, Express.js and Webpack, supports both-side rendering. Basically it using **Hot-reloder** and **TailwindCSS** that will helped you reduce your time to develop something great.</i>

 - **[Installation](#setup-installation)**
 - **[Setup new project](#setup-new-project)**
 - [Advanced Usage](#application-scripts)
   - [Generate component, hook, page and others](#generate)
   - [Build production bundle](#build)
   - [Start development server](#start-dev)
   - [Start production server](#start-prod)
 - [Setup and test project online](#setup-and-test-project-online)
 - [Donation](#donation)


## Setup installation
Install this package via [Node.js](https://nodejs.org/en/).

```
$ npm install -g create-ness-app
```
Or you may install [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/) package manager globaly.
```
$ npm install -g yarn
```
```
$ yarn global add create-ness-app
```

> Note: **Node.js 16.5 or later** is required. **Do not use older.**
<div>

<h2>Setup new project</h2>

```
$ create-ness-app
```
<i>Enter **project name** and **location** to installing(**by default ness-app**)</i>

> Type this command in terminal prompt.

</div>
<div>

<h2 width="100%">Application scripts</h2>

<i id="generate">**Generate component, hook, page and others**</i>

Example:
``` 
$ nessapp generate <type> <name>
```

Available commands:
+ ```nessapp generate page <name>```
+ ```nessapp generate component <name>```
+ ```nessapp generate hook <name>```
+ ```nessapp generate service <name>```

<i id="build">**Build project**</i>

``` 
$ yarn build
```
``` 
$ npm run build
```
> Note: Builded assets, server bundle and client bundle will be located in **./deploy** directory.

<i id="start-dev">**Start development server**</i>

``` 
$ yarn start 
```
``` 
$ npm run start 
```

<i id="start-prod">**Start production server**, you may run next command, it will create production assets(such media & etc.)</i>


``` 
$ yarn start:prod
```
``` 
$ npm run start:prod
```

Open browser by default: http://localhost:3000/

</div>

# Setup and test project online

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/start/#leroywagner-nessjs-7fzmgg0lq4i)

## Donation

If this package helped you reduce your time to develop something, or it solved any major problems you had.

Feel free give me a some [cup of coffee :)](https://www.buymeacoffee.com/leroywagner)
