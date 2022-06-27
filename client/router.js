import React, { useState } from 'react';
import { BrowserRouter, Route, Switch, Routes } from 'react-router-dom';
import { App } from './pages/app';
import { Error404 } from './errors/error404';
import socketIOClient from "socket.io-client";

export class RouterProvider extends React.Component {
    constructor(props) {
        super(props);

        if (this.props.isServer === false) {
            this.component = (
                <BrowserRouter>
                    <Switch>
                        {
                            this.props.children.map(route => {
                                return (
                                    <Route key={route.key} path={route.props.path} exact>
                                        {route.props.children}
                                    </Route>
                                )
                            })
                        }
                    </Switch>
                </BrowserRouter>
            )
        } else {
            this.component = undefined;
            this.props.children.map(route => {
                if (route.props.path === this.props.ssrLocation) {
                    this.component = route.props.children;
                }
            });
        }
    }

    render() {
        return this.component? this.component :  <Error404/>
    }
}


export function RoutePath(props) {
    return props.children;
}

export class Router extends React.Component {
    constructor(props) {
        super(props);

        if (this.props.isServer === false) {
            if (process.env.NODE_ENV !== 'production') {
                const timeout = setTimeout(() => {
                    const bundle = document.querySelector('[ness-hot-reload]')
                    const bundle_ = document.createElement('script')
                        bundle_.setAttribute('src', `/static/bundle.js?${Date.now()}`)
                        bundle_.setAttribute('ness-hot-reload', 'true')
    
                    bundle.replaceWith(bundle_);
                    clearTimeout(timeout);
                }, 1000);
            }
        }
    }

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