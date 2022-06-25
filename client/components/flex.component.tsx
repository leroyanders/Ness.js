import React from 'react'

function Flex(props) {
  return (
    <div className={`${props.className}`}>
        {
            props.children.map((child, index) => {
                return React.cloneElement(child, {key: index})
            })
        }
    </div>
  )
}

export default Flex;