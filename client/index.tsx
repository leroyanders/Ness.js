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