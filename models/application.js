var path = require('path');
var fs = require("fs");
var util = require('../common/util')();
var mysql = require('mysql');
var config = require('../config');
var moment = require('moment');
const scoreMap = {
  v1: {
    common: {
      '0': 1,
      '1': 2,
      '2': 3,
      '3': 4,
      '4': 5
    },
    five: {
      '10': 1,
      '11': 2,
      '20': 3,
      '21': 4,
      '30': 4,
      '31': 5,
      '40': 5,
      '41': 6,
      '50': 6,
      '51': 7
    },
    seven: {
      '500': 10,
      '450': 9,
      '400': 8,
      '350': 7,
      '300': 6,
      '250': 5,
      '200': 4,
      '150': 3,
      '100': 2,
      '50': 1
    },
    eight: {
      '100': 0.1,
      '200': 0.2,
      '300': 0.3,
      '400': 0.4,
      '500': 0.5,
      '600': 0.6,
      '700': 0.7,
      '800': 0.8,
      '900': 0.9,
      '1000': 1
    },
    nine: {
      '600': 0.1,
      '700': 0.2,
      '800': 0.3,
      '900': 0.4,
      '1000': 0.5,
      '1100': 0.6,
      '1200': 0.7,
      '1300': 0.8,
      '1400': 0.9,
      '1500': 1,
      '0': 0
    }
  }
};

function scoreCompute(index, score, result) {
  console.log(index + '  :' + score);
  if (typeof score == 'undefined') {
    result.code = 100;
    result.err = 'scoreMap err: in ' + index;
  } else {
    console.log(index + '  :' + score);
    result.data += score;
  }
}

var application = {
  question: function(answer, callback) {
    var score = 0;
    var errMsg = null;
    var result = {
      data: 0
    };
    var temp = 0;
    answer = answer.split("~");
    console.log(answer.length);
    if (answer[0] == 'v1') {
      for (var index = 1, length = answer.length; index < length; index++) {
        if (index == 4) {
          temp = scoreMap.v1.common[answer[index]];
        }
        if (index == 5) {
          scoreCompute(index, scoreMap.v1.five[temp + answer[index]], result);
          console.log(scoreMap.v1.five[temp + answer[index]]);
        } else if (index == 7) {
          scoreCompute(index, scoreMap.v1.seven[answer[index]], result)
        } else if (index == 8) {
          scoreCompute(index, scoreMap.v1.eight[answer[index]], result);
        } else if (index == 9) {
          scoreCompute(index, scoreMap.v1.nine[answer[index]], result)
        } else {
          scoreCompute(index, scoreMap.v1.common[answer[index]], result);
        }
      }
    }
    console.log(result)
    callback(result.err, result);
  }
}

module.exports = application;