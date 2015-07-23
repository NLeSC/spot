var PageView = require('./base');
var templates = require('../templates');
var FilterView = require('../views/filter');
var InputView = require('ampersand-input-view');

var _needle;

var filterSelection = function(collection, needle) { 
    var regexp = new RegExp(needle,'i'); // case insensitive

    collection.forEach( function(e) {
        var hay = e.name + e.description;
        e.show = regexp.test(hay.toLowerCase());
    });

    _needle = needle;
};

module.exports = PageView.extend({
    pageTitle: 'Filters',
    template: templates.pages.filters,
    render: function () {
        this.collection.sort();
        this.renderWithTemplate();
        this.renderCollection(this.collection, FilterView, this.queryByHook('filter-list') );
    },
    events: {
        'click [data-hook~=clear]': 'handleClear',
    },
    update: function(options) {filterSelection(this.collection, options.value);},
    subviews: {
        listselector: {
            hook: 'filter-selector',
            constructor: function(options) {
                options.placeholder = "enter keyword";
                options.required = false;
                options.label = "Search for ";
                options.value = _needle;
                return new InputView(options);
            }
        }
    },
    handleClear: function () {
        this.listselector.setValue('');
    },
});
