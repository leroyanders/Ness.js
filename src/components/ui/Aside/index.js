import React from 'react';

function Aside({children}) {
    const childrenWithProps = React.Children.map(children, child => {
        // Checking isValidElement is the safe way and avoids a typescript
        // error too.
        if (React.isValidElement(child)) {
          return React.cloneElement(child);
        }
        return child;
      });
    
    return <aside>
        {childrenWithProps}
    </aside>
}

export default Aside;