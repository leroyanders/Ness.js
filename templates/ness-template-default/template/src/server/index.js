const server = require('../index').default;
const express = require('express');
const port = 3000;

// hot-reload server core
let nessAplication = server;

// server live mode
if (module.hot) module.hot.accept('../index', () => {
  try {
    nessAplication = require('../index').default;
  } catch (error) {console.error(error)}
});

export default express().use(
  (req, res) => nessAplication.handle(req, res)
).listen(port);