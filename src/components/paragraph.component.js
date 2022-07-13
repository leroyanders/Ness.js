import React from 'react'
import { Flex } from './flex.component';

export class Paragraph extends React.Component {
    constructor() {
      super();
    }
    render() {
      return (
        <div className={this.props.className}>
          <div className={`_flex m_auto items_baseline text_slate_400`}>
            {React.cloneElement(this.props.children)}
          </div>
        </div>
      );
    }
}