import React from 'react';

function Navbar({children}) {
    const childrenWithProps = React.Children.map(children, child => {
        // Checking isValidElement is the safe way and avoids a typescript
        // error too.
        if (React.isValidElement(child)) {
          return React.cloneElement(child);
        }
        return child;
      });
    
    return <nav className="navbar w-[25%] xs:w-[100%] xs:mt-[-15px] xs:mb-10 sm:w-[100%] sm:mt-[-15px] sm:mb-10">
        {childrenWithProps}
    </nav>
}

export default Navbar;