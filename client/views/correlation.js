var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var d3 = require('d3');
var util = require('../util');
var chroma = require('chroma-js');
var dc = require('dc');

var margin = {top: 10, bottom: 20, left: 30, right: 50}; // default margins from DC

// Correlation filter
//  - calculates correlation between two facets, the primary and secondary facet.
//  - shows an (x,y) plot, with optional colors taken from the tertiary facet.
//
// We cannot reuse any of the standard cross filters (_fg1, and _fg2 from the widget frame)
// because we want to filter on a dynamic property, ie. deviation from a calculated fit.
// Therefore, when selecting points, create a temporary facet _dx that is deviation from fit.
//
// Approach:
// 0. dispose _dx facet and filter, dispose grouping on _fg1
// 1. create a grouping on _fg1 that calculates sums (x, y, xy, xx, yy). Depends on _fg1.valueFn, and _fg2.valueFn. : setupLinearRegression view._reggroup
// A. mode == 'fit': 
//    on filter events, do regression, update fit parameters in this.model, redraw points (full) and line
//    on changed{Primary,Secondary} start over with full render/setup.
//    on changedTertiary, redraw
// B. mode != 'fit'
//    on filter events, redraw unselected points (shaded) and selected points (full) and line
//    on changed{Primary,Secondary} start over with full render/setup.
//    on changedTertiary, redraw
//    on uiEvent dispose and recreate _dx facet and filter
//
// A -> B: create _dx facet and filter
// B -> A: dispose _dx facet and filter



