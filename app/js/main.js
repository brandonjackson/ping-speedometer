var _ = require('underscore'),
    Q = require('q'),
    geo = require('../../geo'),
    Backbone = require('backbone');

var PingModel = Backbone.Model.extend({
    getResults: function(userLocation, serverLocation){
        var c = 200000000; // m/s, speed of light in fiber

        // since ping measures round trip time, multiply distance by 2
        var distance = 2 * userLocation.distanceTo(serverLocation);//geo.calculateDistance(coords.lat1, coords.lon1, coords.lat2, coords.lon2);
        var speed = (distance / (this.get('avg') / 1000));
        return {
            distance: distance,
            speed: speed,
            fractionOfC: speed / c
        };
    }
});

var LocationModel = Backbone.Model.extend({
    setFromWebkitGeolocation: function(position){
        console.log("LocationModel.setFromWebkitGeolocation()");
        this.set({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        });
    },
    setFromServer: function(result){
        console.log("LocationModel.setFromServer()");
        this.set({
            latitude: result.latitude,
            longitude: result.longitude,
            city: result.city,
            country: result.country_name
        });
    },
    distanceTo: function(location2){
        var R = 6374477; // Radius of the earth in meters
        var dLat = (location2.get('latitude') - this.get('latitude')) * Math.PI / 180;  // deg2rad below
        var dLon = (location2.get('longitude') - this.get('longitude')) * Math.PI / 180;
        var a = 
            0.5 - Math.cos(dLat)/2 + 
            Math.cos(this.get('latitude') * Math.PI / 180) * Math.cos(location2.get('latitude') * Math.PI / 180) * 
            (1 - Math.cos(dLon))/2;

        return R * 2 * Math.asin(Math.sqrt(a));
    }
});

var userLocation    = new LocationModel(),
    serverLocation  = new LocationModel(),
    ping            = new PingModel();


function loadPingResults(url){
    console.log("loadPingResults(): pinging "+url);
    return Q($.getJSON("/ping/"+url));
}

$(function(){

    userLocation.on("change", function(){
        $("#details #userLocation .latitude").text(userLocation.get('latitude'));
        $("#details #userLocation .longitude").text(userLocation.get('longitude'));
    });

    serverLocation.on("change", function(){
        $("#details #serverLocation .latitude").text(serverLocation.get('latitude'));
        $("#details #serverLocation .longitude").text(serverLocation.get('longitude'));
    });

    ping.on("change", function(){
        $("#details #url").text(ping.get('url'));
        $("#details #ip").text(ping.get('ip'));
        $("#details #avg").text(ping.get('avg'));
        $("#details #text").text(ping.get('text'));
    })

    function showVisualizations(results){
        console.log("showVisualizations()");
        showSpeedometerResults(results);
        showMap();
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

    function showMap(){
        var endpoint = "http://maps.googleapis.com/maps/api/staticmap";
        var options = {
            size: "345x200",
            maptype: "satellite",
            path: "color:0xff0000ff|weight:5|geodesic:true|" 
                    + userLocation.get('latitude')+ "," + userLocation.get('longitude') + "|" 
                    + serverLocation.get('latitude') + "," + serverLocation.get('longitude')
        };
        var url = endpoint + "?" + $.param(options);
        console.log("showMap(): static maps url = " + url);
        $("img#map").attr("src",url);
    }

    function showError(message){
        console.log("showError()" + message);
        var alertMessage = $("<div class='alert alert-danger' role='alert'>" + message + "</div>");
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

    geo.loadCurrentPosition().then(function(position){
        userLocation.setFromWebkitGeolocation(position);
    }, function(error){
        showError("Error: Could not load your current position");
    });

    $("#server-form").on("submit",function(e){
        e.preventDefault();
        var target = $("input#pingTarget").val();
        disableForm();
        loadPingResults(target)
            .then(function(pingResults){
                ping.set(pingResults);
                return geo.loadServerPosition(pingResults.ip);
            })
            .then(function(serverPosition){
                serverLocation.setFromServer(serverPosition);
                showVisualizations(ping.getResults(userLocation, serverLocation));
                reenableForm();
                $("#details").slideDown();
            })
            .catch(showError)
            .done();
    });
});

