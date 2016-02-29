var View = require('ampersand-view');
var templates = require('../templates');
var util = require('../util');

var categoryItem = require('../models/categoryitem');
var categoryItemView = require('./categoryitem');

module.exports = View.extend({
    template: templates.includes.categorycollection,
    render: function () {

        this.renderWithTemplate(this);
        console.log(this.queryByHook('category-collection-table'));
        this.renderCollection(this.collection, categoryItemView, this.queryByHook('category-collection-table') );

        return this;
    },
    events: {
        'click [data-hook~=category-rescan-button]': function () {
            var dxcats = util.dxGetCategories(this.collection.parent);
            var categories = [];
            dxcats.forEach( function (d) {
                // NOTE: numbers are parsed: so not {key:'5', 20} but {key:5, value: 20}
                var key_as_string = d.key.toString();

                categories.push({category: key_as_string, count: d.value, group: key_as_string});
            });
            this.collection.reset(categories);
        },

        'click [data-hook~=category-addone-button]': function () {
            this.collection.add(new categoryItem());
        },

        'click [data-hook~=category-removeall-button]': function () {
            this.collection.reset();
        }, 
    }
});
