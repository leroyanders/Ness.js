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
    
    return <div className="container m-auto w-[100%] ml-5 xs:ml-0 sm:ml-0 inline">
        {childrenWithProps}
    </div>
}

export default Container;