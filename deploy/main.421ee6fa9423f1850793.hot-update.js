exports.id = "main";
exports.modules = {

/***/ "./src/pages/QuickStart.js":
/*!*********************************!*\
  !*** ./src/pages/QuickStart.js ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-helmet */ "react-helmet");
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_helmet__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-router-dom */ "react-router-dom");
/* harmony import */ var react_router_dom__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_router_dom__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! nessapp/next/ui */ "nessapp/next/ui");
/* harmony import */ var nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _components_ui_Header__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../components/ui/Header */ "./src/components/ui/Header/index.js");
/* harmony import */ var _components_ui_Container__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../components/ui/Container */ "./src/components/ui/Container/index.js");
/* harmony import */ var _components_ui_Flex__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../components/ui/Flex */ "./src/components/ui/Flex/index.js");
/* harmony import */ var _components_ui_Navbar__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../components/ui/Navbar */ "./src/components/ui/Navbar/index.js");
/* harmony import */ var _styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../styles/Home.module.scss */ "./src/styles/Home.module.scss");
/* harmony import */ var _styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(_styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_8__);
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/pages/QuickStart.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;


 // layout

 // components




 // Home module stylesheet



function QuickStart(props) {
  const {
    0: state,
    1: setState
  } = Object(react__WEBPACK_IMPORTED_MODULE_0__["useState"])(0);
  const code = `module.exports = {
    "plugins": [
        {
            name: 'tailwind',
            options: {
                postcss: {
                    dev: {
                        sourceMap: false,
                    },
                },
            },
        },
    ]
}
`;
  return __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__["Page"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 5
    }
  }, __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__["Head"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 38,
      columnNumber: 7
    }
  }, __jsx(react_helmet__WEBPACK_IMPORTED_MODULE_1__["Helmet"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 39,
      columnNumber: 9
    }
  }, __jsx("title", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 40,
      columnNumber: 11
    }
  }, "Getting Started | NessApp"), __jsx("meta", {
    name: "description",
    content: "Thanks for installing this application!",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 41,
      columnNumber: 11
    }
  }))), __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_3__["Layout"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 44,
      columnNumber: 7
    }
  }, __jsx(_components_ui_Header__WEBPACK_IMPORTED_MODULE_4__["default"], {
    active: "getting-started",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 45,
      columnNumber: 9
    }
  }), __jsx(_components_ui_Container__WEBPACK_IMPORTED_MODULE_5__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 46,
      columnNumber: 9
    }
  }, __jsx("div", {
    className: "m-auto",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 47,
      columnNumber: 11
    }
  }, __jsx(_components_ui_Flex__WEBPACK_IMPORTED_MODULE_6__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 48,
      columnNumber: 13
    }
  }, __jsx(_components_ui_Navbar__WEBPACK_IMPORTED_MODULE_7__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 49,
      columnNumber: 17
    }
  }, __jsx("ul", {
    className: "p-0 bg-slate-0 rounded-md ml-9 border-r border-slate-200 rounded-r-none sticky",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 50,
      columnNumber: 17
    }
  }, __jsx("li", {
    className: "text-slate-200 rounded-lg p-3 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 52,
      columnNumber: 19
    }
  }, __jsx("div", {
    className: "bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 53,
      columnNumber: 21
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_2__["Link"], {
    to: "/",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 54,
      columnNumber: 25
    }
  }, "Introduction")), __jsx("ul", {
    className: "ml-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 56,
      columnNumber: 21
    }
  }, __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 57,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#about",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 58,
      columnNumber: 25
    }
  }, "- What is Ness.js?")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 62,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#why-to-use",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 63,
      columnNumber: 25
    }
  }, "- Why to use Ness.js?")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 67,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#development-experience",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 68,
      columnNumber: 25
    }
  }, "- Development experience")))), __jsx("li", {
    className: "active text-slate-200 rounded-lg p-3 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 75,
      columnNumber: 19
    }
  }, __jsx("div", {
    className: "bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 76,
      columnNumber: 21
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_2__["Link"], {
    to: "/getting-started",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 77,
      columnNumber: 25
    }
  }, "Getting Started")), __jsx("ul", {
    className: "ml-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 79,
      columnNumber: 21
    }
  }, __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 80,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#quick-start",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 81,
      columnNumber: 25
    }
  }, "- Installing Ness CLI")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 85,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#why-to-use",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 86,
      columnNumber: 25
    }
  }, "- Setup a new application")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 90,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#development-experience",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 91,
      columnNumber: 25
    }
  }, "- Commands")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 95,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#development-experience",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 96,
      columnNumber: 25
    }
  }, "- Plugins")))), __jsx("li", {
    className: "text-slate-200 rounded-lg p-3 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 103,
      columnNumber: 19
    }
  }, __jsx("div", {
    className: "bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 104,
      columnNumber: 21
    }
  }, __jsx(react_router_dom__WEBPACK_IMPORTED_MODULE_2__["Link"], {
    to: "/documentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 105,
      columnNumber: 25
    }
  }, "Documentation")), __jsx("ul", {
    className: "ml-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 107,
      columnNumber: 21
    }
  }, __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 108,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#quick-start",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 109,
      columnNumber: 25
    }
  }, "- Installing Ness CLI")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 113,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#why-to-use",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 114,
      columnNumber: 25
    }
  }, "- Setup a new application")), __jsx("li", {
    className: "rounded-md p-3 text-slate-500 px-4 text-[15px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 118,
      columnNumber: 23
    }
  }, __jsx("a", {
    href: "#development-experience",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 119,
      columnNumber: 25
    }
  }, "- Commands")))))), __jsx("main", {
    className: "ml-10 w-[50%] p-10 pt-0",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 127,
      columnNumber: 15
    }
  }, __jsx("div", {
    className: "mb-10 font-light pb-2",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 128,
      columnNumber: 17
    }
  }, __jsx("h1", {
    className: "text-[40px]",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 129,
      columnNumber: 19
    }
  }, "Getting Started"), __jsx("p", {
    className: "text-slate-500 mt-2",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 130,
      columnNumber: 19
    }
  }, "Installation, commands and plugins.")), __jsx("div", {
    className: "bg-slate-0 p-0 rounded-lg",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 132,
      columnNumber: 17
    }
  }, __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 133,
      columnNumber: 19
    }
  }, __jsx("h2", {
    id: "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 134,
      columnNumber: 21
    }
  }, __jsx("button", {
    type: "button",
    className: "flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white",
    "data-accordion-target": "#accordion-flush-body-1",
    "aria-expanded": "true",
    "aria-controls": "accordion-flush-body-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 135,
      columnNumber: 23
    }
  }, __jsx("span", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 136,
      columnNumber: 25
    }
  }, "Installing Ness CLI"))), __jsx("div", {
    id: "accordion-flush-body-1",
    className: "",
    "aria-labelledby": "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 139,
      columnNumber: 21
    }
  }, __jsx("div", {
    className: "py-5 font-light border-b border-gray-200 dark:border-gray-700",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 140,
      columnNumber: 25
    }
  }, __jsx("p", {
    className: "mb-4 text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 141,
      columnNumber: 29
    }
  }, "Use command below for installing client, you may use: npx, npm & yarn:"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 142,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 143,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 144,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 145,
      columnNumber: 41
    }
  }, "$ npm install -g create-ness-app@latest")))), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 149,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 150,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 151,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 152,
      columnNumber: 41
    }
  }, "$ npx create-ness-app")))), __jsx("p", {
    className: "p-4 border-l-4 border-slate-100 my-5 py-2 text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 156,
      columnNumber: 29
    }
  }, "Note that we prefer using npx, because of latest version. If you will using npx go next step"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 159,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 160,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 161,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 162,
      columnNumber: 41
    }
  }, "$ yarn global add create-ness-app@latest")))), __jsx("p", {
    className: "mt-5 text-gray-500 dark:text-gray-400 code-description",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 166,
      columnNumber: 29
    }
  }, "If you've previously installed", __jsx("code", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 168,
      columnNumber: 33
    }
  }, "create-ness-app"), "globally using", __jsx("code", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 169,
      columnNumber: 33
    }
  }, "npm install -g create-ness-app"), ", we recommend you uninstall the package by", __jsx("code", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 170,
      columnNumber: 33
    }
  }, "npm uninstall -g create-ness-app"), "or", __jsx("code", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 171,
      columnNumber: 33
    }
  }, "yarn global remove create-ness-app"), "to ensure that npx always uses the latest version.")))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 176,
      columnNumber: 19
    }
  }, __jsx("h2", {
    id: "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 177,
      columnNumber: 21
    }
  }, __jsx("button", {
    type: "button",
    className: "flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white",
    "data-accordion-target": "#accordion-flush-body-1",
    "aria-expanded": "true",
    "aria-controls": "accordion-flush-body-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 178,
      columnNumber: 23
    }
  }, __jsx("span", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 179,
      columnNumber: 25
    }
  }, "Setup a new application"))), __jsx("div", {
    id: "accordion-flush-body-1",
    className: "",
    "aria-labelledby": "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 182,
      columnNumber: 21
    }
  }, __jsx("div", {
    className: "py-5 font-light border-b border-gray-200 dark:border-gray-700",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 183,
      columnNumber: 23
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 184,
      columnNumber: 25
    }
  }, "Now you abble to setup a new project, use next command:"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 185,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 186,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 187,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 188,
      columnNumber: 41
    }
  }, "$ npx create-ness-app")))), __jsx("p", {
    className: "p-4 border-l-4 border-slate-100 my-5 py-2 text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 192,
      columnNumber: 29
    }
  }, "or (by default)"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 193,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 194,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 195,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 196,
      columnNumber: 41
    }
  }, "$ create-ness-app")))), __jsx("p", {
    className: "mb-2 text-gray-500 dark:text-gray-400 mt-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 200,
      columnNumber: 25
    }
  }, "Now you must set project name and location where to setup. For example:"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 201,
      columnNumber: 25
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 202,
      columnNumber: 29
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 203,
      columnNumber: 33
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 204,
      columnNumber: 37
    }
  }, __jsx("i", {
    className: "text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 205,
      columnNumber: 41
    }
  }, "How we will name your project?(ness-app):"), " ness-app")), __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 208,
      columnNumber: 33
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 209,
      columnNumber: 37
    }
  }, __jsx("i", {
    className: "text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 210,
      columnNumber: 41
    }
  }, "Where do you want to locate your project?(current directory):"))), __jsx("br", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 213,
      columnNumber: 33
    }
  }), __jsx("div", {
    className: "token-line !color-slate-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 214,
      columnNumber: 33
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 215,
      columnNumber: 37
    }
  }, __jsx("i", {
    className: "text-slate-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 216,
      columnNumber: 41
    }
  }, "Creating ness.js app ness-app in ness-app")))))))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 224,
      columnNumber: 19
    }
  }, __jsx("h2", {
    id: "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 225,
      columnNumber: 21
    }
  }, __jsx("button", {
    type: "button",
    className: "flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white",
    "data-accordion-target": "#accordion-flush-body-1",
    "aria-expanded": "true",
    "aria-controls": "accordion-flush-body-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 226,
      columnNumber: 23
    }
  }, __jsx("span", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 227,
      columnNumber: 25
    }
  }, "Availbale commands"))), __jsx("div", {
    id: "accordion-flush-body-1",
    className: "",
    "aria-labelledby": "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 230,
      columnNumber: 21
    }
  }, __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 231,
      columnNumber: 25
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-700 dark:text-gray-700 mt-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 232,
      columnNumber: 29
    }
  }, "Running development server with hot-reload on port 3000"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 233,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 234,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 235,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 236,
      columnNumber: 41
    }
  }, "$ npm run start"))))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 241,
      columnNumber: 25
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-700 dark:text-gray-700 mt-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 242,
      columnNumber: 29
    }
  }, "Building server"), __jsx("p", {
    className: "mb-2 text-gray-500 dark:text-gray-400 mt-5 code-description",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 243,
      columnNumber: 29
    }
  }, "You may pass", __jsx("code", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 243,
      columnNumber: 116
    }
  }, "NODE_ENV=production"), "directly or", __jsx("code", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 243,
      columnNumber: 159
    }
  }, "NODE_ENV=development")), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 244,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 245,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 246,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 247,
      columnNumber: 41
    }
  }, "$ npm run build"))))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 252,
      columnNumber: 25
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-700 dark:text-gray-700 mt-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 253,
      columnNumber: 29
    }
  }, "Generate component, hook, page and others"), __jsx("p", {
    className: "mb-2 text-gray-500 dark:text-gray-400 mt-5 code-description",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 254,
      columnNumber: 29
    }
  }, "Available types:", __jsx("div", {
    className: "mt-2",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 255,
      columnNumber: 33
    }
  }, __jsx(_components_ui_Flex__WEBPACK_IMPORTED_MODULE_6__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 256,
      columnNumber: 37
    }
  }, __jsx("div", {
    className: "p-2 border-[1.5px] border-slate-100 rounded-lg mr-2 py-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 257,
      columnNumber: 41
    }
  }, "page"), __jsx("div", {
    className: "p-2 border-[1.5px] border-slate-100 rounded-lg mr-2 py-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 258,
      columnNumber: 41
    }
  }, "hook"), __jsx("div", {
    className: "p-2 border-[1.5px] border-slate-100 rounded-lg mr-2 py-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 259,
      columnNumber: 41
    }
  }, "service"), __jsx("div", {
    className: "p-2 border-[1.5px] border-slate-100 rounded-lg mr-2 py-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 260,
      columnNumber: 41
    }
  }, "component")))), __jsx("p", {
    className: "mb-2 text-gray-500 dark:text-gray-400 mt-5 code-description",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 264,
      columnNumber: 29
    }
  }, "Example:"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 265,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 266,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 267,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 268,
      columnNumber: 41
    }
  }, "$ nessapp generate *type* *path*"))))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 273,
      columnNumber: 25
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-700 dark:text-gray-700 mt-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 274,
      columnNumber: 29
    }
  }, "Start production server"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 275,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 276,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 277,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 278,
      columnNumber: 41
    }
  }, "$ npm run start:prod"))))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 283,
      columnNumber: 25
    }
  }, __jsx("p", {
    className: "mb-2 text-gray-700 dark:text-gray-700 mt-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 284,
      columnNumber: 29
    }
  }, "Start testing"), __jsx("pre", {
    className: "text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 285,
      columnNumber: 29
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 286,
      columnNumber: 33
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 287,
      columnNumber: 37
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 288,
      columnNumber: 41
    }
  }, "$ npm run test")))))), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 294,
      columnNumber: 21
    }
  }, __jsx("h2", {
    id: "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 295,
      columnNumber: 25
    }
  }, __jsx("button", {
    type: "button",
    className: "flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white",
    "data-accordion-target": "#accordion-flush-body-1",
    "aria-expanded": "true",
    "aria-controls": "accordion-flush-body-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 296,
      columnNumber: 29
    }
  }, __jsx("span", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 297,
      columnNumber: 33
    }
  }, "Plugins"))), __jsx("div", {
    id: "accordion-flush-body-1",
    className: "",
    "aria-labelledby": "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 300,
      columnNumber: 25
    }
  }, __jsx("div", {
    className: "py-5 font-light border-b border-gray-200 dark:border-gray-700",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 301,
      columnNumber: 29
    }
  }, __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 302,
      columnNumber: 33
    }
  }, __jsx("b", {
    className: "mb-4 code-description text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 303,
      columnNumber: 37
    }
  }, "After installing plugins include them in", __jsx("code", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 303,
      columnNumber: 129
    }
  }, "ness.config.js")), __jsx("pre", {
    className: "mt-5 text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 304,
      columnNumber: 37
    }
  }, __jsx("code", {
    class: "prism-code language-js",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 305,
      columnNumber: 41
    }
  }, __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 306,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 307,
      columnNumber: 49
    }
  }, "module"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 308,
      columnNumber: 49
    }
  }, "."), __jsx("span", {
    class: "token property-access",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 309,
      columnNumber: 49
    }
  }, "exports"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 310,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token operator",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 311,
      columnNumber: 49
    }
  }, "="), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 312,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 313,
      columnNumber: 49
    }
  }, "{"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 314,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 316,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 317,
      columnNumber: 49
    }
  }, "  plugins"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 318,
      columnNumber: 49
    }
  }, ":"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 319,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 320,
      columnNumber: 49
    }
  }, "["), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 321,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 323,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 324,
      columnNumber: 49
    }
  }, "    "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 325,
      columnNumber: 49
    }
  }, "{"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 326,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 328,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 329,
      columnNumber: 49
    }
  }, "      name"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 330,
      columnNumber: 49
    }
  }, ":"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 331,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token string",
    style: {
      color: "rgb(2, 130, 101)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 332,
      columnNumber: 49
    }
  }, "'tailwind'"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 333,
      columnNumber: 49
    }
  }, ","), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 334,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 336,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 337,
      columnNumber: 49
    }
  }, "      options"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 338,
      columnNumber: 49
    }
  }, ":"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 339,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 340,
      columnNumber: 49
    }
  }, "{"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 341,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 343,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 344,
      columnNumber: 49
    }
  }, "        postcss"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 345,
      columnNumber: 49
    }
  }, ":"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 346,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 347,
      columnNumber: 49
    }
  }, "{"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 348,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 350,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 351,
      columnNumber: 49
    }
  }, "          dev"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 352,
      columnNumber: 49
    }
  }, ":"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 353,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 354,
      columnNumber: 49
    }
  }, "{"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 355,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 357,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 358,
      columnNumber: 49
    }
  }, "            sourceMap"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 359,
      columnNumber: 49
    }
  }, ":"), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 360,
      columnNumber: 49
    }
  }, " "), __jsx("span", {
    class: "token boolean",
    style: {
      color: "rgb(217, 147, 30)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 361,
      columnNumber: 49
    }
  }, "true"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 362,
      columnNumber: 49
    }
  }, ","), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 363,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 365,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 366,
      columnNumber: 49
    }
  }, "          "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 367,
      columnNumber: 49
    }
  }, "}"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 368,
      columnNumber: 49
    }
  }, ","), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 369,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 371,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 372,
      columnNumber: 49
    }
  }, "        "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 373,
      columnNumber: 49
    }
  }, "}"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 374,
      columnNumber: 49
    }
  }, ","), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 375,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 377,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 378,
      columnNumber: 49
    }
  }, "      "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 379,
      columnNumber: 49
    }
  }, "}"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 380,
      columnNumber: 49
    }
  }, ","), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 381,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 383,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 384,
      columnNumber: 49
    }
  }, "    "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 385,
      columnNumber: 49
    }
  }, "}"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 386,
      columnNumber: 49
    }
  }, ","), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 387,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 389,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 390,
      columnNumber: 49
    }
  }, "  "), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 391,
      columnNumber: 49
    }
  }, "]"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 392,
      columnNumber: 49
    }
  }, ","), __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 393,
      columnNumber: 49
    }
  })), __jsx("div", {
    class: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 395,
      columnNumber: 45
    }
  }, __jsx("span", {
    class: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 396,
      columnNumber: 49
    }
  }), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 397,
      columnNumber: 49
    }
  }, "}"), __jsx("span", {
    class: "token punctuation",
    style: {
      color: "rgb(51, 51, 51)"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 398,
      columnNumber: 49
    }
  }, ";"))))))), __jsx("div", {
    id: "accordion-flush-body-1",
    className: "",
    "aria-labelledby": "accordion-flush-heading-1",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 405,
      columnNumber: 25
    }
  }, __jsx("div", {
    className: "py-5 font-light border-b border-gray-200 dark:border-gray-700",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 406,
      columnNumber: 29
    }
  }, __jsx("p", {
    className: "mb-4 text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 407,
      columnNumber: 33
    }
  }, "Available plugins:"), __jsx("div", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 409,
      columnNumber: 33
    }
  }, __jsx("b", {
    className: "mb-4",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 410,
      columnNumber: 37
    }
  }, "Plugin ness-tailwind will setup tailwind in your application, it using SASS."), __jsx("pre", {
    className: "mt-4 text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 411,
      columnNumber: 37
    }
  }, __jsx("code", {
    className: "prism-code language-sh",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 412,
      columnNumber: 41
    }
  }, __jsx("div", {
    className: "token-line",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 413,
      columnNumber: 45
    }
  }, __jsx("span", {
    className: "token plain",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 414,
      columnNumber: 49
    }
  }, "$ npm install ness-tailwind@latest")))))))))), __jsx("div", {
    className: "mt-10",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 424,
      columnNumber: 17
    }
  }, __jsx(_components_ui_Flex__WEBPACK_IMPORTED_MODULE_6__["default"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 425,
      columnNumber: 19
    }
  }, __jsx("a", {
    href: "/",
    disabled: true,
    className: "mr-auto inline-flex items-center py-2 px-4 mr-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 426,
      columnNumber: 21
    }
  }, __jsx("svg", {
    "aria-hidden": "true",
    className: "mr-2 w-5 h-5",
    fill: "currentColor",
    viewBox: "0 0 20 20",
    xmlns: "http://www.w3.org/2000/svg",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 427,
      columnNumber: 23
    }
  }, __jsx("path", {
    "fill-rule": "evenodd",
    d: "M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z",
    "clip-rule": "evenodd",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 427,
      columnNumber: 147
    }
  })), "Previous: Introduction"), __jsx("a", {
    href: "/documentation",
    className: "inline-flex items-center py-2 px-4 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 430,
      columnNumber: 21
    }
  }, "Next: Documentation", __jsx("svg", {
    "aria-hidden": "true",
    className: "ml-2 w-5 h-5",
    fill: "currentColor",
    viewBox: "0 0 20 20",
    xmlns: "http://www.w3.org/2000/svg",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 432,
      columnNumber: 23
    }
  }, __jsx("path", {
    "fill-rule": "evenodd",
    d: "M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z",
    "clip-rule": "evenodd",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 432,
      columnNumber: 147
    }
  })))))))))));
}

/* harmony default export */ __webpack_exports__["default"] = (QuickStart);

/***/ })

};
//# sourceMappingURL=main.421ee6fa9423f1850793.hot-update.js.map