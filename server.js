var config = require('./config');
app = require('./app');

app.set('port', config.serverPort)
app.listen(app.get('port'),function () {
    console.log('server is listening on ' + app.get('port'));
});
