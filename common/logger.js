var log4js = require('log4js');
var loggerImp = {};
var fs = require('fs');
if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs', 0777)
}

log4js.configure({
    appenders: [{
        type: 'console'
    }, {
        type: 'file',
        filename: './logs/log.log',
        maxLogSize: 20480000,
        backups: 10,
        category: 'reception'
    }],
    levels: {
        reception: 'TRACE',
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
        return logger;
};
