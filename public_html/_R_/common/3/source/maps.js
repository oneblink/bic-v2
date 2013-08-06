/*jslint browser:true, indent:2, nomen:true, todo:true*/
/*global Modernizr*/
/*global log, warn*/ // from common.js
/*global insertText*/ // from main.js

(function (window) {
  'use strict';
  var siteVars = window.siteVars,
    MyAnswers,
    $ = window.jQuery,
    navigator = window.navigator,
    google; // defined in MyAnswers.setupGoogleMaps

  MyAnswers = window.MyAnswers || {};
  window.MyAnswers = MyAnswers;

  MyAnswers.onGoogleMapsLoad = function () {
    setTimeout(function () {
      if (window.google && window.google.maps && window.google.maps.Map) {
        MyAnswers.dfrdGoogleMaps.resolve();
      } else {
        MyAnswers.dfrdGoogleMaps.reject();
      }
    }, 197);
  };

  function getGoogleDirections(options) {
    var dfrd = new $.Deferred(),
      directionsService = new google.maps.DirectionsService(),
      string;
    /* END: var */
    if (!$.isPlainObject(options) || !options.origin || !options.destination ||
        !options.travelMode) {
      dfrd.reject('GoogleDirections error: bad options');
      return dfrd.promise();
    }
    directionsService.route(options, function (results, status) {
      if (status === google.maps.DirectionsStatus.OK) {
        dfrd.resolve(results);
      } else {
        switch (status) {
        case google.maps.DirectionsStatus.NOT_FOUND:
          string = 'one of the waypoints could not be geocoded';
          break;
        case google.maps.DirectionsStatus.ZERO_RESULTS:
          string = 'no route found, be more specific';
          break;
        case google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED:
          string = 'too many waypoints specified';
          break;
        case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
          string = 'request quota exceeded, try again later';
          break;
        case google.maps.DirectionsStatus.REQUEST_DENIED:
          string = 'request denied';
          break;
        case google.maps.DirectionsStatus.INVALID_REQUEST:
          string = 'invalid request';
          break;
        default:
          string = 'unknown error, please try again';
        }
        dfrd.reject('GoogleDirections error: ' + string);
      }
    });
    return dfrd.promise();
  }

  MyAnswers.getGeoLocation = function (options) {
    var dfrd = new $.Deferred(),
      defaultOptions = {
        enableHighAccuracy: true,
        maximumAge: 5 * 60 * 1000, // 5 minutes
        timeout: 5 * 1000 // 5 seconds
      };
    /* END: var */
    if (!Modernizr.geolocation) {
      dfrd.reject('GeoLocation error: unsupported in this browser / device');
      return dfrd.promise();
    }
    options = $.isPlainObject(options) ? options : {};
    options = $.extend({}, defaultOptions, options);
    navigator.geolocation.getCurrentPosition(
      function (position) { // successCallback
        var coords;
        if (position.coords) {
          coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed
          };
          dfrd.resolve(coords);
        } else {
          dfrd.reject('GeoLocation error: blank location from device');
        }
      },
      function (error) { // errorCallback
        var string;
        switch (error.code) {
        case error.PERMISSION_DENIED:
          string = 'user has not granted permission';
          break;
        case error.PERMISSION_DENIED_TIMEOUT:
          string = 'user did not grant permission in time';
          break;
        case error.POSITION_UNAVAILABLE:
          string = 'unable to determine position';
          break;
        default:
          string = 'unknown error';
        }
        dfrd.reject('GeoLocation error: ' + string);
      },
      options
    );
    return dfrd.promise();
  };

  /*jslint unparam:true*/
  function setupGoogleMapsBasic(element, data, map) {
    var location, options, marker, markerInfo;
    log('GoogleMaps basic: initialising...');
    MyAnswers.$body.trigger('taskBegun');
    location = new google.maps.LatLng(data.latitude, data.longitude);
    options = {
      zoom: parseInt(data.zoom, 10),
      center: location,
      mapTypeId: google.maps.MapTypeId[data.type.toUpperCase()]
    };

    map.setOptions(options);
    if (typeof data.kml === 'string') {
      google.maps.KmlLayer(data.kml, {
        map: map,
        preserveViewport: true
      });
    } else if (typeof data.marker === 'string') {
      marker = new google.maps.Marker({
        position: location,
        map: map,
        icon: data.marker
      });
      if (typeof data.markerTitle === 'string') {
        marker.setTitle(data.markerTitle);
        markerInfo = new google.maps.InfoWindow();
        google.maps.event.addListener(marker, 'click', function () {
          markerInfo.setContent(marker.getTitle());
          markerInfo.open(map, marker);
        });
      }
    }
    MyAnswers.$body.trigger('taskComplete');
  }
  /*jslint unparam:false*/

  function setupGoogleMapsDirections(element, data, map) {
    var origin, destination,
      geocoderOptions = {},
      travelMode = data.travelmode.toUpperCase(),
      directionsOptions = {
        travelMode: google.maps.DirectionsTravelMode[travelMode],
        avoidHighways: data.avoidhighways,
        avoidTolls: data.avoidtolls
      },
      mapOptions = {
        mapTypeId: google.maps.MapTypeId[data.type.toUpperCase()]
      },
      directionsDisplay,
      $element = $(element),
      $status = $element.next('.googledirections').first(),
      $directions = $status,
      promiseOrigin = true,
      promiseDestination = true,
      failedFn = function (string) {
        if (typeof string === 'string' && string.length) {
          insertText($status[0], string);
        }
      };

    log('GoogleMaps directions: initialising...');
    // setting Geocoder options
    if (typeof data.language === 'string') {
      geocoderOptions.language = data.language;
    }
    if (typeof data.region === 'string') {
      geocoderOptions.region = data.region;
      directionsOptions.region = data.region;
    }
    // setting origin
    if (typeof data.originAddress === 'string' && data.originAddress.length) {
      origin = data.originAddress;
    } else if (data.originLatitude) {
      origin = new google.maps.LatLng(data.originLatitude,
        data.originLongitude);
    } else if (Modernizr.geolocation) {
      log('Google Maps Directions: missing origin');
      insertText($status[0],
        'using your most recent location as the origin...');
      promiseOrigin = MyAnswers.getGeoLocation()
        .fail(failedFn)
        .then(function (coords) {
          origin = new google.maps.LatLng(coords.latitude, coords.longitude);
        });
    }
    // setting destination
    if (typeof data.destinationAddress === 'string' &&
        data.destinationAddress.length) {
      destination = data.destinationAddress;
    } else if (data.destinationLatitude) {
      destination = new google.maps.LatLng(data.destinationLatitude,
        data.destinationLongitude);
    } else if (Modernizr.geolocation) {
      log('Google Maps Directions: missing destination');
      insertText($status[0],
        'using your most recent location as the destination...');
      promiseDestination = MyAnswers.getGeoLocation()
        .fail(failedFn)
        .then(function (coords) {
          destination = new google.maps.LatLng(coords.latitude,
            coords.longitude);
        });
    }
    $.when(promiseOrigin, promiseDestination)
      .always(function () {
        if (origin && destination) {
          if ($.type(origin) === 'object' && $.type(destination) === 'object' &&
              origin.equals(destination)) {
            insertText($status[0], 'origin and destination are the identical');
            data.latitude = origin.lat();
            data.longitude = origin.lng();
            setupGoogleMapsBasic(element, data, map);
          } else {
            directionsOptions.origin = origin;
            directionsOptions.destination = destination;
            map.setOptions(mapOptions);
            // setup DirectionsRenderer
            directionsDisplay = new google.maps.DirectionsRenderer();
            directionsDisplay.setMap(map);
            directionsDisplay.setPanel($directions[0]);
            $.when(getGoogleDirections(directionsOptions))
              .fail(failedFn)
              .then(function (result) {
                directionsDisplay.setDirections(result);
              });
          }
        } else if (!origin && !destination) {
          insertText($status[0],
            'error: neither origin or destination could be determined');
        } else {
          if (origin) {
            insertText($status[0],
              'missing destination, only the provided origin is displayed');
            data.latitude = origin.lat();
            data.longitude = origin.lng();
            setupGoogleMapsBasic(element, data, map);
          } else { // destination
            insertText($status[0],
              'missing origin, only the provided destination is displayed');
            data.latitude = destination.lat();
            data.longitude = destination.lng();
            setupGoogleMapsBasic(element, data, map);
          }
        }
      });
  }

  MyAnswers.setupGoogleMaps = function ($view) {
    var $element = $view.find('div.googlemap').first(),
      data = $element.data(),
      element = $element[0],
      googleMap,
      currentMarker,
      currentInfo;

    MyAnswers.$body.trigger('taskBegun');
    google = window.google;
    googleMap = new google.maps.Map(element);
    if (data.mapAction === 'directions') {
      setupGoogleMapsDirections(element, data, googleMap);
    } else {
      setupGoogleMapsBasic(element, data, googleMap);
    }
    if (Modernizr.geolocation) {
      currentMarker = new google.maps.Marker({
        map: googleMap,
        // TODO: use a better icon for current location
        icon: siteVars.serverAppPath + '/images/location24.png',
        title: 'you are here'
      });
      currentInfo = new google.maps.InfoWindow();
      $.when(MyAnswers.getGeoLocation())
        .then(function (coords) {
          currentMarker.setPosition(new google.maps.LatLng(coords.latitude,
            coords.longitude));
        });
      google.maps.event.addListener(currentMarker, 'click', function () {
        currentInfo.setContent(currentMarker.getTitle());
        currentInfo.open(googleMap, currentMarker);
      });
    }
    MyAnswers.$body.trigger('taskComplete');
  };

}(this));
