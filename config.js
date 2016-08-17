var path = require('path');

var serverPort = process.env.WM_SERVER_PORT || '6060';
var config = {
    serverPort: serverPort,
    environment: 'test environment',
};

module.exports = config;
