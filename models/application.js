var config = require('../config');
var Logger = require('../common/logger');
var logger = Logger();
var scoreMap = require('./scoreMap');

function scoreAbility(scores) {
    var result = 0;
    result = scores[3] + scores[10] + scores[11] + scores[12] + scores[13];
    if (result >= 5 && result <= 7) {
        result = 1;
    } else if (result > 7 && result < 12) {
        result = 2;
    } else if (result >= 12 && result <= 16) {
        result = 3;
    } else if (result > 16 && result < 20) {
        result = 4;
    } else if (result >= 20 && result <= 23) {
        result = 5;
    }
    return result;
}

function scoreSubject(scores) {
    var result = 0;
    result = 2 * scores[1] + 0.5 * scores[7] + scores[2] + scores[4] + scores[5] + scores[6];
    if (result >= 6 && result <= 13) {
        result = 1;
    } else if (result > 13 && result <= 16) {
        result = 2;
    } else if (result > 16 && result <= 20) {
        result = 3;
    } else if (result > 20 && result <= 23) {
        result = 4;
    } else if (result > 23 && result <= 31) {
        result = 5;
    }
    return result;
}

function scoreObject(scores) {
    var result = 0;
    result = 0.5 * scores[8] + 0.5 * scores[9];
    if (result >= 0 && result < 0.1) {
        result = 1;
    } else if (result >= 0.1 && result < 0.3) {
        result = 2;
    } else if (result >= 0.3 && result <= 0.7) {
        result = 3;
    } else if (result >= 0.7 && result < 0.9) {
        result = 4;
    } else if (result >= 0.9 && result < 1) {
        result = 5;
    }
    return result;
}

function willingLevel(subject, object) {
    var result = 0;
    var temp;
    if (subject - object <= 1 && subject - object >= -1) {
        result = subject;
    } else {
        temp = (subject + object) / 2;
        if (subject > object) {
            result = Math.floor(temp);
        } else {
            result = Math.ceil(temp);
        }
    }
    return result;
}

function percentCompute(ability, willing, level, map) {
    var result = 0;
    var percent = map.percentMap[ability] * map.percentMap[willing];
    var total = map.percentTotalMap[level];
    result = percent / total;
    return result;
}

function scoreCompute(index, score, result) {
    if (typeof score == 'undefined') {
        result.code = 100;
        result.err = 'scoreMap err: in the question ' + index;
        logger.error(result.err);

    } else {
        result.scores[index] = score;
    }
}

var application = {
    question: function(answer, callback) {
        var score = 0;
        var ability;
        var subject;
        var object;
        var willing;
        var percent;
        var level;
        var result = {
            data: 0,
            scores: []
        };
        var temp = 0;
        answer = answer.split("~");
        logger.info(answer.length);
        result.scores[0] = answer[0];
        if (answer[0] == 'v1') {
            for (var index = 1, length = answer.length; index < length; index++) {
                if (index == 4) {
                    temp = scoreMap.v1.common[answer[index]];
                }
                if (index == 5) {
                    scoreCompute(index, scoreMap.v1.five[temp + answer[index]], result);
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
            ability = scoreAbility(result.scores);
            subject = scoreSubject(result.scores);
            object = scoreObject(result.scores);
            willing = willingLevel(subject, object);
            level = scoreMap.v1.levelMap[willing * 10 + ability]
            score = level * 20;
            percent = percentCompute(ability, willing, level, scoreMap.v1);
        } else {
            result.err = 'versions do not recognized: ' + answer[0];
            result.code = 101;
            logger.error(result.err);
        }
        result.data = {
            ability: ability,
            willing: willing,
            score: score,
            percent: percent
        };
        logger.info(result);
        callback(result.err, result);
    }
}
module.exports = application;
