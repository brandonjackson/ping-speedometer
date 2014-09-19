var path = require('path'),
    express = require('express'),
    logger = require('morgan'),
    sys = require('sys'),
    exec = require('child_process').exec,
    Q = require('q'),
    _ = require('underscore'),
    Ping = require('./ping');

var app = express();

// Log the requests
app.use(logger('dev'));

// Serve static files
app.use(express.static(path.join(__dirname, 'app'))); 

app.get('/ping/:target', function(req, res){
    console.log('ping/'+req.param('target')+'.json loading');

    Ping.fetch(req.param('target'))
     .then(function(text){
        res.json(Ping.parse(text));
     })
     .catch(function(error){
        console.log(error)
        res.send(504, 'ping error');
     });
});

// Route for everything else.
app.get('*', function(req, res){
    res.send(404, "File Not Found!");
});

// Fire it up!
app.listen(3000);
console.log('Listening on port 3000');