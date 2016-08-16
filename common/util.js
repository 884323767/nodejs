var utilImp = {}
var Logger = require('../common/logger');
var logger = Logger();
var dumper = Logger('dumper');
var logErr = Logger('err');
var crypto = require('crypto');
var net = require('net');
var sendEmail = require('./email');
// var pinyin = require("node-pinyin");
var config = require("../config");

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>get security by ID
utilImp.toHex = function(num) {　　
    var rs = "";　　
    var temp;　　
    while (num / 16 > 0) {　　　　
        temp = num % 16;　　　　
        rs = (temp + "").replace("10", "a").replace("11", "b").replace("12", "c").replace("13", "d").replace("14", "e").replace("15", "f") + rs;　　　　
        num = parseInt(num / 16);　　
    }　　
    // console.warn(rs);
    return rs;
}

utilImp.writeObj = function(obj) {　　
    var description = "";
    for (var i in obj) {
        var property = obj[i];
        description += i + " = " + property + "\n";
    }
    return description;
}

utilImp.stringToHex = function(str) {　　　　
    var val = "";　　　　
    for (var i = 0; i < str.length; i++) {　　　　　　
        if (val == "")　　　　　　　　 val = str.charCodeAt(i).toString(16);　　　　　　
        else　　　　　　　　 val += str.charCodeAt(i).toString(16);　　　　
    }　　　　
    return val;　　
};

utilImp.hexToString = function(str) {　　　　
    var val = "";　　　　
    var arr = str.split(",");
    for (var i = 0; i < arr.length; i++) {
        val += arr[i].fromCharCode(i);　　　　
    }　　　　
    return val;　　
}

utilImp.random = function(from, to) {
    return Math.floor(Math.random() * (to - from + 1) + from);
}

utilImp.headData = {
    flag: 239,
    encrypted: 1,
    version: 01,
    length: 100,
    serial: 0,
    event: 20015,
    uid: 100,
    reserved: 0,
    bLength: 24
};

utilImp.toSeverQuery = function(id, query) {
    var serverQuery = {};
    serverQuery.starttime = query.starttime;
    serverQuery.endtime = query.endtime;
    serverQuery.timeframe = query.timeframe;
    serverQuery.timenumber = query.timenumber;
    serverQuery.id = id;
    return serverQuery;
};

utilImp.toCacheKey = function(query) {
    var serverQuery = query.id + query.starttime + query.endtime + query.timeframe + query.timenumber;
    return serverQuery
};

utilImp.acquire = function(pool, req, resp, option, head, callback) {
    pool.acquire(function(err, client) {
        var errmsg = null;
        var returnData = {};
        logger.debug('here!!!!', head);
        if (err) {
            callback(utilImp.errHandle('acquire connection err', err), {});
        } else {
            var buffer = utilImp.buildreq(req, option, head);

            if (buffer == null) {
                errmsg = utilImp.errHandle('can not build the req');
                callback(errmsg, returnData);
                pool.release(client);
            } else {
                logger.debug('socketid: ' + client);
                client.bzWrite(buffer, function(data, encrypted) {
                    if (resp != null) {
                        var _data = data;
                        if (head.respEncrypted || (encrypted == 1)) {
                            if (head.encryptKey) {
                                logger.trace("encrypt data.");
                                _data = utilImp.decypt(data, head.encryptKey);
                            } else {
                                logger.error("can not find key to encrypt.");
                            }
                        }
                        utilImp.parseRespBuffer(_data, resp, callback);
                    } else {
                        errmsg = utilImp.errHandle('can not get the resp');
                        callback(errmsg, returnData);
                    }
                    pool.release(client);
                });
            }
        }
    });
};

utilImp.buidReqBuffer = function(protoReq, params) {
    // var protoReq = req.toBuffer();
    logger.debug('proto.length: ', protoReq.length);
    logger.debug('params: ', JSON.stringify(params));
    // var datadata = String.fromCharCode.apply(null, new Uint16Array(buffer));
    var _req = protoReq;
    if (params.encrypted) {
        logger.debug('option.encrypted', params.encrypted);
        _req = utilImp.encypt(_req, params.encryptKey);
    }
    var reqLength = _req.length;
    var AllLenght = utilImp.headData.bLength + reqLength;

    var buffer = new Buffer(AllLenght);
    buffer.writeUInt8(0xEF, 0); //flag
    if (params.encrypted == true) {
        buffer.writeUInt8(0x01, 1); //encrypted
    } else {
        buffer.writeUInt8(0x00, 1); //encrypted
    }

    buffer.writeUInt16BE(0x01, 2); // version
    buffer.writeUInt32BE(parseInt(utilImp.toHex(AllLenght), 16), 4); //length
    buffer.writeUInt32BE(0x00, 8); //serial
    if (params.event != null) {
        buffer.writeUInt32BE(params.event, 12); //event: 101005  
    } else {
        logger.error('lack of event in: ' + JSON.stringify(params));
    }

    if (params.uid != null) {
        buffer.writeUInt32BE(params.uid, 16); //uid  
    } else {
        logger.warn('lack of uid in: ' + JSON.stringify(params));
    }

    buffer.writeUInt32BE(0x00, 20); //reserved

    _req.copy(buffer, utilImp.headData.bLength, 0, reqLength);
    logger.debug(buffer);　
    return buffer;
};

