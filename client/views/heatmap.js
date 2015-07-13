var View = require('ampersand-view');
var templates = require('../templates');
var app = require('ampersand-app');

var dc = require('dc');
var ol = require('openlayers');
var chroma = require('chroma-js');


var recalculateColors = function (model) {
    var _dx = app.filters.get(model.filter).get('_dx');
    var records = _dx.top(Infinity);
    var scale = chroma.scale(["#022A08", "#35FE57"]);

    var min = Infinity;
    var max = -Infinity;

    var idToColor = {}; // keys -> model.id, values -> rgba value

    // Find range [min, max]
    for(var r=0; r < records.length; r++) {
        var value = records[r][ model.filter.toLowerCase()]; // FIXME: data keys lowercase
        if ( value != Infinity ) {
            if (value < min ) {
                min = value;
            }
            if (value > max ) {
                max = value;
            }
            idToColor[ records[r].gid ] = value;  // FIXME properly deal with record ID name, here gid
        }
    } 

    // Normalize to [0,1] and color it
    var norm = 1.0 * (max - min);

    // Update the view
    model.min = min;
    model.max = max;
    model.total = Object.keys(idToColor).length;

    for(var key in idToColor) {
        idToColor[key] = scale((idToColor[key] - min) / norm)._rgb;
    }

    vector.getSource().forEachFeature(function(f) {
        var id = f.getId();

        if( id in idToColor ) {
            var newColor = idToColor[ f.getId() ];
            var newStyle = [new ol.style.Style({
                fill: new ol.style.Fill({color: idToColor[f.getId()]}),
            })];
            f.setStyle( newStyle );
        }
        else {
            var hiddenStyle = [new ol.style.Style({
                fill: new ol.style.Fill({color: [0,0,0,0]}),
            })];
            f.setStyle( hiddenStyle );
        }
    });
};

var vector = new ol.layer.Vector({
    source: new ol.source.Vector({ url: 'data/topo.json',
        format: new ol.format.TopoJSON()
    }),
});


var map = new ol.Map({
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

module.exports = View.extend({
    template: templates.includes.heatmap,
    bindings: {
        'model.min': {
            type: 'text',
            hook: 'min'
        },
        'model.max': {
            type: 'text',
            hook: 'max'
        },
        'model.total': {
            type: 'text',
            hook: 'total'
        },
        'model.alpha': {
            type: 'value',
            hook: 'alpha',
        },
    },
    initialize: function () {
        // re-render when a different filter is selected
        this.model.on( 'change:filter', function () {
            this.recalculateColors(this.model);
        }, this );

        dc.registerChart(this);
    },
    // function called by dc on filter events.
    redraw: function () {
        this.recalculateColors(this.model);
    },
    renderContent: function (view) {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        view.queryByHook('alpha').value = view.model.alpha;
        view.recalculateColors(view.model);

        map.setTarget( view.queryByHook('heatmap') );
        map.setSize( [x,y] );
    },
    handleSlider: function () {
        this.model.alpha = parseInt(this.queryByHook('alpha').value) ;
        vector.setOpacity(  this.model.alpha * 0.01 );
    },
    events: {
        'change [data-hook~=alpha]': 'handleSlider',
    },
    recalculateColors: recalculateColors,
});
