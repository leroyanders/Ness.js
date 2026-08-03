import React from 'react';

function PassThrough({ children }) {
  return React.createElement(React.Fragment, null, children);
}

export const Page = PassThrough;
export const Layout = PassThrough;
export const Head = PassThrough;