utilImp.buildreq = function(Req, data, head) {
    logger.debug(JSON.stringify(data));
    var buffer = null;
    try {
        var req = new Req(data);
        var reqBuffer = req.toBuffer();
        var buffer = utilImp.buidReqBuffer(reqBuffer, head);
    } catch (err) {
        logger.error(err);
    }
    return buffer;
};

utilImp.parseRespBuffer = function(data, decoder, callback) {
    var protoResp = null;
    var returnData = {};
    var errmsg = null;
    try {
        logger.debug(data);
        protoResp = decoder.decode(data);
        logger.info('status: ' + JSON.stringify(protoResp.status_info));
        dumper.debug(protoResp);

        returnData = protoResp;
    } catch (err) {
        errmsg = utilImp.errHandle('decode err', err);
    } finally {
        logger.trace('finally');
        callback(errmsg, returnData);
    }
};


utilImp.parseRespStatus = function(errmsg, data, callback) {
    var returnData = {};
    if (!errmsg) {
        if (data.status_info.status == 0) {
            returnData = data;
        } else {
            errmsg = utilImp.errHandle('excution err', data.status_info.msg);
        }
    }
    callback(errmsg, returnData);
};

utilImp.toMD5 = function(data) {
    var md5 = crypto.createHash('md5');
    md5.update(data);
    var d = md5.digest('hex');
    return d;
};

// var md5 = crypto.createHash('md5');
var iv = "0123456789123456";
var ivHex = utilImp.stringToHex(iv);
var ivBuffer = new Buffer(ivHex, 'hex');
var algorithm = 'aes-256-cfb';
utilImp.encypt = function(org, key) {
    var keyBuf = null;
    if (key instanceof Buffer) {
        keyBuf = key;
    } else {
        keyBuf = new Buffer(32);
        var orgKeyBuf = new Buffer(utilImp.stringToHex(key), 'hex');
        orgKeyBuf.copy(keyBuf);
    }
    var cipher = crypto.createCipheriv(algorithm, keyBuf, ivBuffer);
    logger.trace('cipher: ');
    var cipherData = cipher.update(org, 'binary', 'hex');
    cipherData += cipher.final('hex');
    logger.debug('cipherData: ', cipherData);

    var buffer = new Buffer(cipherData, 'hex');
    return buffer;
};

utilImp.decypt = function(org, key) {
    var keyBuf = null;
    if (key instanceof Buffer) {
        keyBuf = key;
    } else {
        keyBuf = new Buffer(32);
        var orgKeyBuf = new Buffer(utilImp.stringToHex(key), 'hex');
        orgKeyBuf.copy(keyBuf);
    }
    var decipher = crypto.createDecipheriv(algorithm, keyBuf, ivBuffer);
    logger.trace('decipher: ');
    var decipherData = decipher.update(org, 'binary', 'hex');
    decipherData += decipher.final('hex');
    logger.debug('cipherData: ', decipherData);

    var buffer = new Buffer(decipherData, 'hex');
    return buffer;
};

utilImp.getErrReturn = function(err, data) {
    if (typeof(data.msg) == "undefined") {
        data.data = data.event;
    }
    if (typeof(data.code) == "undefined") {
        data.code = 10001000;
    }
    var returnData = {
        'code': data.code,
        'data': {},
        'message': err || data.msg,
        // 'signature': ""
    };
    return returnData;
};

utilImp.getNormalReturn = function(err, data) {
    if (typeof(data.data) == "undefined") {
        data.data = data.event;
    }
    if (typeof(data.code) == "undefined") {
        data.code = 200;
    }
    var returnData = {
        'code': data.code,
        'data': data.data,
        'message': "",
        // 'signature': ""
    };
    return returnData;
};

