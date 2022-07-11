import React from 'react'
import { Flex } from './flex.component';

export class Paragraph extends React.Component {
    constructor() {
      super();
    }
    render() {
      return (
        <div className={this.props.className}>
          <Flex styles={this.props.styles} className={`_flex m_auto items_baseline text_slate_400`}>
              <div>
                  <p>{this.props.text}</p>
              </div>
              <div>
                  {React.cloneElement(this.props.children)}
              </div>
          </Flex>
        </div>
      );
    }
}