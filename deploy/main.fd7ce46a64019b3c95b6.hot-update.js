exports.id = "main";
exports.modules = {

/***/ "./src/components/ui/Navbar/index.js":
/*!*******************************************!*\
  !*** ./src/components/ui/Navbar/index.js ***!
  \*******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/components/ui/Navbar/index.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;


function Navbar(_ref) {
  let {
    children
  } = _ref;
  const childrenWithProps = react__WEBPACK_IMPORTED_MODULE_0___default.a.Children.map(children, child => {
    // Checking isValidElement is the safe way and avoids a typescript
    // error too.
    if ( /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.isValidElement(child)) {
      return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.cloneElement(child);
    }

    return child;
  });
  return __jsx("nav", {
    className: "navbar w-[25%] xs:w-[100%] xs:mt-[-15px] xs:mb-10",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 13,
      columnNumber: 12
    }
  }, childrenWithProps);
}

/* harmony default export */ __webpack_exports__["default"] = (Navbar);

/***/ })

};
//# sourceMappingURL=main.fd7ce46a64019b3c95b6.hot-update.js.map