utilImp.getReturnData = function(err, data) {
    var returnData = null;
    if (err && err != "SUCCESS") {
        logger.error(err);
        returnData = utilImp.getErrReturn(err, data);
    } else {
        returnData = utilImp.getNormalReturn(err, data);
    }
    // logger.debug(returnData);
    return returnData;
};

utilImp.getReturnEvent = function(err, event, data) {
    var returnData = {
        event: event,
        data: data
    };
    if (err) {
        logger.error(err);
        returnData.success = false;
        returnData.detail = err;
    } else {
        returnData.success = true;
        returnData.detail = 'normal';
    }
    // logger.debug(returnData);
    return returnData;
};

utilImp.errHandle = function(info, err) {
    var errData = {
        bizinfo: info,
        err: err
    };
    logErr.error(JSON.stringify(errData));
    sendEmail(JSON.stringify(errData));
    return errData;
};

function add0(m) {
    return m < 10 ? '0' + m : m
};

utilImp.dateFormat = function(obj) {
    var y = obj.getFullYear();
    var m = obj.getMonth() + 1;
    var d = obj.getDate() + 1;
    var h = obj.getHours() + 1;
    var mm = obj.getMinutes() + 1;
    var s = obj.getSeconds() + 1;
    return '' + y + add0(m) + add0(d) + add0(h) + add0(mm) + add0(s);
};

utilImp.generateUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }).toUpperCase();
};

utilImp.netCreation = function(host, port) {
    return function(callback) {
        var client = new net.Socket();
        try {
            client.connect(port, host, function() {
                logger.info('CONNECTED TO: ' + host + ':' + port);
            });
        } catch (er) {
            logger.error(er);
        }

        var dataCounter = 0;
        var respBufferList = [];
        var respBuffer = null;
        var respTotalLength = 0;
        var totalDataLength = 0;

        client.on('end', function() {
            logger.trace('end');
        });

        client.on('error', function(err) {
            logger.trace('err!!!!');
            logger.error(err);
            if (client.afterReceiveCallBack != null) {
                var errmsg = utilImp.errHandle('network connection err', err);
                client.afterReceiveCallBack(errmsg, {});
            }
        });

        client.on('timeout', function() {
            logger.trace('timeout!!!');
            if (client.afterReceiveCallBack != null) {
                var errmsg = utilImp.errHandle('network connection timeout', err);
                client.afterReceiveCallBack(errmsg, {});
            }
        });

        client.on('close', function() {
            logger.trace('Connection closed');
            try {
                client.destroy();
            } catch (exception) {
                logger.error(exception);
            } finally {}
        });

        client.on('data', function(data) {
            logger.trace('get data, length: ' + data.length);
            if (dataCounter == 0) {
                respTotalLength = new String(data.readUInt32BE(4));
                logger.debug('return lenght: ' + respTotalLength);
            }
            dataCounter++;
            totalDataLength = totalDataLength + data.length;
            respBufferList.push(data);
            if (totalDataLength >= respTotalLength) {
                logger.debug('totalDataLength', totalDataLength);
                respBuffer = Buffer.concat(respBufferList, totalDataLength);
                logger.debug('resp data ready: ', respBuffer);
                var encrypted = respBuffer.readUInt8(1); //encrypted
                var resp = respBuffer.slice(utilImp.headData.bLength);
                // console.log(JSON.stringify(protoResp));
                dataCounter = 0;
                respBufferList = [];
                respBuffer = null;
                respTotalLength = 0;
                totalDataLength = 0;
                client.afterReceiveCallBack(resp, (encrypted == 1));
                // client.end();
                // logger.trace('Connection ended');
            }
        });

        client.bzWrite = function(data, callback) {
            client.afterReceiveCallBack = callback;

            client.write(data);
        };

        callback(null, client);
    };
};

utilImp.getKeyBuf = function(key) {　　
        var keyBuf = new Buffer(32);
        var orgKeyBuf = new Buffer(utilImp.stringToHex(key), 'hex');
        orgKeyBuf.copy(keyBuf);
        return orgKeyBuf;
    }
    // utilImp.changeToPinyin = function(string) {　　
    //     var origin = pinyin(string, {
    //         style: 'normal'
    //     });
    //     if (typeof(origin[0]) == 'object') {
    //         var result = origin[0][0];
    //     } else {
    //         var result = origin[0];
    //     }
    //     for (var index = 1; index < origin.length; index++) {
    //         if (origin[index] != ' ') {
    //             result += ' ' + origin[index];
    //         }
    //     }
    //     return result;
    // }

module.exports = function Util(args) {
    return utilImp;
};
