var nodemailer = require('nodemailer');
var Logger = require('../common/logger');
var config = require('../config');
var logger = Logger();
var transporter = nodemailer.createTransport({
    host: 'smtp.mxhichina.com',
    auth: {
        user: 'test@ruifusoft.com',
        pass: 'Qq884323767'
    }
}, {
    from: 'test@ruifusoft.com',
    headers: {
        'My-Awesome-Header': 'msg'
    }
});

var myEmail = function(msg, msgTitle) {
    var title = msgTitle || 'ERROR NOTICE!';
    var emailTo = 'lewei.li@ruifusoft.com';
    msg = "environment:" + config.environment + ' ; msg:' + msg;
    transporter.sendMail({
        to: emailTo,
        subject: title,
        text: msg
    }, function(error, info) {
        if (error) {
            logger.error(' Email: ' + error);
        } else {
            logger.info('Email Message sent: ' + info.response);
        }
    })
};
module.exports = myEmail;