var setupLinearRegression = function (view) {

    if(view._reggroup) {
        delete view._reggroup ;
    }

    // Setup the map/reduce for the simple linear regression
    var xvalFn = view._fg1.valueFn;
    var yvalFn = view._fg2.valueFn;

    var reduceAdd = function (p,v) {
        var x = xvalFn(v);
        var y = yvalFn(v);
        if( x != Infinity && y != Infinity ) {
            p.count++;
            p.xsum += x;
            p.ysum += y;
            p.xysum += x * y;
            p.xxsum += x * x;
            p.yysum += y * y;
        }
        return p;
    };

    var reduceRemove = function (p,v) {
        var x = xvalFn(v);
        var y = yvalFn(v);
        if( x != Infinity && y != Infinity ) {
            p.count--;
            p.xsum -= x;
            p.ysum -= y;
            p.xysum -= x * y;
            p.xxsum -= x * x;
            p.yysum -= y * y;
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
    delete view._reggroup;
    view._reggroup = view._fg1.filter.groupAll();
    view._reggroup.reduce(reduceAdd, reduceRemove, reduceInitial);
};

var setupColor = function (view) {

    if(view._zMap) {
        delete view._zMap;
    }

    // Allow a no-color plot
    var colorscale = chroma.scale(["#022A08", "#35FE57"]);
    var zrange = [0,1];

    if(view._fg3) {
        zrange = util.getFGrange(view._fg3);
    }

    var zScale = d3.scale.linear().domain(zrange).range([0,1]);
    var zMap = function (d) {
        var v = util.validateFloat(d[view.model.tertiary.toLowerCase()]);
        if(isNaN(v) || v == Infinity) return chroma('gray').rgba();
        return colorscale(zScale(v)).rgba();
    };
    view._zMap = zMap;
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


    var xrange = util.getFGrange(view._fg1);
    var yrange = util.getFGrange(view._fg2);

    var xScale = d3.scale.linear().domain(xrange).range([0,width - margin.left - margin.right]);
    var yScale = d3.scale.linear().domain(yrange).range([height - margin.top - margin.bottom,0]);

    var xMap = function (d) {
        return xScale(view._fg1.valueFn(d));
    };
    var yMap = function (d) {
        return yScale(view._fg2.valueFn(d));
    };

    // x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height - margin.bottom - margin.top) + ")")
        .call(d3.svg.axis().scale(xScale).orient("bottom"))
        .append("text")
        .attr("class", "label")
        .attr("x", width - margin.left - margin.right)
        .attr("y", -6);
    //    .style("text-anchor", "end")
    //    .text(view.model.primary);

    // y-axis
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.svg.axis().scale(yScale).orient("left"))
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em");
    //    .style("text-anchor", "end")
    //    .text(view.model.secondary);

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

    view._width = width;
    view._height = height;
    view._svg = svg;
    view._canvas = canvas;
    view._xMap = xMap;
    view._yMap = yMap;
    view._xScale = xScale;
    view._yScale = yScale;
};

var plotLine = function (view) {

    // Animate to the new postion, then immediately set stroke and color
    // This suppresses the (confusing) animation after a renderContent, but gives a slow delay
    view._svg.select(".regline").selectAll("line")
        .transition().duration(window.anim_speed)
            .attr("x1", view._xScale(view._x1))
            .attr("x2", view._xScale(view._x2))
            .attr("y1", view._yScale(view._y1))
            .attr("y2", view._yScale(view._y2))
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
    if(view.model.mode != 'fit') { 
        view._dy.filterAll();
        opacity = 0.35;
    }
    else {
        opacity = 1.0;
    }

    // Plot all points (possibly ghosted)
    records = view._fg1.filter.top(Infinity);
    plotRecords();
   
    // Re-plot all selected points if we are filtering
    if(view.model.mode != 'fit') { 
        view._dy.filterFunction(view._filterFunction);
        records = view._fg1.filter.top(Infinity);
  
        opacity = 1.0;
        plotRecords();
    }

    // Write canvas to screen
    view._canvas.putImageData(canvasData, 0, 0);
};

var updateFit = function (view) {

    // calculate linear regression coefficients:
    // y = alfa + beta * x
    var stats = view._reggroup.value();

    // update model
    var varx = (stats.xxsum / stats.count) - Math.pow(stats.xsum / stats.count,2);
    var vary = (stats.yysum / stats.count) - Math.pow(stats.ysum / stats.count,2);
    var covxy = (stats.xysum / stats.count) - (stats.xsum / stats.count) * (stats.ysum / stats.count);

    view.model.beta = covxy / varx;
    view.model.alfa = (stats.ysum / stats.count) - view.model.beta * (stats.xsum / stats.count);
    view.model.varx = varx;
    view.model.vary = vary;
    view.model.covxy = covxy;
    view.model.R2 = Math.pow(covxy, 2) / (varx * vary);

    setupLine(view);
};

var setupLine = function (view) {
    // Get start and end point coordinates for the line-to-plot
    var range = util.getFGrange(view._fg1);
    view._x1 = range[0];
    view._x2 = range[1];

    view._y1 = view.model.alfa + range[0] * view.model.beta;
    view._y2 = view.model.alfa + range[1] * view.model.beta;
};

var resetSelection = function (view) {

    // Remove previous selection
    if(view._dy) {
        view._dy.filterAll();
        view._dy.dispose();
        delete view._dy;
    }
    delete view._filterFunction;
};

var updateSelection = function (view) {

    // crossfilter values are assumed to be static, 
    // so we have to create a new dimension and filter
    resetSelection(view);

    var alfa = view.model.alfa;
    var beta = view.model.beta;
    view._dy = window.app.crossfilter.dimension(function(d) {
        return view._fg2.valueFn(d) - (alfa + beta*view._fg1.valueFn(d));
    });


    // Create new in/out filter function
    var isInside = view.model.mode == "drop" ? true : false;
    var delta = Math.sqrt((1-view.model.R2)*view.model.vary) * view.model.count;

    view._filterFunction = function(d) {
        if (d > -delta && d < delta) 
            return isInside;
        else 
            return ! isInside;
    };
    view._dy.filterFunction(view._filterFunction);
};


module.exports = ContentView.extend({
    template: templates.includes.correlation,

    bindings: {
        'model.pretty_fit': {
            type: 'text',
            hook: 'pretty-fit'
        },
        'model.count': {
            type: 'value',
            hook: 'count'
        },
        'cid' : [
            {
                type: 'attribute',
                hook: 'button',
                name: 'id',
            },
            {
                type: 'attribute',
                hook: 'ul',
                name: 'for',
            },
        ],
        'model.pretty_mode': {
            type: 'text',
            hook: 'label',
        },
    },
    renderContent: function () {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        if(! this.model.isReady) {
            return;
        }

        // Create a grouping on _fg1 that calculates sums (x, y, xy, xx, yy)
        if(this._reggroup) {
            delete this._reggroup;
        }
        setupLinearRegression(this);

        // Tear down old plot
        var el = this.queryByHook('scatter-plot');
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
        delete this._svg;
        delete this._canvas;

        // Set up and plot
        setupPlot(this);

        if(this.model.mode == 'fit') {
            resetSelection(this);
            updateFit(this);
        }
        else {
            updateSelection(this);
        }
        setupLine(this);

        this.redraw();
    },

    // function called by dc on filter events.
    redraw: function () {

        if(! this.model.isReady) {
            return;
        }

        if(this.model.mode == 'fit') {
            updateFit(this);
        }

        setupColor(this);
        plotPointsCanvas(this);
        plotLine(this);
    },

    events: {
        'change [data-hook~=count]': 'changeCount',
        'change [data-hook~=mode]': 'changeMode',
        'click [data-hook~=fit]': 'clickFit',
        'click [data-hook~=drop]': 'clickDrop',
        'click [data-hook~=select]': 'clickSelect',
    },

    changeCount: function () {
        var select = this.el.querySelector('[data-hook~="count"]');
        this.model.count = parseFloat(select.value);

        if(this.model.mode == 'fit') return;

        updateSelection(this);
        dc.redrawAll();
    },

    clickFit:    function () {this.changeMode('fit');},
    clickDrop:   function () {this.changeMode('drop');},
    clickSelect: function () {this.changeMode('select');},

    changeMode: function (newmode) {
        var prev = this.model.mode;
        this.model.mode = newmode;

        if(this.model.mode == 'fit') {
            resetSelection(this); 
            updateFit(this);
        }
        else {
            // when both current and previous state are a selection (drop/select), dont update the fit
            updateSelection(this);
        }

        dc.redrawAll();
    },
    changedPrimary: function () {
        this.model.mode = 'fit';
        resetSelection(this); 
        this.renderContent();
    },
    changedSecondary: function () {
        this.model.mode = 'fit';
        resetSelection(this); 
        this.renderContent();
    },
    changedTeriary: function () {
        this.redraw();
    },
    cleanup: function () {
        resetSelection(this);
    },
});
