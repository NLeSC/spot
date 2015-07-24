var app = require('ampersand-app');
var View = require('ampersand-view');
var filterItemView = require('./filteritem.js');
var templates = require('../templates');
var dc = require('dc');
var d3 = require('d3');
var util = require('../util');


var setupPlot = function (view) {
    // get data
    var _dx = app.filters.get(view.model.filter).get('_dx');
    var records = _dx.top(Infinity);

    var el = view.queryByHook('scatter-plot');

    var width = parseInt(0.8 * view.el.offsetWidth);
    var height = width;
    var margin = {top: 20, right: 20, bottom: 30, left: 40};

    // add the graph canvas to the body of the webpage
    var svg = d3.select(el).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // setup x 
    var xValue = function(d) {return util.validateFloat(d[view.model.filter.toLowerCase()]);}, // data -> value
        xScale = d3.scale.linear().range([0, width]), // value -> display
        xMap = function(d) { return xScale(xValue(d));}, // data -> display
        xAxis = d3.svg.axis().scale(xScale).orient("bottom");

    // setup y
    var yValue = function(d) { return util.validateFloat(d[ view.model.secondary.toLowerCase()]);}, // data -> value
        yScale = d3.scale.linear().range([height, 0]), // value -> display
        yMap = function(d) { return yScale(yValue(d));}, // data -> display
        yAxis = d3.svg.axis().scale(yScale).orient("left");

    // don't want dots overlapping axis, so add in buffer to data domain
    xScale.domain([d3.min(records, xValue)-1, d3.max(records, xValue)+1]);
    yScale.domain([d3.min(records, yValue)-1, d3.max(records, yValue)+1]);

    // x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(view.model.filter);

    // y-axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(view.model.secondary);

    view._svg = svg;
    view._xMap = xMap;
    view._yMap = yMap;
};


var plotPoints = function (view) {
    // get data
    var _dx = app.filters.get(view.model.filter).get('_dx');
    var records = _dx.top(Infinity);

    // remove all
    var svg = view._svg;
    svg.selectAll(".dot").remove();

    // draw dots
    svg.selectAll(".dot")
        .data(records)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", view._xMap)
        .attr("cy", view._yMap)
        .style("fill", "red" );
};



module.exports = View.extend({
    template: templates.includes.correlation,
    initialize: function () {
        // we want to receive redraw signals from dc
        dc.registerChart(this);

        // and clean up the listener when done 
        this.once('remove', function () {
            dc.deregisterChart(this);
        }, this );

    },
    render: function() {
        this.renderWithTemplate(this);
        this.renderCollection(app.filters,
                              filterItemView,
                              this.queryByHook('filter-selector'),
                              {filter: function (f) {return f.active;}});

        // initialize secondary filter selector
        var select = this.el.querySelector('select');
        select.value = this.model.secondary;

        return this;
    },
    renderContent: function (view) {
        if(! view.model.isReady) {
            return;
        }

        // Tear down old plot
        if(view._svg) {
            var el = view.queryByHook('scatter-plot');
            d3.selectAll(el.childNodes).remove();
            delete view._svg;
        }

        setupPlot(view);
        plotPoints(view);
    },

    // function called by dc on filter events.
    redraw: function () {
        if(! this.model.isReady) {
            return;
        }
        plotPoints(this);
    },

    // Respond to secondary filter changes
    events: {
        'change': 'changeFilter',
    },
    changeFilter:  function (e) {
        var select = this.el.querySelector('[data-hook~="filter-selector"]');
        this.model.secondary = select.options[select.selectedIndex].value;

        this.renderContent(this);
    },

    // Used by dc when deregistering
    anchorName: function () {
        return this.cid;
    },
});
