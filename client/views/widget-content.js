var View = require('ampersand-view');

// DC charts should be added to the view as view._chart
// the base widget then takes care of chart and facet life cycles

module.exports = View.extend({

    initialize: function () {

        this.once('remove', function() {
            if(this._chart) {
                // remove dcjs chart
                delete this._chart;
            }
            if(this._chartjs) {
                // remove chartjs chart
                delete this._chartjs;
            }
        });
    },

    // Call-back on filter events
    // override to do custom rendering here
    update: function () {
    },

    // First rendering pass: add responsive widget to the DOM
    // The template and CSS can use relative sizes, be responsive, etc.
    render: function () {
        if(this.template) {
            this.renderWithTemplate(this);
        }

        return this;
    },

    // Second rendering pass: add fixed-width elements to the DOM
    // Things like SVG canvas, OpenLayers Maps
    // Should call renderContent on each subwidget (if any)
    renderContent: function () {
    },

    // // Used by DC when (de)registering
    // anchorName: function () {
    //     return this.cid;
    // }
});
