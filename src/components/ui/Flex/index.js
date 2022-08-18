import React from 'react';

function Flex({children}) {
    const childrenWithProps = React.Children.map(children, child => {
        // Checking isValidElement is the safe way and avoids a typescript
        // error too.
        if (React.isValidElement(child)) {
          return React.cloneElement(child);
        }
        return child;
      });
    
    return <div className="flex xs:block sm:block w-[100%]">
        {childrenWithProps}
    </div>
}

export default Flex;