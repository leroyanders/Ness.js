exports.id = "main";
exports.modules = {

/***/ "./src/pages/Home.js":
/*!***************************!*\
  !*** ./src/pages/Home.js ***!
  \***************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _components_paragraph_component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../components/paragraph.component */ "./src/components/paragraph.component.js");
/* harmony import */ var nessapp_next_ui__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! nessapp/next/ui */ "nessapp/next/ui");
/* harmony import */ var nessapp_next_ui__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react-helmet */ "react-helmet");
/* harmony import */ var react_helmet__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_helmet__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../styles/Home.module.scss */ "./src/styles/Home.module.scss");
/* harmony import */ var _styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_styles_Home_module_scss__WEBPACK_IMPORTED_MODULE_4__);
var _jsxFileName = "/Users/leroywagner/Desktop/Projects/react/nesspkg/ness-app/src/pages/Home.js";
var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;



 // Home module stylesheet



function Home(props) {
  const {
    0: state,
    1: setState
  } = Object(react__WEBPACK_IMPORTED_MODULE_0__["useState"])(0);
  return __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_2__["Page"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 12,
      columnNumber: 5
    }
  }, __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_2__["Head"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 13,
      columnNumber: 7
    }
  }, __jsx(react_helmet__WEBPACK_IMPORTED_MODULE_3__["Helmet"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 14,
      columnNumber: 9
    }
  }, __jsx("title", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 15,
      columnNumber: 11
    }
  }, "Welcome to NessApp"), __jsx("meta", {
    name: "description",
    content: "Thanks for installing this application!",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 16,
      columnNumber: 11
    }
  }))), __jsx(nessapp_next_ui__WEBPACK_IMPORTED_MODULE_2__["Layout"], {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 19,
      columnNumber: 7
    }
  }, __jsx("div", {
    class: "mb-4 border-b border-gray-200 dark:border-gray-700",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 20,
      columnNumber: 9
    }
  }, __jsx("ul", {
    class: "flex flex-wrap -mb-px text-sm font-medium text-center",
    id: "myTab",
    "data-tabs-toggle": "#myTabContent",
    role: "tablist",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 21,
      columnNumber: 13
    }
  }, __jsx("li", {
    class: "mr-2",
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 22,
      columnNumber: 17
    }
  }, __jsx("button", {
    class: "inline-block p-4 rounded-t-lg border-b-2",
    id: "profile-tab",
    "data-tabs-target": "#profile",
    type: "button",
    role: "tab",
    "aria-controls": "profile",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 23,
      columnNumber: 21
    }
  }, "Profile")), __jsx("li", {
    class: "mr-2",
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 25,
      columnNumber: 17
    }
  }, __jsx("button", {
    class: "inline-block p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300",
    id: "dashboard-tab",
    "data-tabs-target": "#dashboard",
    type: "button",
    role: "tab",
    "aria-controls": "dashboard",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 26,
      columnNumber: 21
    }
  }, "Dashboard")), __jsx("li", {
    class: "mr-2",
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 28,
      columnNumber: 17
    }
  }, __jsx("button", {
    class: "inline-block p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300",
    id: "settings-tab",
    "data-tabs-target": "#settings",
    type: "button",
    role: "tab",
    "aria-controls": "settings",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 29,
      columnNumber: 21
    }
  }, "Settings")), __jsx("li", {
    role: "presentation",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 31,
      columnNumber: 17
    }
  }, __jsx("button", {
    class: "inline-block p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300",
    id: "contacts-tab",
    "data-tabs-target": "#contacts",
    type: "button",
    role: "tab",
    "aria-controls": "contacts",
    "aria-selected": "false",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 32,
      columnNumber: 21
    }
  }, "Contacts")))), __jsx("div", {
    class: "sidebar w-full p-4 pb-40 md:pb-16 h-full overflow-y-auto",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 9
    }
  }, __jsx("ul", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 79
    }
  }, __jsx("li", {
    class: "active",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 83
    }
  }, __jsx("a", {
    href: "/",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 102
    }
  }, "Introduction"), __jsx("ul", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 130
    }
  }, __jsx("li", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 134
    }
  }, __jsx("a", {
    href: "#not-ready-for-razzle-4-0",
    class: "focus:shadow-outline",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 138
    }
  }, __jsx("span", {
    class: "flex",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 203
    }
  }, __jsx("span", {
    class: "mr-2 opacity-25",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 222
    }
  }, "#"), __jsx("span", {
    class: "inline-block",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 260
    }
  }, "Not ready for Razzle 4.0?")))), __jsx("li", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 335
    }
  }, __jsx("a", {
    href: "#getting-help",
    class: "focus:shadow-outline",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 339
    }
  }, __jsx("span", {
    class: "flex",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 392
    }
  }, __jsx("span", {
    class: "mr-2 opacity-25",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 411
    }
  }, "#"), __jsx("span", {
    class: "inline-block",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 449
    }
  }, "Getting help")))))), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 521
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/getting-started",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 534
    }
  }, "Getting Started")), __jsx("li", {
    class: "active",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 614
    }
  }, __jsx("button", {
    class: "focus:shadow-outline",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 633
    }
  }, "Documentation"), __jsx("div", {
    style: "display:",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 692
    }
  }, __jsx("ul", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 714
    }
  }, __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 718
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/docs/customization",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 731
    }
  }, "Customization")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 812
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/docs/single-page-applications",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 825
    }
  }, "Single Page Applications")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 928
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/docs/environment-variables",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 941
    }
  }, "Environment Variables")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1038
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/docs/static-export",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1051
    }
  }, "Static Site Generation")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1141
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/docs/experimental-features",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1154
    }
  }, "Experimental Features")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1251
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/docs/how-it-works",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1264
    }
  }, "How Razzle Works")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1347
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/docs/upgrade-guide",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1360
    }
  }, "Upgrade guide"))))), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1457
    }
  }, __jsx("button", {
    class: "focus:shadow-outline",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1470
    }
  }, "Deployment Options"), __jsx("div", {
    style: "display:none",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1534
    }
  }, __jsx("ul", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1560
    }
  }, __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1564
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/deployment-options/aws",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1577
    }
  }, "AWS")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1652
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/deployment-options/azure",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1665
    }
  }, "Azure")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1744
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/deployment-options/plesk",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1757
    }
  }, "Plesk")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1836
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/deployment-options/vercel",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1849
    }
  }, "Vercel")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1930
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/deployment-options/layer0",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 1943
    }
  }, "Layer0"))))), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2040
    }
  }, __jsx("button", {
    class: "focus:shadow-outline",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2053
    }
  }, "Razzle plugins"), __jsx("div", {
    style: "display:none",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2113
    }
  }, __jsx("ul", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2139
    }
  }, __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2143
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/plugins/razzle-plugin-bundle-analyzer",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2156
    }
  }, "razzle-plugin-bundle-analyzer")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2272
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/plugins/razzle-plugin-graphql",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2285
    }
  }, "razzle-plugin-graphql")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2385
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/plugins/razzle-plugin-less",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2398
    }
  }, "razzle-plugin-less")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2492
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/plugins/razzle-plugin-mdx",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2505
    }
  }, "razzle-plugin-mdx")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2597
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/plugins/razzle-plugin-php",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2610
    }
  }, "razzle-plugin-php")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2702
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/plugins/razzle-plugin-scss",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2715
    }
  }, "razzle-plugin-scss")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2809
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/plugins/razzle-plugin-svelte",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2822
    }
  }, "razzle-plugin-svelte")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2920
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/plugins/razzle-plugin-typescript",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 2933
    }
  }, "razzle-plugin-typescript")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 3039
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/plugins/razzle-plugin-vue",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 3052
    }
  }, "razzle-plugin-vue"))))), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 3160
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/change-log",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 3173
    }
  }, "Change Log")), __jsx("li", {
    class: "",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 3243
    }
  }, __jsx("a", {
    class: "focus:shadow-outline",
    href: "/contributing",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 37,
      columnNumber: 3256
    }
  }, "Contributing")))), __jsx("div", {
    id: "myTabContent",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 39,
      columnNumber: 9
    }
  }, __jsx("div", {
    class: "hidden p-4 bg-gray-50 rounded-lg dark:bg-gray-800",
    id: "profile",
    role: "tabpanel",
    "aria-labelledby": "profile-tab",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 40,
      columnNumber: 13
    }
  }, __jsx("p", {
    class: "text-sm text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 41,
      columnNumber: 17
    }
  }, "This is some placeholder content the ", __jsx("strong", {
    class: "font-medium text-gray-800 dark:text-white",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 41,
      columnNumber: 106
    }
  }, "Profile tab's associated content"), ". Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classes to control the content visibility and styling.")), __jsx("div", {
    class: "hidden p-4 bg-gray-50 rounded-lg dark:bg-gray-800",
    id: "dashboard",
    role: "tabpanel",
    "aria-labelledby": "dashboard-tab",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 43,
      columnNumber: 13
    }
  }, __jsx("p", {
    class: "text-sm text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 44,
      columnNumber: 17
    }
  }, "This is some placeholder content the ", __jsx("strong", {
    class: "font-medium text-gray-800 dark:text-white",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 44,
      columnNumber: 106
    }
  }, "Dashboard tab's associated content"), ". Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classes to control the content visibility and styling.")), __jsx("div", {
    class: "hidden p-4 bg-gray-50 rounded-lg dark:bg-gray-800",
    id: "settings",
    role: "tabpanel",
    "aria-labelledby": "settings-tab",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 46,
      columnNumber: 13
    }
  }, __jsx("p", {
    class: "text-sm text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 47,
      columnNumber: 17
    }
  }, "This is some placeholder content the ", __jsx("strong", {
    class: "font-medium text-gray-800 dark:text-white",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 47,
      columnNumber: 106
    }
  }, "Settings tab's associated content"), ". Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classes to control the content visibility and styling.")), __jsx("div", {
    class: "hidden p-4 bg-gray-50 rounded-lg dark:bg-gray-800",
    id: "contacts",
    role: "tabpanel",
    "aria-labelledby": "contacts-tab",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 49,
      columnNumber: 13
    }
  }, __jsx("p", {
    class: "text-sm text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 50,
      columnNumber: 17
    }
  }, "This is some placeholder content the ", __jsx("strong", {
    class: "font-medium text-gray-800 dark:text-white",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 50,
      columnNumber: 106
    }
  }, "Contacts tab's associated content"), ". Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classes to control the content visibility and styling."))), __jsx("div", {
    className: "margin_baseline m-auto mt-0 text-center mx-5 mr-10",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 53,
      columnNumber: 9
    }
  }, __jsx("div", {
    id: "drawer-example",
    class: "fixed z-40 h-screen p-4 overflow-y-auto bg-white w-80 dark:bg-gray-800",
    tabindex: "-1",
    "aria-labelledby": "drawer-label",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 54,
      columnNumber: 11
    }
  }, __jsx("h5", {
    id: "drawer-label",
    class: "inline-flex items-center mb-4 text-base font-semibold text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 55,
      columnNumber: 13
    }
  }, __jsx("svg", {
    class: "w-5 h-5 mr-2",
    "aria-hidden": "true",
    fill: "currentColor",
    viewBox: "0 0 20 20",
    xmlns: "http://www.w3.org/2000/svg",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 55,
      columnNumber: 130
    }
  }, __jsx("path", {
    "fill-rule": "evenodd",
    d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z",
    "clip-rule": "evenodd",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 55,
      columnNumber: 250
    }
  })), "Info"), __jsx("p", {
    class: "mb-6 text-sm text-gray-500 dark:text-gray-400",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 56,
      columnNumber: 13
    }
  }, "Supercharge your hiring by taking advantage of our ", __jsx("a", {
    href: "#",
    class: "text-blue-600 underline dark:text-blue-500 hover:no-underline",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 56,
      columnNumber: 121
    }
  }, "limited-time sale"), " for Flowbite Docs + Job Board. Unlimited access to over 190K top-ranked candidates and the #1 design job board."), __jsx("div", {
    class: "grid grid-cols-2 gap-4",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 57,
      columnNumber: 13
    }
  }, __jsx("a", {
    href: "#",
    class: "px-4 py-2 text-sm font-medium text-center text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 58,
      columnNumber: 17
    }
  }, "Learn more"), __jsx("a", {
    href: "#",
    class: "inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 59,
      columnNumber: 17
    }
  }, "Get access ", __jsx("svg", {
    class: "w-4 h-4 ml-2",
    "aria-hidden": "true",
    fill: "currentColor",
    viewBox: "0 0 20 20",
    xmlns: "http://www.w3.org/2000/svg",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 59,
      columnNumber: 284
    }
  }, __jsx("path", {
    "fill-rule": "evenodd",
    d: "M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z",
    "clip-rule": "evenodd",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 59,
      columnNumber: 404
    }
  }))))), __jsx("div", {
    className: "welcomeBlock m-auto mt-0 text-center align_middle",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 62,
      columnNumber: 11
    }
  }, __jsx("img", {
    src: "https://user-images.githubusercontent.com/106757584/175770221-a634f207-c3de-4afc-991c-d2fb32953941.png",
    className: "welcomeBlock m-auto mt-0 text-center grid",
    style: {
      marginTop: "-120px",
      width: "150px"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 63,
      columnNumber: 13
    }
  }), __jsx("h1", {
    className: "heading30 mt-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 64,
      columnNumber: 13
    }
  }, __jsx("b", {
    className: "text-slate-600",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 65,
      columnNumber: 15
    }
  }, "Newest Experience of Server Side development. "), __jsx("br", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 65,
      columnNumber: 95
    }
  }), __jsx("i", {
    className: "text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 66,
      columnNumber: 15
    }
  }, "Awesome React framework!")), __jsx("div", {
    className: "m-auto w-1/4 mt-10 text-center",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 69,
      columnNumber: 13
    }
  }, __jsx(_components_paragraph_component__WEBPACK_IMPORTED_MODULE_1__["Paragraph"], {
    className: "welcomeBlock m-auto mt-0 text-center grid",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 70,
      columnNumber: 15
    }
  }, __jsx("div", {
    className: "bg-slate-100 p-4 py-2 rounded-full ml-2 text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 71,
      columnNumber: 17
    }
  }, __jsx("b", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 72,
      columnNumber: 19
    }
  }, state))), __jsx("button", {
    className: 'mt-5 py-2 px-3 bg-indigo-500 text-white text-sm font-semibold rounded-full focus:outline-none',
    onClick: () => setState(state + 1),
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 75,
      columnNumber: 15
    }
  }, "You clicked ", state, " times!")), __jsx("h3", {
    className: "welcomeBlock m-auto mt-0 text-center mt-10",
    style: {
      color: "grey"
    },
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 80,
      columnNumber: 13
    }
  }, "Get started by editing:"), __jsx("div", {
    className: "w-[420px] flex m-auto mt-5",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 82,
      columnNumber: 13
    }
  }, __jsx(_components_paragraph_component__WEBPACK_IMPORTED_MODULE_1__["Paragraph"], {
    className: "welcomeBlock m-auto mt-0 text-center grid",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 83,
      columnNumber: 15
    }
  }, __jsx("div", {
    className: "bg-slate-100 p-1 px-4 rounded-full ml-2 text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 84,
      columnNumber: 17
    }
  }, __jsx("b", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 85,
      columnNumber: 19
    }
  }, "./src/router.js"))), __jsx(_components_paragraph_component__WEBPACK_IMPORTED_MODULE_1__["Paragraph"], {
    className: "welcomeBlock m-auto mt-0 text-center grid",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 89,
      columnNumber: 15
    }
  }, __jsx("div", {
    className: "p-1 px-2 rounded-full ml-2 text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 90,
      columnNumber: 17
    }
  }, __jsx("b", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 91,
      columnNumber: 19
    }
  }, "or"))), __jsx(_components_paragraph_component__WEBPACK_IMPORTED_MODULE_1__["Paragraph"], {
    className: "welcomeBlock m-auto mt-0 text-center grid",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 95,
      columnNumber: 15
    }
  }, __jsx("div", {
    className: "bg-slate-100 p-1 px-4 rounded-full ml-2 text-slate-500",
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 96,
      columnNumber: 17
    }
  }, __jsx("b", {
    __self: this,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 97,
      columnNumber: 19
    }
  }, "./src/index.js"))))))));
}

/* harmony default export */ __webpack_exports__["default"] = (Home);

/***/ })

};
//# sourceMappingURL=main.a13676951a98737c6c5c.hot-update.js.map