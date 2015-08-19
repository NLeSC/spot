var app = require('ampersand-app');
var ContentView = require('./widget-content');
var filterItemView = require('./filteritem.js');
var templates = require('../templates');
var d3 = require('d3');
var util = require('../util');
var chroma = require('chroma-js');
var dc = require('dc');

var margin = {top: 10, bottom: 20, left: 30, right: 50}; // default margins from DC

var setupLinearRegression = function (view) {
    // Setup the map/reduce for the simple linear regression
    var xid = view.model.filter.toLowerCase();
    var yid = view.model.secondary.toLowerCase();

    var reduceAdd = function (p,v) {
        if( util.validateFloat(v[xid]) != Infinity && util.validateFloat(v[yid]) != Infinity ) {
            p.count++;
            p.xsum += v[xid];
            p.ysum += v[yid];
            p.xysum += v[xid] * v[yid];
            p.xxsum += v[xid] * v[xid];
            p.yysum += v[yid] * v[yid];
        }
        return p;
    };

    var reduceRemove = function (p,v) {
        if( util.validateFloat(v[xid]) != Infinity && util.validateFloat(v[yid]) != Infinity ) {
            p.count--;
            p.xsum -= v[xid];
            p.ysum -= v[yid];
            p.xysum -= v[xid] * v[yid];
            p.xxsum -= v[xid] * v[xid];
            p.yysum -= v[yid] * v[yid];
        }
        return p;
    };

    var reduceInitial = function () {
        return {
            count: 0,
            xsum: 0,
            ysum: 0,
            xysum: 0,
            xxsum: 0,
            yysum: 0,
        }; 
    };

    // Setup grouping
    var group = view._dy.groupAll();
    group.reduce(reduceAdd, reduceRemove, reduceInitial);

    return group;
};

var setupPlot = function (view) {
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
        if(isNaN(v) || v == Infinity) return chroma('gray').rgba();
        return colorscale(zScale(v)).rgba();
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

    // Fitted line
    svg.append("g")
        .attr("class", "regline")
        .append("line")
        .attr("x1", xScale(xrange[0]))
        .attr("x2", xScale(xrange[1]))
        .attr("y1", yScale(yrange[0]))
        .attr("y2", yScale(yrange[0]))
        .attr("stroke-width", 0)
        .attr("stroke", "black");

    if (view._reggroup) {
        view._reggroup.dispose();
    }
    view._reggroup = setupLinearRegression(view);

    view._width = width;
    view._height = height;
    view._svg = svg;
    view._canvas = canvas;
    view._xMap = xMap;
    view._yMap = yMap;
    view._zMap = zMap;
    view._yScale = yScale;
};

var plotLine = function (view) {

    // Get start and end point coordinates
    var x = window.app.filters.get(view.model.filter)._range;
    var y1 = view._yScale(view.model.alfa + x[0] * view.model.beta);
    var y2 = view._yScale(view.model.alfa + x[1] * view.model.beta);

    // Animate to the new postion, then immediately set stroke and color
    // This suppresses the (confusing) animation after a renderContent, but gives a slow delay
    view._svg.select(".regline").selectAll("line")
        .transition().duration(window.anim_speed)
            .attr("y1", y1)
            .attr("y2", y2)
        .transition().duration(0)
            .attr("stroke-width", 2)
            .attr("stroke", "black");
};

var plotPointsCanvas = function (view) {

    var opacity = 1.0, records;

    // Start with a clean plot
    view._canvas.clearRect(0, 0, view._width, view._height);
    var canvasData = view._canvas.getImageData(0, 0, view._width, view._height);

    // Modify canvas directly http://hacks.mozilla.org/2009/06/pushing-pixels-with-canvas/
    function drawPixel(x, y, color) {
        var index = (Math.round(x) + Math.round(y) * view._width) * 4;

        canvasData.data[index + 0] = color[0];
        canvasData.data[index + 1] = color[1];
        canvasData.data[index + 2] = color[2];
        canvasData.data[index + 3] = Math.round(color[3]*255*opacity);
    }

    function plotRecords() {
        var i = 0, cx, cy, cc;
        for(i=0; i < records.length; i++) {
            cx = view._xMap(records[i]) + margin.left;
            cy = view._yMap(records[i]) + margin.top;
            cc = view._zMap(records[i]);
            drawPixel(cx-1,cy  ,cc);
            drawPixel(cx+1,cy  ,cc);
            drawPixel(cx  ,cy-1,cc);
            drawPixel(cx  ,cy+1,cc);
            drawPixel(cx,  cy  ,cc);
        }
    }

    // remove our own filtering to also plot the points outside the filter
    if(view._dy) { 
        view._dy.filterAll();
        opacity = 0.35;
    }
    else {
        opacity = 1.0;
    }

    // Plot all points (possibly ghosted)
    records = view._dy.top(Infinity);
    plotRecords();
   
    // Re-plot all selected points if we are filtering
    if(view.model.mode == 'select') { 
        view._dy.filterFunction(view._filterFunction);
        records = view._dy.top(Infinity);
  
        opacity = 1.0;
        plotRecords();
    }

    // Write canvas to screen
    view._canvas.putImageData(canvasData, 0, 0);
};

