import React from 'react';

export class Flex extends React.Component {
    constructor() {
      super();
    }
    render() {
      return (
        <div className={`${this.props.className}`}>
          {
            this.props.children.map((child, index) => {
                return React.cloneElement(child, {key: index})
            })
          }
        </div>
      );
    }
}