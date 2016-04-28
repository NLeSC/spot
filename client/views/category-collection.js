var View = require('ampersand-view');
var templates = require('../templates');
var utildx = require('../util-crossfilter');

var categoryItem = require('../models/categoryitem');
var categoryItemView = require('./categoryitem');

module.exports = View.extend({
    template: templates.includes.categorycollection,
    render: function () {

        this.renderWithTemplate(this);
        this.renderCollection(this.collection, categoryItemView, this.queryByHook('category-collection-table') );

        return this;
    },
    events: {
        'click [data-hook~=category-rescan-button]': function () {
            this.collection.reset(utildx.getCategories(this.collection.parent));
        },

        'click [data-hook~=category-addone-button]': function () {
            this.collection.add(new categoryItem());
        },

        'click [data-hook~=category-removeall-button]': function () {
            this.collection.reset();
        }, 
    }
});
