import React from 'react';

export class Title extends React.Component {
    constructor() {
      super();
    }
    render() {
      return (
        <h1 className={"heading30"}>
          Welcome to <b className={"welcomeTitle"}>{this.props.title || "Ness.js"}</b>
        </h1>
      );
    }
}