var PageView = require('./base');
var templates = require('../templates');
var FilterView = require('../views/filter');

// initialize the needle; we can use it as a global var here because there will be only one instance of a page
var _needle = "";

module.exports = PageView.extend({
    pageTitle: 'Filters',
    template: templates.pages.facets,
    render: function () {
        this.collection.sort();
        this.renderWithTemplate();
        this.renderCollection(this.collection, FilterView, this.queryByHook('filter-list') );

        var select = this.el.querySelector('[data-hook~="filter-selector"]');
        select.value = _needle;
    },
    events: {
        'input [data-hook~=filter-selector]': 'update',
    },
    update: function(options) {

        // read the neelde from the text-input
        var select = this.el.querySelector('[data-hook~="filter-selector"]');
        _needle = select.value;


        // build regexp for searching
        var regexp = new RegExp(_needle,'i'); // case insensitive search


        // search through collection, check both name and description
        this.collection.forEach(function(e) {
            var hay = e.name + e.description;
            e.show = regexp.test(hay.toLowerCase());
        });
    },
});
