var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var d3 = require('d3');
var util = require('../util');
var chroma = require('chroma-js');
var dc = require('dc');

var margin = {top: 10, bottom: 20, left: 30, right: 50}; // default margins from DC
var clippath = "inset(10,50,20,10)"; // from-top, from-right, from-bottom, from-left


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

        if(! this.model._crossfilter) {
            this.model.initFilter();
        }

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
            this.updateShading();
        }

        this.plotPointsCanvas();
        this.plotLine();
        this.plotShading();
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

        this.updateShading();
        this.plotShading();

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
            this.model._crossfilter.dimension.filterAll();
            this.updateFit();
            this.updateShading();
        }
        else {
            this.updateSelection();
        }

        dc.redrawAll(); // will result in a callback to this.redraw()
    },

    setupColor: function () {
        if(this._zMap) {
            delete this._zMap;
        }

        if(this.model.tertiary) {
            // plot taken from tertiary facet value
            var colorscale = chroma.scale(["#022A08", "#35FE57"]);

            var zScale = this.model.tertiary.x.range([0,1]);

            var accessor = this.model._crossfilter.valueAccessor;
            this._zMap = function (d) {
                return colorscale(accessor(d)).rgba();
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

        this._xMap = function (d) {
            return xScale(d.key[0]) + margin.left ;
        };
        this._yMap = function (d) {
            return yScale(d.key[1]) + margin.top;
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

        // y-axis
        svg.append("g")
            .attr("class", "y axis")
            .call(d3.svg.axis().scale(yScale).orient("left"))
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em");

        var clippath = svg.append("clipPath")
            .attr("id", "drawingarea");

        clippath.append("rect")
            .attr("x", 0 )
            .attr("y", 0 )
            .attr("width", width - margin.left - margin.right)
            .attr("height", height - margin.top - margin.bottom);

        // Clip to drawing area
        var drawing_area = svg.append("g")
            .attr("clip-path", "url(#drawingarea)");

        // Shading polygon
        drawing_area.append("g")
            .attr("class", "shadingpolygon")
            .append("polygon")
            .attr("points", "0,0 0,0 0,0 0,0") // coordinates calculated in plotLine
            .attr("opacity", 0.35)
            .attr("fill", "gray");

        // Fitted line
        drawing_area.append("g")
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
            .transition().duration(app.me.anim_speed)
                .attr("x1", this._xScale(this._x1))
                .attr("x2", this._xScale(this._x2))
                .attr("y1", this._yScale(this._y1))
                .attr("y2", this._yScale(this._y2))
            .transition().duration(0)
                .attr("stroke-width", 2)
                .attr("stroke", "black");
    },

    updateFit: function () {
        // Mannually do a groupAll().value()
        var stats_array = this.model._crossfilter.group.all();

        var count = 0, xsum = 0, ysum = 0, xysum = 0, xxsum = 0, yysum = 0;

        var i;
        for(i=0; i < stats_array.length; i++) {
            if(stats_array[i].key[0] != util.misval && stats_array[i].key[1] != util.misval) {
                count += stats_array[i].value.count;
                xsum  += stats_array[i].value.xsum;
                ysum  += stats_array[i].value.ysum;
                xysum += stats_array[i].value.xysum;
                xxsum += stats_array[i].value.xxsum;
                yysum += stats_array[i].value.yysum;
            }
        }

        var varx = (xxsum / count) - Math.pow(xsum / count,2);
        this.model.vary = (yysum / count) - Math.pow(ysum / count,2);
        var covxy = (xysum / count) - (xsum / count) * (ysum / count);

        // set linear regression coefficients: y = alfa + beta * x
        this.model.beta = covxy / varx;
        this.model.alfa = (ysum / count) - this.model.beta * (xsum / count);
        this.model.R2 = Math.pow(covxy, 2) / (varx * this.model.vary);

        // Get start and end point coordinates for the line-to-plot
        this._x1 = this.model.primary.minval;
        this._x2 = this.model.primary.maxval;

        this._y1 = this.model.alfa + this._x1 * this.model.beta;
        this._y2 = this.model.alfa + this._x2 * this.model.beta;


    },
    updateShading: function () {
        this._polypoints = [this._xScale(this._x1),this._yScale(this._y1 - this.model.cutoff),
                            this._xScale(this._x1),this._yScale(this._y1 + this.model.cutoff),
                            this._xScale(this._x2),this._yScale(this._y2 + this.model.cutoff),
                            this._xScale(this._x2),this._yScale(this._y2 - this.model.cutoff)];
    },
    plotShading: function () {
        this._svg.select(".shadingpolygon").selectAll("polygon")
            .transition().duration(app.me.anim_speed)
                .attr("points", this._polypoints.toString() );
    },

    updateSelection: function () {

        // remove old selection (also works when nothing was selected)
        this.model._crossfilter.dimension.filterAll();

        // Create new in/out filter function
        var isInside = this.model.mode == "drop" ? true : false;

        var that = this.model;
        this._filterFunction = function (d) {
            var distance = d[1] - (that.alfa + that.beta*d[0]);
            if (distance > -that.cutoff && distance < that.cutoff) 
                return isInside;
            else 
                return ! isInside;
        };

        this.model._crossfilter.dimension.filterFunction(this._filterFunction); // FIXME: direct use of crossfilter
    },


    plotPointsCanvas: function () {

        // define these here so we dont have to pass them as arguments all the time
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
            canvasData.data[index + 3] = 255;
        }

        function plotRecords(records) {
            var i = 0, cx, cy, cc;

            for(i=0; i < records.length; i++) {
                if(records[i].value.count > 0) { // Do not plot points for empty groups
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
        }

        // plot points
        plotRecords(this.model._crossfilter.group.all());

        // Write canvas to screen
        this._canvas.putImageData(canvasData, 0, 0);
    },
});
