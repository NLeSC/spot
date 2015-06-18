var PageView = require('./base');
var $ = require('jquery');
var ol = require('openlayers');

var width, height;

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/topo.json',
    format: new ol.format.TopoJSON()
  })
});


var map = new ol.Map({
//      projection: "EPSG:32632",
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        }),
        vector
      ],
      view: new ol.View({
        center: [622293.2805652852, 6835614.194719033],
        zoom: 8
      })
    });

module.exports = PageView.extend({
    pageTitle: 'UHI Map',
    template: '<span class="uhimap"></span>',
    initialize: function() { },   
    render: function() {

        PageView.prototype.render.apply(this, arguments);
        map.setTarget(this.el);

        width = $(".navbar")[0].offsetWidth;
        height = $(window).height()*0.75;
        console.log( "width height:", width, height );
        map.setSize( [width,height] );
    },
});
