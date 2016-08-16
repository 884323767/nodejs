var log4js = require('log4js');
var loggerImp = {};
var fs = require('fs');
if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs', 0777)
}
if (!fs.existsSync('./logs/dump')) {
    fs.mkdirSync('./logs/dump', 0777)
}
if (!fs.existsSync('./logs/monitor')) {
    fs.mkdirSync('./logs/monitor', 0777)
}
if (!fs.existsSync('./logs/export')) {
    fs.mkdirSync('./logs/export', 0777)
}

log4js.configure({
    appenders: [{
        type: 'console'
    }, {
        type: 'file',
        filename: './logs/log.log',
        // pattern: 'yyyyMMddhh.txt',
        maxLogSize: 20480000,
        backups: 10,
        // alwaysIncludePattern: true,
        category: 'reception'
    }, {
        type: 'file',
        filename: './logs/dump/dump.log',
        pattern: 'yyyyMMddhh.txt',
        maxLogSize: 20480000,
        backups: 10,
        alwaysIncludePattern: true,
        category: 'dump'
    }, {
        type: 'file',
        filename: './logs/monitor/monitor.log',
        pattern: 'yyyyMMddhh.txt',
        maxLogSize: 20480000,
        backups: 10,
        alwaysIncludePattern: true,
        category: 'monitor'
    }, {
        type: 'file',
        filename: './logs/export/export.log',
        pattern: 'yyyyMMddhh.txt',
        maxLogSize: 20480000,
        backups: 10,
        alwaysIncludePattern: true,
        category: 'export'
    }, {
        type: 'file',
        filename: './logs/err.log',
        pattern: 'yyyyMMddhh.txt',
        maxLogSize: 20480000,
        backups: 10,
        alwaysIncludePattern: true,
        category: 'err'
    }],
    levels: {
        reception: 'TRACE',
        dump: 'TRACE',
        err: 'TRACE'
    },
    replaceConsole: true
});

var logger = log4js.getLogger('reception');

logger.trace('logger.trace');
logger.debug('logger.debug');
logger.info('logger.info');
logger.warn('logger.warn');
logger.error('logger.error');
logger.fatal('logger.fatal');
logger.traceIn = function(msg) {
    logger.trace('<<<<<<<<<<' + msg);
};
logger.traceOut = function(msg) {
    logger.trace('>>>>>>>>>>' + msg);
};

module.exports = function Logger(args) {
    if (args == 'dumper') {
        return log4js.getLogger('dump');
    } else if (args == 'err') {
        return log4js.getLogger('err');
    } else if (args == 'monitor') {
        return log4js.getLogger('monitor');
    } else if (args == 'export') {
        return log4js.getLogger('export');
    } else {
        return logger;
    }
};
