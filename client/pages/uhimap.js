var AmpersandModel = require('ampersand-model');
var app = require('ampersand-app');
var PageView = require('./base');
var View = require('ampersand-view');
var $ = require('jquery');
var ol = require('openlayers');
var chroma = require('chroma-js');


// Find suitable colors 
var recalculateColors = function (options) {
    var ActiveFilterColor = app.filters.getId( options.InfoBarModel.filter );
    var records = ActiveFilterColor.top(Infinity);
    var scale = chroma.scale(["#022A08", "#35FE57"]); // ['lightyellow', 'navy']); http://tristen.ca/hcl-picker/#/hlc/5/1.82/022A08/35FE57
    var idToColor = {}; // keys -> model.id, values -> rgba value

    var min = Infinity;
    var max = -Infinity;

    // Find range [min, max]
    for(var r=0; r < records.length; r++) {

        var value = parseFloat( records[r][ options.InfoBarModel.filter.toLowerCase() ] );
        if ( typeof value != "undefined" ) {
            if ( value > -9999999 ) { // FIXME document missing data values
                if (value < min ) {
                    min = value;
                }
                if (value > max ) {
                    max = value;
                }
                idToColor[ records[r].gid ] = value;  // FIXME properly deal with record ID name, here gid
            }
        }
    } 

    // Normalize to [0,1] and color it
    var norm = 1.0 * (max - min);

    // Update the view
    options.InfoBarModel.min = min;
    options.InfoBarModel.max = max;
    options.InfoBarModel.total = Object.keys(idToColor).length;

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

var InfoBarModel = AmpersandModel.extend({
    props: {
        min: 'number',
        max: 'number',
        total: 'number',
        alpha: 'number',
        filter: 'string',
    }
});

var InfoBarView = View.extend({
    template: '<div> <span>Range: <span data-hook="min"></span> - <span data-hook="max"></span></span> <span>Total: <span data-hook="total"></span></span><input data-hook="alphaslider" type="range"  min="0" max="100" value="100" /></div>',
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
            hook: 'alphaslider',
        },
    },
    handleSlider: function () {
        this.model.alpha = parseInt(this.queryByHook('alphaslider').value) ;
        vector.setOpacity(  this.model.alpha * 0.01 );
    },
    events: {
        'change [data-hook~=alphaslider]': 'handleSlider',
    },
});

var ActiveFilterView = View.extend({
    template: '<div class="btn-group" role="group" data-hook="dropdownitems"></div>',
    render: function() {
        this.renderWithTemplate(this);
        this.renderCollection(this.collection, ActiveFilterItemView, this.queryByHook('dropdownitems'));
        return this;
    }
});

var ActiveFilterItemView = View.extend({
    template: '<button type="button" class="btn btn-default" data-hook="dropdownitem"></button>',
    bindings: {
        'model.name': {
            type: 'text',
            hook: 'dropdownitem'
        },
        'model.active': {
            type: 'toggle',
            hook: 'dropdownitem',
        },
    },
    events: {
        'click [data-hook~=dropdownitem]':    'handleClick',
    },
    handleClick:  function () {
        this.parent.parent.InfoBarData.filter = this.model.id;
        recalculateColors({InfoBarModel: this.parent.parent.InfoBarData});
    },
});

module.exports = PageView.extend({
    pageTitle: 'UHI Map',
    template: '<div> <span data-hook="activefilters"> </span> <span class="uhimap"></span><span data-hook="infobar"></span></div>',
    initialize: function () {
        this.InfoBarData = new InfoBarModel({min:0, max:100, total:0, alpha:100});
    },
    render: function() {

        PageView.prototype.render.apply(this, arguments);

        map.setTarget( this.query( '.uhimap' ) );
        map.setSize( [ $(".navbar")[0].offsetWidth,  $(window).height()*0.75 ] );

        console.log( 'render called on map' );
    },
    subviews: {
        filterselector: {
            hook: 'activefilters',
            constructor: ActiveFilterView,
            prepareView: function (el) {
                return new this.subviews.filterselector.constructor({
                    el: el,
                    parent: this,
                    collection: app.filters,
                });
            }
        },
        infobar: {
            hook: 'infobar',
            constructor: InfoBarView,
            prepareView: function (el) {
                return new this.subviews.infobar.constructor({
                    el: el,
                    parent: this,
                    model: this.InfoBarData,
                });
            }
        }
    }
});
