var Widget = require('./widget');

module.exports = Widget.extend({
    props: {
        _has_secondary: ['boolean', true, true],
        _has_tertiary: ['boolean', true, true],
        selection: {
            type: 'array',
            required: true,
            default: function () {return [];},
        }
    },

    chartjs_config: function () {
        return {
            type:'scatter',
            data: { 
                datasets: [],
            },
            options: {
                responsive: true,
                legend: {
                    display: false,
                },
                scales: {
                    xAxes: [{
                        gridLines: {
                            zeroLineColor: "rgba(0,255,0,1)"
                        },
                    }],
                    yAxes: [{
                        gridLines: {
                            zeroLineColor: "rgba(0,255,0,1)"
                        },
                    }]
                },
                tooltips: {
                    enabled: false,
                },
            }
        };
    },
});
