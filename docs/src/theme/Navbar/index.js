import React from 'react';
import NavbarLayout from '@theme/Navbar/Layout';
import NavbarContent from '@theme/Navbar/Content';
export default function Navbar() {
  return (
    <>
      <div className="navbar-ukraine">
        <p>Support Ukraine 🇺🇦 
          <a href="https://opensource.fb.com/support-ukraine" target="_blank">Help Provide Humanitarian Aid to Ukraine.</a>
        </p>
      </div>
      <NavbarLayout>
        <NavbarContent />
      </NavbarLayout>
    </>
  );
}
