import React from 'react';

function Container({children}) {
    const childrenWithProps = React.Children.map(children, child => {
        // Checking isValidElement is the safe way and avoids a typescript
        // error too.
        if (React.isValidElement(child)) {
          return React.cloneElement(child);
        }
        return child;
      });
    
    return <div className="container m-auto w-full ml-5">
        {childrenWithProps}
    </div>
}

export default Container;