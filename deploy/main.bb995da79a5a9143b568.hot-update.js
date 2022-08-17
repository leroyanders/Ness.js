exports.id = "main";
exports.modules = {

/***/ "./src/components/ui/Header/index.js":
/*!*******************************************!*\
  !*** ./src/components/ui/Header/index.js ***!
  \*******************************************/
/*! exports provided: Header */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Header", function() { return Header; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/components/ui/Header/index.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;

function Header(props) {
  return __jsx("header", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 5,
      columnNumber: 9
    }
  }, __jsx("div", {
    className: "mb-4 border-b border-gray-200 dark:border-gray-700",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 6,
      columnNumber: 13
    }
  }, __jsx("ul", {
    className: "flex flex-wrap -mb-px text-sm font-medium text-center",
    id: "myTab",
    "data-tabs-toggle": "#myTabContent",
    role: "tablist",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 7,
      columnNumber: 17
    }
  }, __jsx("li", {
    className: "mr-2",
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 8,
      columnNumber: 21
    }
  }, __jsx("button", {
    className: "inline-block p-4 rounded-t-lg border-b-2",
    id: "profile-tab",
    "data-tabs-target": "#profile",
    type: "button",
    role: "tab",
    "aria-controls": "profile",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 9,
      columnNumber: 25
    }
  }, "Profile")), __jsx("li", {
    className: "mr-2",
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 11,
      columnNumber: 21
    }
  }, __jsx("button", {
    className: "inline-block p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300",
    id: "dashboard-tab",
    "data-tabs-target": "#dashboard",
    type: "button",
    role: "tab",
    "aria-controls": "dashboard",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 12,
      columnNumber: 25
    }
  }, "Dashboard")), __jsx("li", {
    className: "mr-2",
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 14,
      columnNumber: 21
    }
  }, __jsx("button", {
    className: "inline-block p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300",
    id: "settings-tab",
    "data-tabs-target": "#settings",
    type: "button",
    role: "tab",
    "aria-controls": "settings",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 15,
      columnNumber: 25
    }
  }, "Settings")), __jsx("li", {
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 17,
      columnNumber: 21
    }
  }, __jsx("button", {
    className: "inline-block p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300",
    id: "contacts-tab",
    "data-tabs-target": "#contacts",
    type: "button",
    role: "tab",
    "aria-controls": "contacts",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 18,
      columnNumber: 25
    }
  }, "Contacts")))), __jsx("div", {
    id: "myTabContent",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 22,
      columnNumber: 13
    }
  }, __jsx("div", {
    className: "hidden p-4 bg-gray-50 rounded-lg dark:bg-gray-800",
    id: "profile",
    role: "tabpanel",
    "aria-labelledby": "profile-tab",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 23,
      columnNumber: 17
    }
  }, __jsx("p", {
    className: "text-sm text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 24,
      columnNumber: 21
    }
  }, "This is some placeholder content the ", __jsx("strong", {
    className: "font-medium text-gray-800 dark:text-white",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 24,
      columnNumber: 114
    }
  }, "Profile tab's associated content"), ". Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classNamees to control the content visibility and styling.")), __jsx("div", {
    className: "hidden p-4 bg-gray-50 rounded-lg dark:bg-gray-800",
    id: "dashboard",
    role: "tabpanel",
    "aria-labelledby": "dashboard-tab",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 26,
      columnNumber: 17
    }
  }, __jsx("p", {
    className: "text-sm text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 27,
      columnNumber: 21
    }
  }, "This is some placeholder content the ", __jsx("strong", {
    className: "font-medium text-gray-800 dark:text-white",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 27,
      columnNumber: 114
    }
  }, "Dashboard tab's associated content"), ". Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classNamees to control the content visibility and styling.")), __jsx("div", {
    className: "hidden p-4 bg-gray-50 rounded-lg dark:bg-gray-800",
    id: "settings",
    role: "tabpanel",
    "aria-labelledby": "settings-tab",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 29,
      columnNumber: 17
    }
  }, __jsx("p", {
    className: "text-sm text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 30,
      columnNumber: 21
    }
  }, "This is some placeholder content the ", __jsx("strong", {
    className: "font-medium text-gray-800 dark:text-white",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 30,
      columnNumber: 114
    }
  }, "Settings tab's associated content"), ". Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classNamees to control the content visibility and styling.")), __jsx("div", {
    className: "hidden p-4 bg-gray-50 rounded-lg dark:bg-gray-800",
    id: "contacts",
    role: "tabpanel",
    "aria-labelledby": "contacts-tab",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 32,
      columnNumber: 17
    }
  }, __jsx("p", {
    className: "text-sm text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 33,
      columnNumber: 21
    }
  }, "This is some placeholder content the ", __jsx("strong", {
    className: "font-medium text-gray-800 dark:text-white",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 33,
      columnNumber: 114
    }
  }, "Contacts tab's associated content"), ". Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classNamees to control the content visibility and styling."))));
}

/***/ })

};
//# sourceMappingURL=main.bb995da79a5a9143b568.hot-update.js.map