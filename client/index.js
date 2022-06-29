import ReactDOM from 'react-dom';
import React from 'react';
import { Router } from './router';

ReactDOM.hydrate(<Router isServer={false}/>, document.getElementById('app'));

if(process.env.NODE_ENV === "development") {
	module.hot.accept();
}
