var _ = require('underscore'),
    Q = require('q');


exports.calculateDistance = function(lat1, lon1, lat2, lon2) {
  var R = 6374477; // Radius of the earth in meters
  var dLat = (lat2 - lat1) * Math.PI / 180;  // deg2rad below
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = 
     0.5 - Math.cos(dLat)/2 + 
     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
     (1 - Math.cos(dLon))/2;

  return R * 2 * Math.asin(Math.sqrt(a));
};

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
