var path = require('path');

// var dbAddress = process.env.WM_DB_ADDRESS || '139.196.34.10';
// var dbPort = process.env.WM_DB_PORT || '1354';
// var dbUser = process.env.WM_DB_USER || 'node';
// var dbPWD = process.env.WM_DB_PWD || 'node_2015_ruifu';
var serverPort = process.env.WM_SERVER_PORT || '6060';
// var rootPath = process.env.WM_EXPORT_DATA || '/home/h5/UAT/';

var config = {
    serverPort: serverPort,
    environment: 'local test environment',
};

module.exports = config;
