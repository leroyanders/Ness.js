<p align="center">
  <a href="https://nessjs.org">
		<br/><br/><br/><br/><br/>
    <img src="https://user-images.githubusercontent.com/106757584/175770221-a634f207-c3de-4afc-991c-d2fb32953941.png" height="128">
		<br/><br/><br/><br/><br/>
  </a>
</p>

## About Ness.js  &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/leroywagner/ness.js/license) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/ness.js)
<i>Ness.js - is an open-source framework based on React.js and Express.js + Webpack, supports both-side rendering with preinstalled TailwindCSS and Hot Reloader.</i>


## 🌱 Installation
### Firstly clone repository (P.S. Later available in Yarn & NPM)
Follow steps:
```
 $ git clone https://github.com/leroywagner/ness.js.git && cd ness.js
```

 If you have been installed yarn globaly:
```
$ yarn install
``` 
 Or if you haven't:
``` 
 $ npm install
```

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
> Server side routing you can find in /server/routes.js
```
module.exports = (app) => {
    app.use('/', (req, res) => {
        res.render('index', {
          title: 'Welcome to Ness.js',
          component: 'Your component must be declared here'
        });
    });
}
```

### After successful instalation you'll see
<img width="1471" alt="Bildschirmfoto 2022-06-25 um 14 13 19" style="border-radius:50%" src="https://user-images.githubusercontent.com/106757584/175771062-a85b76d8-4774-4650-95d4-979774cf9ad0.png">


## 🚀 There we go!
> Start your server-side and client-side app

``` $ yarn start:ssr ```
or
``` $ npm run start:ssr ```

> open browser by default: localhost:3000
