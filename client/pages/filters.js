var PageView = require('./base');
var templates = require('../templates');
var FilterView = require('../views/filter');
var InputView = require('ampersand-input-view');

var filterselection = function(collection, needle) { 
    var regexp = new RegExp(needle,'i'); // case insensitive

    collection.forEach( function(e) {
        e.show = regexp.test(e.name + e.description);
    });
};

module.exports = PageView.extend({
    pageTitle: 'Filters',
    template: templates.pages.filters,
    render: function () {
        this.collection.sort();
        this.renderWithTemplate();
        this.renderCollection(this.collection, FilterView, this.queryByHook('filter-list') );
    },
    update: function(options) {filterselection(this.collection, options.value);},
    add: function(options) { console.log(options); },
    subviews: {
        listselector: {
            hook: 'filter-selector',
            constructor: function(options) {
                options.placeholder = "enter keyword";
                options.required = false;
                options.label = "Search for ";
                return new InputView(options);
            }
        }
    },
});
