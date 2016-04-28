var PageView = require('./base');
var templates = require('../templates');
var FacetCollectionView = require('../views/facet-collection');
var Facet = require('../models/facet');
var util = require('../util');

// initialize the needle; we can use it as a global var here because there will be only one instance of a page
var _needle = "";

module.exports = PageView.extend({
    pageTitle: 'Facets',
    template: templates.pages.facets,
    render: function () {
        this.collection.sort();
        this.renderWithTemplate();
        this.renderCollection(this.collection, FacetCollectionView, this.queryByHook('facet-list') );

        var select = this.el.querySelector('[data-hook~="facet-selector"]');
        select.value = _needle;
    },
    events: {
        'input [data-hook~=facet-selector]': 'update',
        'click [data-hook~=fab-button]': 'add',
    },
    update: function(options) {

        // read the neelde from the text-input
        var select = this.el.querySelector('[data-hook~="facet-selector"]');
        _needle = select.value;


        // build regexp for searching
        var regexp = new RegExp(_needle,'i'); // case insensitive search


        // search through collection, check both name and description
        this.collection.forEach(function(e) {
            var hay = e.name + e.description;
            e.show = regexp.test(hay.toLowerCase());
        });
    },
    add: function () {
        if(this.collection.length === 0) {
            util.scanData(this.collection);
        }
        else {
            this.collection.add({name:'_New_Facet_'});
        }
    }
});
