import React from 'react';
import NavbarLayout from '@theme/Navbar/Layout';
import NavbarContent from '@theme/Navbar/Content';
export default function Navbar() {
  return (
    <>
      <div className="navbar-ukraine">
        <p>
          <span>Support Ukraine 🇺🇦</span>
          <a
            href="https://opensource.fb.com/support-ukraine"
            target="_blank"
            rel="noreferrer"
          >
            Help provide humanitarian aid
          </a>
        </p>
      </div>
      <NavbarLayout>
        <NavbarContent />
      </NavbarLayout>
    </>
  );
}