var resetSelection = function (view) {

    // Remove previous selection
    if(view._dy) {
        view._dy.filterAll();
        view._dy.dispose();
        delete view._dy;
        delete view._filterFunction;
    }

    // Get fit parameters
    var xid = view.model.filter.toLowerCase();
    var yid = view.model.secondary.toLowerCase();
    var alfa = view.model.alfa;
    var beta = view.model.beta;
    var delta = Math.sqrt((1-view.model.R2)*view.model.vary) * view.model.count;

    var isInside;
    isInside = view.model.inout == "in" ? true : false;

    // Construct new filter
    view._dy = window.app.crossfilter.dimension(function(d) {
        var val = util.validateFloat(d[yid]) - (alfa + beta*util.validateFloat(d[xid]));
        return val;
    });
    view._filterFunction = function(d) {
        if (d > -delta && d < delta) 
            return isInside;
        else 
            return ! isInside;
    };
};


module.exports = ContentView.extend({
    template: templates.includes.correlation,

    bindings: {
        'model.pretty_fit': {
            type: 'text',
            hook: 'pretty-fit'
        },
    },

    cleanup: function () {
        if (this._dy) {
            this._dy.filterAll();
            this._dy.dispose();
        }
    },

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

        select = this.el.querySelector('[data-hook~="count"]');
        select.value = this.model.count;

        select = this.el.querySelector('[data-hook~="in-or-out"]');
        select.value = this.model.inout;

        select = this.el.querySelector('[data-hook~="do-fit"]');
        select.checked = (this.model.mode == "fit");

        select = this.el.querySelector('[data-hook~="do-select"]');
        select.checked = (this.model.mode == "select");

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
        resetSelection(view);
        setupPlot(view);
        if(this.model.mode == 'select') {
            view._dy.filterFunction(view._filterFunction);
        }

        this.redraw();
    },

    // function called by dc on filter events.
    redraw: function () {
        if(! this.model.isReady) {
            return;
        }
        if(this.model.mode == 'fit') {
            // calculate linear regression coefficients:
            // y = alfa + beta * x
            var stats = this._reggroup.value();

            // update model
            var varx = (stats.xxsum / stats.count) - Math.pow(stats.xsum / stats.count,2);
            var vary = (stats.yysum / stats.count) - Math.pow(stats.ysum / stats.count,2);
            var covxy = (stats.xysum / stats.count) - (stats.xsum / stats.count) * (stats.ysum / stats.count);

            this.model.beta = covxy / varx;
            this.model.alfa = (stats.ysum / stats.count) - this.model.beta * (stats.xsum / stats.count);
            this.model.varx = varx;
            this.model.vary = vary;
            this.model.covxy = covxy;
            this.model.R2 = Math.pow(covxy, 2) / (varx * vary);
        }
        else if(this.model.mode == 'select') {
            // no-op, dont update the fit
        }

        plotPointsCanvas(this);
        plotLine(this);
    },

    // Respond to secondary filter changes
    events: {
        'change [data-hook~=filter-selector]': 'changeFilter',
        'change [data-hook~=color-selector]': 'changeColor',
        'change [data-hook~=count]': 'checkedCount',
        'change [data-hook~=in-or-out]': 'checkedInOrOut',
        'change [data-hook~=do-select]': 'checkedSelection',
        'change [data-hook~=do-fit]': 'checkedFit',
    },

    checkedFit: function () {
        var select = this.queryByHook('do-fit');
        if(! select.checked) return;

        this.model.mode = 'fit';
        resetSelection(this); 
        this._dy.filterFunction(this._filterFunction);

        dc.redrawAll();
    },
    checkedSelection: function () {
        var select = this.queryByHook('do-select');
        if(! select.checked) return;

        this.model.mode = 'select';
        resetSelection(this); 

        dc.redrawAll();
    },
    checkedInOrOut: function () {
        var select = this.el.querySelector('[data-hook~="in-or-out"]');
        this.model.inout = select.options[select.selectedIndex].value;

        resetSelection(this);
        this._dy.filterFunction(this._filterFunction);
        dc.redrawAll();
    },
    checkedCount: function () {
        var select = this.el.querySelector('[data-hook~="count"]');
        this.model.count = parseFloat(select.value);

        resetSelection(this);
        this._dy.filterFunction(this._filterFunction);
        dc.redrawAll();
    },

    changeFilter:  function () {
        var select = this.el.querySelector('[data-hook~="filter-selector"]');
        this.model.secondary = select.options[select.selectedIndex].value;

        this.renderContent(this);
    },
    changeColor: function() {
        var select = this.el.querySelector('[data-hook~="color-selector"]');
        this.model.color = select.options[select.selectedIndex].value;

        this.redraw();
    },
});
