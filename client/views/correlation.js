var app = require('ampersand-app');
var ContentView = require('./widget-content');
var filterItemView = require('./filteritem.js');
var templates = require('../templates');
var d3 = require('d3');
var util = require('../util');
var chroma = require('chroma-js');

var margin = {top: 10, bottom: 20, left: 30, right: 50}; // default margins from DC

var setupPlot = function (view) {
    // get data
    var _dx = app.filters.get(view.model.filter).get('_dx');
    var records = _dx.top(Infinity);

    var el = view.queryByHook('scatter-plot');
    var height = 250;
    var width = parseInt(el.offsetWidth);

    // add the graph to the body of the webpage
    var main = d3.select(el).append("div")
        .attr("width", width)
        .attr("height", height)
        .style('position', 'relative');

    var canvas = main.append("canvas")
        .attr("width", width)
        .attr("height", height)
        .node().getContext('2d');

    var svg = main.append("svg")
        .style("position", "absolute")
        .style("top", "0px")
        .style("left", "0px")
        .style("z-index", 2)
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var colorscale = chroma.scale(["#022A08", "#35FE57"]);

    var xrange = window.app.filters.get(view.model.filter)._range;
    var yrange = window.app.filters.get(view.model.secondary)._range;

    // Allow a no-color plot
    var zrange = [0,1];
    if(window.app.filters.get(view.model.color)) {
        zrange = window.app.filters.get(view.model.color)._range;
    }

    var xScale = d3.scale.linear().domain(xrange).range([0,width - margin.left - margin.right]);
    var yScale = d3.scale.linear().domain(yrange).range([height - margin.top - margin.bottom,0]);
    var zScale = d3.scale.linear().domain(zrange).range([0,1]);

    var xMap = function (d) {
        var v = util.validateFloat(d[view.model.filter.toLowerCase()]);
        if(isNaN(v) || v == Infinity) return -99999; 
        return xScale(v);
    };
    var yMap = function (d) {
        var v = util.validateFloat(d[view.model.secondary.toLowerCase()]);
        if(isNaN(v) || v == Infinity) return -99999;
        return yScale(v);
    };
    var zMap = function (d) {
        var v = util.validateFloat(d[view.model.color.toLowerCase()]);
        if(isNaN(v) || v == Infinity) return 'gray';
        return colorscale(zScale(v));
    };

    // x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height - margin.bottom - margin.top) + ")")
        .call(d3.svg.axis().scale(xScale).orient("bottom"))
        .append("text")
        .attr("class", "label")
        .attr("x", width - margin.left - margin.right)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(view.model.filter);

    // y-axis
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.svg.axis().scale(yScale).orient("left"))
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(view.model.secondary);

    view._width = width;
    view._height = height;
    view._svg = svg;
    view._canvas = canvas;
    view._xMap = xMap;
    view._yMap = yMap;
    view._zMap = zMap;
    view._yScale = yScale;
};

var plotPointsCanvas = function (view) {

    // get data
    var id = app.filters.get(view.model.filter).get('id').toLowerCase();
    var _dx = app.filters.get(view.model.filter).get('_dx');
    var records = _dx.top(Infinity);

    // Clear the canvas
    var canvas = view._canvas;

    canvas.clearRect(0,0,view._width,view._height);

    canvas.beginPath();

    var i = 0, cx, cy;
    for(i=0; i < records.length; i++) {
        cx = view._xMap( records[i] ) + margin.left;
        cy = view._yMap( records[i] ) + margin.top;
        
        canvas.moveTo(cx, cy);
        canvas.arc( cx, cy, 3.5, 0, 2 * Math.PI);
    }

    canvas.fill();
};


module.exports = ContentView.extend({
    template: templates.includes.correlation,

    render: function() {
        var select;

        this.renderWithTemplate(this);

        // initialize secondary and color filter selector
        this.renderCollection(app.filters,
                              filterItemView,
                              this.queryByHook('filter-selector'),
                              {filter: function (f) {return f.active;}});
        select = this.el.querySelector('select[data-hook~="filter-selector"]');
        select.value = this.model.secondary;


        this.renderCollection(app.filters,
                              filterItemView,
                              this.queryByHook('color-selector'),
                              {filter: function (f) {return f.active;}});
        select = this.el.querySelector('select[data-hook~="color-selector"]');
        select.value = this.model.secondary;

        return this;
    },

    renderContent: function (view) {
        if(! view.model.isReady) {
            return;
        }

        // Tear down old plot
        var el = view.queryByHook('scatter-plot');
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }

        if(view._svg) {
            delete view._svg;
        }
        if(view._canvas) {
            delete view._canvas;
        }

        // Set up and plot
        setupPlot(view);
        this.redraw();
    },

    // function called by dc on filter events.
    redraw: function () {
        if(! this.model.isReady) {
            return;
        }

        plotPointsCanvas(this);
        plotLine(this);
    },

    // Respond to secondary filter changes
    events: {
        'change': 'changeFilter',
    },

    changeFilter:  function (e) {
        var select;

        select = this.el.querySelector('[data-hook~="filter-selector"]');
        this.model.secondary = select.options[select.selectedIndex].value;

        select = this.el.querySelector('[data-hook~="color-selector"]');
        this.model.color = select.options[select.selectedIndex].value;

        this.renderContent(this);
    },
});
