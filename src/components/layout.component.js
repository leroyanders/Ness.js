import React from 'react';

export class PageMeta extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return this.props.children;
    }
}

export class Layout extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return this.props.children
    }
}