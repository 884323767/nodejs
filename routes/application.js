var express = require('express');
var util = require('../common/util')();
var Logger = require('../common/logger');
var logger = Logger();
var dump = Logger('dumper');
var moment = require('moment');
var applicationModel = require('../models/application');
var router = express.Router();
var path = require('path');
var fs = require("fs");
var options = require('../config');

function getReturn(err, data) {
  if (err) {
    if (typeof(data.code) == "undefined") {
      data.code = 10001000;
    }
    var returnData = {
      'code': data.code,
      'msg': err
    };
  } else {
    if (typeof(data.code) == "undefined") {
      data.code = 0;
    }
    var returnData = {
      'code': data.code,
      'data': data.data
    };
  }
  return returnData;
};
router.post('/question', function(req, res, next) {
  var answer = req.body.answer;
  logger.traceIn('received post req: ' + answer);
  var now = moment(new Date());
  var createdDate = now.format("YYYY-MM-DD HH:mm:ss");
  applicationModel.question(answer, function(err, data) {
    var result = getReturn(err, data);
    res.send(result);
  });
});
module.exports = router;