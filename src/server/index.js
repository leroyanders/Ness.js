const server = require('./core').default;
const express = require('express');
const results = Object.create(null);
const chalk = require('chalk');
const logger = console.log;
const { networkInterfaces } = require('os');
const nets = networkInterfaces();
const port = 3000;

// hot-reload server core
let nessAplication = server;

// retrieve networkInterfaces
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
    if (net.family === familyV4Value && !net.internal) {
      if (!results[name]) results[name] = [];
      results[name].push(net.address);
    }
  }
}

// server live mode
if (module.hot) module.hot.accept('./core', () => {
  try {
    nessAplication = require('./core').default;
  } catch (error) {console.error(error)}
});

export default express()
.use((req, res) => nessAplication.handle(req, res))
.listen(port, function(err) {
  if (err) return console.error(err);
  logger(`🌱 NessApp started on: ${chalk.hex('#5590CB').bold('http://localhost:' + process.env.PORT || port)} and ${chalk.hex('#5590CB').bold('http://' + results['en0'][0] || 'localhost' + ':' + process.env.PORT || port)}`);
});
