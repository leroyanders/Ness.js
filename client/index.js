import ReactDOM from 'react-dom';
import React from 'react';
import { Router } from './router';

ReactDOM.hydrate(<Router isServer={false}/>, document.getElementById('app'));
module.hot.accept();