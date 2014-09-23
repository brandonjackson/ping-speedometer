var sys = require('sys'),
    exec = require('child_process').exec,
    Q = require('q'),
    _ = require('underscore');

exports.fetch = function(target, options){

    options = _.extend({
        repeats: 10,
        interval: 0.1
    }, options);

    var deferred = Q.defer();

    console.log('Ping.fetch(): pinging ' + target);
    
    var command = "ping -i " + options.interval + " -c " + options.repeats + " " + target;
    exec(command, function(error, stdout, stderr) {
        if (error !== null) {
            console.log('Ping.fetch(): error.');
            deferred.reject(new Error(error));
        } else {
            console.log('Ping.fetch(): done.');
            deferred.resolve(stdout);
        }
    });

    return deferred.promise;
};

exports.parse = function(text){
    var headerMatches = text.match(/PING ([\.\w]*)\s\(([\w\d\.]*)\)/);
    var pingsMatches = text.match(/[\d]*\sbytes from.*/g);
    var statsMatches = text.match(/.*?=\s([^\/]*)\/([^\/]*)\/([^\/]*)\/(.*?)\sms/);

    return {
        "text": text,
        "pings": pingsMatches,
        "url": headerMatches[1],
        "ip": headerMatches[2],
        "min": parseFloat(statsMatches[1]),
        "avg": parseFloat(statsMatches[2]),
        "max": parseFloat(statsMatches[3]),
        "stddev": parseFloat(statsMatches[4])
    };
};