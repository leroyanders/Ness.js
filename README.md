<p align="center">
  <a href="https://nessjs.org">
    <img src="https://user-images.githubusercontent.com/106757584/175770221-a634f207-c3de-4afc-991c-d2fb32953941.png" height="128">
  </a>
</p>

## 🌱 Installation &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![CircleCI Status](https://circleci.com/gh/facebook/react.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/facebook/react) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://reactjs.org/docs/how-to-contribute.html#your-first-pull-request)
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
> Start by editing /client/index.tsx
```
import ReactDOM from 'react-dom';
import React from 'react';
import App from './pages/app';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import styles from './styles/app.module.scss';

ReactDOM.render(
    <BrowserRouter>
        <Switch>
            <Route path="/" exact component={App} />
        </Switch>
    </BrowserRouter>
, document.getElementById('app'));

// hot reloading
// @ts-ignore
if (module.hot) module.hot.accept();
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
