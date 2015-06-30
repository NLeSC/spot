var AmpersandModel = require('ampersand-model');
var Collection = require('ampersand-collection');
var View = require('ampersand-view');
var dc = require('dc');

var histogramModel = AmpersandModel.extend({
    props: {
        filter: ['any','false'],
    }
});

module.exports = View.extend({
    template: "<div data-hook='barchart'></div>", 
    bindings: {
        'model.filter': '[data-hook~=blank]',
    },
    initialize: function() {
        var self = this;
        this.model = new histogramModel();
        console.log( "calling render() on this", this );
        this.model.on( 'change:filter', function() {self.render();} );
    },
    render: function() {
        this.renderWithTemplate(this);

        console.log( "shall we?");
        if(this.model.filter) {
            console.log( "Action:", this.model.filter);

            var idx = this.model.filter.get('id').toLowerCase(); // FIXME: data keys are lowercase
            var _dx = this.model.filter.get('_dx');
            var max = _dx.top(1)[0][idx];
            var min = _dx.bottom(1)[0][idx];
            console.log( "Range:", min, max );

            var chart = dc.barChart(this.queryByHook('barchart'));
            chart
                .width(768)
                .height(480)
                .brushOn(true)
                .yAxisLabel("This is the Y Axis!")
                .dimension(_dx)
                .group(_dx.group())
                .x(d3.scale.linear().domain([min, max]))  
                .transitionDuration(0)
                .on('renderlet', function(chart) {
                    chart.selectAll('rect').on("click", function(d) { console.log("click!", d); });
                });
            chart.render();
        }
        else {
        console.log( "better not");
        }

    },
});


