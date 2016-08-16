var express = require('express'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    app = express();
    request = require('request');

var application = require('./routes/application');
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors());

app.use('/application', application);

module.exports = app;
