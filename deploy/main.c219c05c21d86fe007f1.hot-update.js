exports.id = "main";
exports.modules = {

/***/ "./src/components/ui/Header/index.js":
/*!*******************************************!*\
  !*** ./src/components/ui/Header/index.js ***!
  \*******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-router-dom */ "react-router-dom");
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_router_dom__WEBPACK_IMPORTED_MODULE_1__);
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/components/ui/Header/index.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;



function Header(props) {
  const seacrhInput = Object(react__WEBPACK_IMPORTED_MODULE_0__["useRef"])(null);
  let keysPressed = {};

  const focusSearch = e => {
    e.preventDefault();
    seacrhInput.current.focus();
  };

  const handleKeyUnPress = Object(react__WEBPACK_IMPORTED_MODULE_0__["useCallback"])(event => {
    delete keysPressed[event.key];
  }, []); // handle what happens on key press

  const handleKeyPress = Object(react__WEBPACK_IMPORTED_MODULE_0__["useCallback"])(event => {
    keysPressed[event.key] = true;

    if (keysPressed['Control'] || keysPressed['Meta'] && event.key === 'k') {
      focusSearch(event);
    }
  }, []);
  Object(react__WEBPACK_IMPORTED_MODULE_0__["useEffect"])(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyUnPress); // remove the event listener

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('keyup', handleKeyUnPress);
    };
  }, [handleKeyPress]);
  return __jsx("header", {
    className: "sticky",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 38,
      columnNumber: 9
    }
  }, __jsx("div", {
    className: "p-[12px] text-center bg-[#2a425c] text-white xs:text-[12px] xs:p-[13px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 39,
      columnNumber: 13
    }
  }, "Support Ukraine \uD83C\uDDFA\uD83C\uDDE6 ", __jsx("a", {
    target: "_blank",
    rel: "noopener noreferrer",
    href: "https://opensource.facebook.com/support-ukraine",
    className: "underline",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 40,
      columnNumber: 38
    }
  }, " Help Provide Humanitarian Aid to Ukraine"), "."), __jsx("div", {
    className: "mb-4 border-b border-gray-200 dark:border-gray-700 px-10 xs:px-2",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 42,
      columnNumber: 13
    }
  }, __jsx("div", {
    className: "flex",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 43,
      columnNumber: 17
    }
  }, __jsx("div", {
    className: "flex w-[33%]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 44,
      columnNumber: 21
    }
  }, __jsx("ul", {
    className: "flex flex-wrap -mb-px text-sm font-medium text-center",
    id: "myTab",
    "data-tabs-toggle": "#myTabContent",
    role: "tablist",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 45,
      columnNumber: 25
    }
  }, __jsx("li", {
    className: "mr-20 justify-content flex",
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 46,
      columnNumber: 29
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
    to: "/",
    className: "text-[20px] inline-block p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 dark:hover:text-gray-300 pointer text-[#4277ad]",
    id: "home",
    "data-tabs-target": "#home",
    type: "button",
    role: "tab",
    "aria-controls": "profile",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 47,
      columnNumber: 33
    }
  }, __jsx("b", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 48,
      columnNumber: 37
    }
  }, "Ness.js")), __jsx("span", {
    className: "text-[13px] text-slate-500 my-auto xs:hidden",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 50,
      columnNumber: 33
    }
  }, "Newest Experience of Server Side development.")))), __jsx("div", {
    className: "flex w-[33%] xs:hidden",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 56,
      columnNumber: 21
    }
  }, __jsx("ul", {
    className: "flex flex-wrap -mb-px text-sm font-medium text-center",
    id: "myTab",
    "data-tabs-toggle": "#myTabContent",
    role: "tablist",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 57,
      columnNumber: 25
    }
  }, __jsx("li", {
    className: "mr-2",
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 58,
      columnNumber: 29
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
    to: "/",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 59,
      columnNumber: 32
    }
  }, __jsx("button", {
    className: `inline-block p-4 rounded-t-lg border-b-2 ${props.active !== 'default' ? 'border-transparent' : ''}`,
    id: "profile-tab",
    "data-tabs-target": "#profile",
    type: "button",
    role: "tab",
    "aria-controls": "profile",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 60,
      columnNumber: 37
    }
  }, "Introduction"))), __jsx("li", {
    className: "mr-2",
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 63,
      columnNumber: 29
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
    to: "/getting-started",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 64,
      columnNumber: 33
    }
  }, __jsx("button", {
    className: `inline-block p-4 rounded-t-lg border-b-2 ${props.active !== 'getting-started' ? 'border-transparent' : ''} hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300`,
    id: "dashboard-tab",
    "data-tabs-target": "#dashboard",
    type: "button",
    role: "tab",
    "aria-controls": "dashboard",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 65,
      columnNumber: 37
    }
  }, "Getting Started"))), __jsx("li", {
    className: "mr-2",
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 68,
      columnNumber: 29
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_1__["Link"], {
    to: "/documentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 69,
      columnNumber: 33
    }
  }, __jsx("button", {
    className: `inline-block p-4 rounded-t-lg border-b-2 ${props.active !== 'documentation' ? 'border-transparent' : ''} hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300`,
    id: "settings-tab",
    "data-tabs-target": "#settings",
    type: "button",
    role: "tab",
    "aria-controls": "settings",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 70,
      columnNumber: 37
    }
  }, "Documentation"))), __jsx("li", {
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 73,
      columnNumber: 29
    }
  }, __jsx("a", {
    href: "https://github.com/firstcontributions/first-contributions",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 74,
      columnNumber: 33
    }
  }, __jsx("button", {
    className: `inline-block p-4 rounded-t-lg border-b-2 ${props.active !== 'contributing' ? 'border-transparent' : ''} hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300`,
    id: "contacts-tab",
    "data-tabs-target": "#contacts",
    type: "button",
    role: "tab",
    "aria-controls": "contacts",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 75,
      columnNumber: 37
    }
  }, "Contributing"))))), __jsx("div", {
    className: "flex w-[33%]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 80,
      columnNumber: 21
    }
  }, __jsx("nav", {
    className: "mt-1.5 ml-auto xs:ml-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 81,
      columnNumber: 25
    }
  }, __jsx("div", {
    className: "flex",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 82,
      columnNumber: 29
    }
  }, __jsx("nav", {
    className: "mr-5 flex xs:hidden",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 83,
      columnNumber: 33
    }
  }, __jsx("a", {
    href: "https://github.com/leroywagner/Ness.js",
    "data-tooltip-target": "tooltip-github-2",
    className: "hidden sm:inline-block text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 mr-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 84,
      columnNumber: 37
    }
  }, __jsx("svg", {
    className: "w-5 h-5",
    "aria-hidden": "true",
    focusable: "false",
    "data-prefix": "fab",
    "data-icon": "github",
    role: "img",
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 496 512",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 85,
      columnNumber: 41
    }
  }, __jsx("path", {
    fill: "currentColor",
    d: "M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 85,
      columnNumber: 208
    }
  })), __jsx("span", {
    className: "sr-only",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 86,
      columnNumber: 41
    }
  }, "View on Github")), __jsx("button", {
    disabled: true,
    type: "button",
    className: "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 inline-flex items-center",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 88,
      columnNumber: 37
    }
  }, __jsx("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    "aria-hidden": "true",
    className: "w-5 h-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 88,
      columnNumber: 281
    }
  }, __jsx("path", {
    d: "M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 88,
      columnNumber: 400
    }
  })))), __jsx("form", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 90,
      columnNumber: 33
    }
  }, __jsx("label", {
    htmlFor: "search",
    className: "mb-3 text-sm font-medium text-gray-900 sr-only dark:text-gray-300",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 91,
      columnNumber: 37
    }
  }, "Your Email"), __jsx("div", {
    className: "relative flex mt-[1px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 92,
      columnNumber: 37
    }
  }, __jsx("div", {
    className: "flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 93,
      columnNumber: 41
    }
  }, __jsx("svg", {
    "aria-hidden": "true",
    className: "w-5 h-5 text-gray-500 dark:text-gray-400",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 94,
      columnNumber: 45
    }
  }, __jsx("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "2",
    d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 94,
      columnNumber: 211
    }
  }))), __jsx("input", {
    ref: seacrhInput,
    type: "search",
    id: "search",
    className: "block p-2 pl-10 text-sm text-gray-900 bg-gray-100 rounded-lg border border-gray-200 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500",
    placeholder: "Search",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 96,
      columnNumber: 41
    }
  }), __jsx("button", {
    onClick: focusSearch,
    style: {
      'marginTop': '4.8px'
    },
    className: "border-gray-300 text-slate-500 absolute right-1.5 m-auto hover:bg-slate-200 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-1 py-1 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 97,
      columnNumber: 41
    }
  }, "\u2318K")))))))));
}

/* harmony default export */ __webpack_exports__["default"] = (Header);

/***/ })

};
//# sourceMappingURL=main.c219c05c21d86fe007f1.hot-update.js.map