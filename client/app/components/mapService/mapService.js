(function () {
  angular.module('notinphillyServerApp')
    .service('mapService', ['$http', 'leafletData', function($http, leafletData) {
      var mapLayerGroup = L.layerGroup();
      var mapCallbacks = {
        neighborhoodMouseOverCallback : undefined,
        neighborhoodMouseOutCallback : undefined,
        neighborhoodMouseClickCallback : undefined,
        streetMouseOverCallback : undefined,
        streetMouseOutCallback: undefined
      };

      this.setMapCallbacks = function(callbacks) {
        mapCallbacks = callbacks;
      };

      this.setNeighborhoodLayers = function()
      {
        $http.get("api/neighborhoods/getAllGeojson/").success(function(data, status) {
          mapLayerGroup.clearLayers();

          leafletData.getMap().then(function (map) {
            /* //Remove builtin zoom control
            leafletData.getMap().then(function (map) {
              if(map.zoomControl)
              {
                map.zoomControl.removeFrom(map);
              }
            });*/

            var geoJsonLayer = L.geoJson(data,
            {
              onEachFeature: function (feature, layer){
                     layer.setStyle(setNeighborhoodColor(feature));
                     layer.on({
                      mouseover: function(e) { highlightNeighborhood(e); mapCallbacks.neighborhoodMouseOverCallback(e); },
                      mouseout: function(e) { resetHighlightNeighborhood(e); mapCallbacks.neighborhoodMouseOutCallback(e); },
                      click: function(e) { onLayerClick(e); mapCallbacks.neighborhoodMouseOutCallback(e); mapCallbacks.neighborhoodMouseClickCallback(e); },
                      layerremove: function(e) { mapCallbacks.neighborhoodMouseOutCallback(e); }
                     });
                   },
              style: {
                color: '#9A9B9C',
                weight: 2,
                fillOpacity: 0.4,
                fillColor: '#484848'
              }
            });
            map.setZoom(13);
            mapLayerGroup.addLayer(geoJsonLayer);
            mapLayerGroup.addTo(map);
          });
         });
      }

      this.showStreetPopup = function(latLang, target, properties)
      {
        leafletData.getMap().then(function (map) {
          var streetLongLat = latLang;
          var pantToLongLat = target.feature.geometry.coordinates[0];

          map.panTo({lat: pantToLongLat[1], lng: pantToLongLat[0]});
          var imageSrc = "https://maps.googleapis.com/maps/api/streetview?size=220x100&location=" +  streetLongLat.lat + "," + streetLongLat.lng  + "&fov=70&heading=170&pitch=10"

          properties.imageSrc = imageSrc;
          var popup = L.popup({
            keepInView: true,
            minWidth: 240,
            properties: properties
          });
          target.bindPopup(popup);

          popup.setContent('<div ng-include="\'app/map/street-popup-template.html\'"></div>');
          target.openPopup();
        });
      }

      this.addNeigborhoodStreets = function(neighborhoodId)
      {
        setupStreets(neighborhoodId);
      }

      this.goToStreet = function(streetId)
      {
        leafletData.getMap().then(function (map) {
          $http.get("api/streets/" + streetId).success(function(data, status) {
            var start = L.latLng(data.geodata.geometry.coordinates[0][1], data.geodata.geometry.coordinates[0][0]);
            var end = L.latLng(data.geodata.geometry.coordinates[1][1], data.geodata.geometry.coordinates[1][0]);
            var streetBounds = new L.LatLngBounds(start, end);
            var streetCenter = streetBounds.getCenter();
            map.panTo(streetCenter);
            map.setZoom(17);

            setupStreets(data.neighborhood);
          },
          function(err) {

          });
        });
      }

      var setupStreets = function(neighborhoodId)
      {
        leafletData.getMap().then(function (map) {
          mapLayerGroup.clearLayers();

          $http.get("api/streets/byparentgeo/" + neighborhoodId).success(function(data, status) {
            var geoJsonLayer = L.geoJson(data,
            {
              onEachFeature : function (feature, layer){
                 layer.setStyle(getStreetStyle(feature));
                 layer.on({
                  mouseover: function(e) { mapCallbacks.streetMouseOverCallback(e); },
                  mouseout: function(e) { mapCallbacks.streetMouseOutCallback(e); },
                  click: function(e) { mapCallbacks.streetClickCallback(e); }
                });
               },
              style: {
                color: '#484848',
                weight: 15,
                opacity: 0.4
              }
            });
            mapLayerGroup.addLayer(geoJsonLayer);
            geoJsonLayer.addTo(map);
          });
        });
      }

      var onLayerClick = function(e)
      {
        if(e.target.feature)
        {
          leafletData.getMap().then(function (map) {
            var triggeredFeature = e.target.feature;
            var properties = triggeredFeature.properties;
            var layerBounds = e.layer.getBounds();

            //map.fitBounds(layerBounds);

            var nhoodCenter = layerBounds.getCenter();
            nhoodCenter.lng = nhoodCenter.lng - 0.001;
            map.panTo(nhoodCenter);
            map.setZoom(16);

            setupStreets(properties.id);
          });
        }
      }

      var getStreetStyle = function(feature){
        if(feature.properties.isAdopted)
        {
          return {
            color: '#26A053',
            weight: 15,
            opacity: 0.4
          };
        }
      }

      var setNeighborhoodColor = function (feature)
      {
         var properties = feature.properties;

         if(!properties.active)
         {
           return {
             color: '#9A9B9C',
             weight: 2,
             fillColor: '#484848',
             fillOpacity: 0.3
           };
         }
         else {
           if(properties.percentageAdoptedStreets == 0)
           {
             return {
               color: '#9A9B9C',
               weight: 2,
               fillColor: '#49586B',
               fillOpacity: 0.2
             };
           }
           else if(properties.percentageAdoptedStreets > 0 && properties.percentageAdoptedStreets < 25)
           {
              return {
                color: '#9A9B9C',
                weight: 2,
                fillColor: '#6AC48E',
                fillOpacity: 0.2
              };
            }
            else if(properties.percentageAdoptedStreets > 25 && properties.percentageAdoptedStreets < 60)
            {
              return {
                  color: '#9A9B9C',
                  weight: 2,
                  fillColor: '#26A053',
                  fillOpacity: 0.2
                };
             }
             else
             {
                return {
                    color: '#9A9B9C',
                    weight: 2,
                    fillColor: '#2E8E52',
                    fillOpacity: 0.2
                  };
             }
         }

      };

      var highlightNeighborhood = function(e) {
          var layer = e.target;
          var properties = layer.feature.properties;

          if(properties.active)
          {
            layer.setStyle({
                weight: 7,
                fillOpacity: 0.5,
                color: '#666'
            });

            if (!L.Browser.ie && !L.Browser.opera) {
                layer.bringToFront();
            }
          }
      };

      var resetHighlightNeighborhood = function(e) {
          var layer = e.target;
          var properties = layer.feature.properties;

          if(properties.active)
          {
            layer.setStyle({
              color: '#9A9B9C',
              fillOpacity: 0.2,
              weight: 2
            });
          }
      };
  }]);
})();
