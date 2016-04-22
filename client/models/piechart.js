var Widget = require('./widget-crossfilter');

module.exports = Widget.extend({
    props: {
        _has_secondary: ['boolean', false, false],
        _has_tertiary: ['boolean', true, true],
        selection: {
            type: 'array',
            required: true,
            default: function () {return [];},
        }
    },

    chartjs_config: function () {
        return  {
            type:'pie',
            data: {
                datasets: [],
                labels: []
            },
            options: {
                responsive: true,
                tooltips: {
                },
            }
        };
    },
});
