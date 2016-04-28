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
            type:'line',
            data: {
                datasets: [],
                labels: []
            },
            options: {
                responsive: true,
                scales: {
                },
                tooltips: {
                },
            }
        };
    },
});
