var _ = require('underscore'),
    Q = require('q');

exports.loadCurrentPosition = function(){
// Gets users location using using HTML5's built-in getCurrentPosition function
// Returns a Q promise

    var deferred = Q.defer();
    var options = {
        enableHighAccuracy: false,
        timeout: 5000,
    };
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(
            function(position){
                deferred.resolve(position);
            },
            function(error){
                console.log('getCurrentPosition error!');
                console.log(error);
                deferred.reject(error);
            },
            options
        );
    } else {
        deferred.reject(new Error("Browser location services unavailable"));
    }
    return deferred.promise;
};

exports.loadServerPosition = function(ip){
    return Q($.getJSON("http://freegeoip.net/json/" + ip));
};
