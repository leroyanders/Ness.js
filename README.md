<p align="center">
  <a href="https://nessjs.org">
		<br/><br/><br/><br/><br/>
    <img src="https://user-images.githubusercontent.com/106757584/175770221-a634f207-c3de-4afc-991c-d2fb32953941.png" height="128">
		<br/><br/><br/><br/><br/>
  </a>
</p>

## About Ness.js  &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/leroywagner/ness.js/blob/master/license.md) [![npm version](https://img.shields.io/npm/v/create-ness-app.svg?style=flat)](https://www.npmjs.com/package/create-ness-app) [![CircleCI](https://circleci.com/gh/leroywagner/ness.js.svg?style=svg)](https://circleci.com/gh/leroywagner/ness.js)
<i>Ness.js - is an open-source framework based on React.js and Express.js + Webpack, supports both-side rendering with preinstalled TailwindCSS and Hot Reloader.</i>


## 🌱 Installation
### Firstly install Ness.js-cli to setup new project
Install using npm or yarn:
```
 $ npm install -g create-ness-app
```
```
 $ yarn global add create-ness-app
```

Setup new project, run in terminal:
```
$ create-ness-app
```
> <i>Enter project name and place to install(by default ness-app)</i>

## Examples
> Start by editing /client/router.js
```
import React from 'react';
import { BrowserRouter, Route, Switch, Routes } from 'react-router-dom';
import { App } from './pages/app';
import { Error404 } from './errors/error404';

export class RouterProvider extends React.Component {
    ...
}


export function RoutePath(props) {
    ...
}

export class Router extends React.Component {
    constructor(props) {
        ...
    }
```
> Manage your routes here, it wll apper also to server-side.
```
    render() {
        const { ssrLocation } = this.props;
        return (
            <RouterProvider isServer={this.props.isServer} ssrLocation={ssrLocation}>
                <RoutePath path="/">
                    <App/>
                </RoutePath>
                <RoutePath path="/about">
                    <div>About Ness.js</div>
                </RoutePath>
                <RoutePath path="*">
                    <Error404/>
                </RoutePath>
            </RouterProvider>
        );
    }
}
```
> Manage titles in /server/routes.js
```
const Titles = {
	'/': 'Welcome to Ness.js'
}
```

### After successful instalation you'll see
<img width="1471" alt="Bildschirmfoto 2022-06-25 um 14 13 19" style="border-radius:50%" src="https://user-images.githubusercontent.com/106757584/175771062-a85b76d8-4774-4650-95d4-979774cf9ad0.png">


## 🚀 There we go!
> Start your server-side and client-side app

``` $ yarn start:ssr ```
or
``` $ npm run start:ssr ```

> Start your production server

``` $ yarn start:production ```
or
``` $ npm run start:production ```

> open browser by default: localhost:3000
