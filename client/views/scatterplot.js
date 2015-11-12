var app = require('ampersand-app');
var ContentView = require('./widget-content');
var templates = require('../templates');
var util = require('../util');
var dc = require('dc');
var d3 = require('d3');

module.exports = ContentView.extend({
    template: templates.includes.scatterplot,
    render: function() {
        var select;

        this.renderWithTemplate(this);

        select = this.el.querySelector('[data-hook~="bincount"]');
        select.value = this.model.bincount;

        return this;
    },
    renderContent: function(view) {
        var x = parseInt(0.8 * this.el.offsetWidth);
        var y = parseInt(x);

        // dont do anything without a filter defined
        if(! view.model.isReady) {
            return;
        }

        // tear down existing stuff
        if(view._chart) {
            view._chart.filterAll();
            delete view._chart;
            // TODO: remove from dom?
        }
        if(view._dz) {
            view._dz.dispose();
            delete view._dz;            
        }

        // Get the 1-d filters for range setting
        var bincount = view.model.bincount;

        var filterx = window.app.filters.get(view.model.primary);
        var binsizex = (filterx._range[1] - filterx._range[0]) / bincount;

        var filtery = window.app.filters.get(view.model.secondary);
        var binsizey = (filtery._range[1] - filtery._range[0]) / bincount;

        // Construct new filter
        var xid = view.model.primary.toLowerCase();
        var yid = view.model.secondary.toLowerCase();
        
        var _dz = window.app.crossfilter.dimension(function(d) {
            var binx = Math.round( (util.validateFloat(d[xid]) - filterx._range[0]) / binsizex );
            var biny = Math.round( (util.validateFloat(d[yid]) - filtery._range[0]) / binsizey );
            return [binx * binsizex + filterx._range[0], biny * binsizey + filtery._range[0]];
        });

        // Options:
        // mouseZoomable : does not work well in comibination when using a trackpad
        // elasticX : when set to true, and the data contains Infinity, goes bonkers.
        var chart = dc.scatterPlot(this.queryByHook('scatterplot'));
        chart
            .brushOn(true)
            .mouseZoomable(false)
            .elasticX(false)
            .elasticY(true)
            .transitionDuration(window.anim_speed)
            .dimension(_dz)
            .group(_dz.group().reduceCount())
            .x(d3.scale.linear().domain(filterx._range))
            .y(d3.scale.linear().domain(filtery._range))
            .on('filtered', function(chart) {
                if(chart.hasFilter()) {
                    // update the model
                    view.model.range = chart.filters()[0];
                }
                else {
                    view.model.range = undefined;
                }
            });

        // keep a handle on the chart, will be cleaned up by the widget-content base class.
        chart.render();
        view._chart = chart;
        view._dz = _dz;
    },

    // Respond to secondary filter changes
    events: {
        'change [data-hook~=bincount]': 'changeBincount',
    },
    changeBincount:  function () {
        var select = this.el.querySelector('[data-hook~="bincount"]');
        this.model.bincount = parseInt(select.value);

        this.renderContent(this);
    },
});


