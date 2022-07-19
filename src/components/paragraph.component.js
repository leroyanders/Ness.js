import React from 'react'
import { Flex } from './flex.component';

export class Paragraph extends React.Component {
    constructor() {
      super();
    }
    render() {
      return (
        <div className={this.props.className}>
          <div className={`flex m-auto items-baseline text-slate-400`}>
            {React.cloneElement(this.props.children)}
          </div>
        </div>
      );
    }
}