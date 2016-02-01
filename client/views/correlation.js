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

        if(! (this.model.primary && this.model.secondary)) {
            return;
        }

        if(this._crossfilter) {
            this.cleanup();
        }
        this._crossfilter = util.dxGlue2(this.model.primary, this.model.secondary);

        // Tear down old plot
        var el = this.queryByHook('scatter-plot');
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
        delete this._svg;
        delete this._canvas;

        // Set up and plot
        this.setupPlot();
        this.setupColor();

        if(this.model.mode != 'fit') {
            this.updateSelection();
        }

        this.redraw();
    },

    // function called by dc on filter events.
    redraw: function () {
        if(! (this.model.primary && this.model.secondary)) {
            return;
        }

        // fit can have changed because of a filter event in dc
        // recalculate the fit through the new filtered data
        if(this.model.mode == 'fit') {
            this.updateFit();
        }

        this.plotPointsCanvas();
        this.plotLine();
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

        this.updateSelection();

        dc.redrawAll(); // will result in a callback to this.redraw()
    },

    clickFit:    function () {this.changeMode('fit');},
    clickDrop:   function () {this.changeMode('drop');},
    clickSelect: function () {this.changeMode('select');},

    changeMode: function (newmode) {

        this.model.mode = newmode;

        if(newmode == 'fit') {
            this._crossfilter.dimension.filterAll();
            this.updateFit();
        }
        else {
            this.updateSelection();
        }

        dc.redrawAll(); // will result in a callback to this.redraw()
    },
    changedPrimary: function () {
        this.model.mode = 'fit';
        this.renderContent();
    },
    changedSecondary: function () {
        this.model.mode = 'fit';
        this.renderContent();
    },
    changedTeriary: function () {
        this.setupColor();
        this.redraw();
    },
    cleanup: function () {
        if (this._crossfilter) {
            this._crossfilter.dimension.filterAll();
            this._crossfilter.dimension.dispose();
            delete this.dimension;
        }
    },

    setupColor: function () {
        if(this._zMap) {
            delete this._zMap;
        }

        if(this.model.tertiary) {
            // plot taken from tertiary facet value
            var colorscale = chroma.scale(["#022A08", "#35FE57"]);

            var zScale = this.model.tertiary.x.range([0,1]);

            var that = this.model;
            this._zMap = function (d) {
                var v = that.tertiary.value(d);
                if(isNaN(v) || v == Infinity) return chroma('gray').rgba();
                return colorscale(zScale(v)).rgba();
            };
        }
        else {
            // no-color plot
            this._zMap = function (d) {
                return chroma('gray').rgba();
            };
        }
    },

    setupPlot: function () {
        var el = this.queryByHook('scatter-plot');
        var height = 250;
        var width = parseInt(el.offsetWidth);

        // add the graph to the body of the webpage
        var main = d3.select(el).append("div")
            .attr("width", width)
            .attr("height", height)
            .style('position', 'relative');

        this._canvas = main.append("canvas")
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

        var xScale = this.model.primary.x.range([0,width - margin.left - margin.right]);
        var yScale = this.model.secondary.x.range([height - margin.top - margin.bottom,0]);

        // cache the value accessors; it makes using xMap and yMap much more practical
        var xValue = this.model.primary.value;
        var yValue = this.model.secondary.value;

        this._xMap = function (d) {
            return xScale(xValue(d)) + margin.left ;
        };
        this._yMap = function (d) {
            return yScale(yValue(d)) + margin.top;
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
        //    .text(this.model.primary);

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
        //    .text(this.model.secondary);

        // Fitted line
        svg.append("g")
            .attr("class", "regline")
            .append("line")
            .attr("x1", 0 ) // coordinates calculated in plotLine
            .attr("x2", 0 )
            .attr("y1", 0 )
            .attr("y2", 0 )
            .attr("stroke-width", 0)
            .attr("stroke", "black");

        this._width = width;
        this._height = height;
        this._svg = svg;
        this._xScale = xScale;
        this._yScale = yScale;
    },

    plotLine: function () {

        // Animate to the new postion, then immediately set stroke and color
        // This suppresses the (confusing) animation after a renderContent, but gives a slow delay
        this._svg.select(".regline").selectAll("line")
            .transition().duration(window.anim_speed)
                .attr("x1", this._xScale(this._x1))
                .attr("x2", this._xScale(this._x2))
                .attr("y1", this._yScale(this._y1))
                .attr("y2", this._yScale(this._y2))
            .transition().duration(0)
                .attr("stroke-width", 2)
                .attr("stroke", "black");
    },

    updateFit: function () {
        // calculate linear regression coefficients:
        // y = alfa + beta * x
        var stats = this._crossfilter.group.value();

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

        // Get start and end point coordinates for the line-to-plot
        this._x1 = this.model.primary.minval;
        this._x2 = this.model.primary.maxval;

        this._y1 = this.model.alfa + this._x1 * this.model.beta;
        this._y2 = this.model.alfa + this._x2 * this.model.beta;
    },

    updateSelection: function () {

        // remove old selection (also works when nothing was selected)
        this._crossfilter.dimension.filterAll();

        // Create new in/out filter function
        var isInside = this.model.mode == "drop" ? true : false;
        var cutoff = Math.sqrt((1-this.model.R2)*this.model.vary) * this.model.count;

        var that = this.model;
        this._filterFunction = function (d) {
            var distance = that.secondary.value(d) - (that.alfa + that.beta*that.primary.value(d));
            if (distance > -cutoff && distance < cutoff) 
                return isInside;
            else 
                return ! isInside;
        };

        this._crossfilter.dimension.filterFunction(this._filterFunction);
    },


    // FIXME: current implementation with two rendering passes is not optimal,
    //        and a potential performance bottleneck.
    plotPointsCanvas: function () {

        // define these here so we dont have to pass them as arguments all the time
        var opacity;
        var width = this._width;
        var xMap = this._xMap;
        var yMap = this._yMap;
        var zMap = this._zMap;
       
        // Start with a clean plot
        this._canvas.clearRect(0, 0, this._width, this._height);

        // Get image data as array
        var canvasData = this._canvas.getImageData(0, 0, this._width, this._height);

        // Modify canvas directly http://hacks.mozilla.org/2009/06/pushing-pixels-with-canvas/
        function drawPixel(x, y, color) {
            var index = (Math.round(x) + Math.round(y) * width) * 4;

            canvasData.data[index + 0] = color[0];
            canvasData.data[index + 1] = color[1];
            canvasData.data[index + 2] = color[2];
            canvasData.data[index + 3] = Math.round(color[3]*255*opacity);
        }

        function plotRecords(records) {
            var i = 0, cx, cy, cc;
            for(i=0; i < records.length; i++) {
                cx = xMap(records[i]);
                cy = yMap(records[i]);
                cc = zMap(records[i]);
                drawPixel(cx-1,cy  ,cc);
                drawPixel(cx+1,cy  ,cc);
                drawPixel(cx  ,cy-1,cc);
                drawPixel(cx  ,cy+1,cc);
                drawPixel(cx,  cy  ,cc);
            }
        }

        if(this.model.mode == 'fit') { 
            // plot points solid
            opacity = 1.0; 
            plotRecords(this._crossfilter.dimension.top(Infinity));
        }
        else { // model.mode == 'select'

            // remove our own filtering to also plot the points outside the filter
            this._crossfilter.dimension.filterAll();

            // plot all points ghosted
            opacity = 0.35;
            plotRecords(this._crossfilter.dimension.top(Infinity));

            // re-apply filtering
            this._crossfilter.dimension.filterFunction(this._filterFunction);

            // plot points solid
            opacity = 1.00;
            plotRecords(this._crossfilter.dimension.top(Infinity));
        }

        // Write canvas to screen
        this._canvas.putImageData(canvasData, 0, 0);
    },

});
