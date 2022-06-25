import React from 'react'
import Flex from './flex.component';

function Paragraph(props) {
  return (
    <div className={props.className}>
        <Flex styles={props.styles} className={`${props.styles._flex} ${props.styles.m_auto} ${props.styles.items_baseline} ${props.styles.text_slate_400}`}>
            <div>
                <p>{ props.text }</p>
            </div>
            <div>
                {React.cloneElement(props.children)}
            </div>
        </Flex>
    </div>
  )
}

export default Paragraph;