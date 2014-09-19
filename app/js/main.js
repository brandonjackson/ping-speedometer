var _ = require('underscore'),
    Q = require('q');

function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6374477; // Radius of the earth in meters
  var dLat = (lat2 - lat1) * Math.PI / 180;  // deg2rad below
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = 
     0.5 - Math.cos(dLat)/2 + 
     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
     (1 - Math.cos(dLon))/2;

  return R * 2 * Math.asin(Math.sqrt(a));
}

function loadCurrentPosition(){
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
}

function loadPingResults(url){
    console.log("loadPingResults(): pinging "+url);
    return Q($.getJSON("/ping/"+url));
}

function loadServerPosition(ip){
    return Q($.getJSON("http://freegeoip.net/json/"+ip));
}

$(function(){

   function getCoordinates(){
        return {
            lat1: parseFloat($("#details #lat1").text()),
            lon1: parseFloat($("#details #lon1").text()),
            lat2: parseFloat($("#details #lat2").text()),
            lon2: parseFloat($("#details #lon2").text())
        };
    }

    function showCurrentPosition(position) {
        $("#details #lat1").text(position.coords.latitude);
        $("#details #lon1").text(position.coords.longitude);
    }

    function showPingResults(results){
        $("#details #url").text(results.url);
        $("#details #ip").text(results.ip);
        $("#details #avg").text(results.avg);
        $("#details #text").text(results.text);
    }

    function showServerPosition(position){
        $("#details #lat2").text(position.latitude);
        $("#details #lon2").text(position.longitude);
    }

    function showVisualizations(results,coords){
        showSpeedometerResults(results);
        showMap(coords);
        $("#visualizations").slideDown();
        $("#gauge").empty();
        var gauge = new JustGage({
            id: "gauge",
            value: Math.round(results.fractionOfC * 100),
            min: 0,
            max: 100,
            title: "Speed of Light",
            label: "% of Speed of Light",
        });
    }

    function showSpeedometerResults(results){
        $("#details #distance").text(results.distance + ' meters');
        $("#details #speed").text(results.speed + " m/s");
        $("#details #c").text(results.fractionOfC);
        
    }

    function showMap(coords){
        var endpoint = "http://maps.googleapis.com/maps/api/staticmap";
        var options = {
            size: "345x200",
            maptype: "satellite",
            path: "color:0xff0000ff|weight:5|geodesic:true|" + coords.lat1 + "," + coords.lon1 + "|" + coords.lat2 + "," + coords.lon2
        };
        var url = endpoint + "?" + $.param(options);
        console.log("showMap(): static maps url = " + url);
        $("img#map").attr("src",url);
    }

    function showError(error){
        console.log("Error Occurred!");
        console.log(error);
        var alertMessage = $("<div class='alert alert-danger' role='alert'>" + error.message + "</div>");
        $("h1").after(alertMessage);
        reenableForm();
    }

    function disableForm(){
        $("input#pingTarget").blur();
        $("#server-form input[type=submit]").attr("disabled","disabled");
        $("#server-form input[type=submit]").val("Pinging...");
    }

    function reenableForm(){
        $("#server-form input[type=submit]").removeAttr("disabled");
        $("#server-form input[type=submit]").val("Ping");
    }

    loadCurrentPosition().then(showCurrentPosition, showError);

    $("#server-form").on("submit",function(e){
        e.preventDefault();
        var target = $("input#pingTarget").val();
        disableForm();
        loadPingResults(target)
            .then(function(pingResults){
                showPingResults(pingResults);
                return loadServerPosition(pingResults.ip);
            })
            .then(function(serverPosition){
                showServerPosition(serverPosition);

                var c = 200000000; // m/s
                var coords = getCoordinates();
                var results = {};

                // since ping measures round trip time, multiply distance by 2
                results.distance = 2*calculateDistance(coords.lat1, coords.lon1, coords.lat2, coords.lon2);
                results.speed = (results.distance / (parseFloat($("#details #avg").text()) / 1000)),
                results.fractionOfC = results.speed / c;

                showVisualizations(results, coords);
                reenableForm();
                $("#details").slideDown();
            })
            .catch(showError)
            .done();
    });
});

