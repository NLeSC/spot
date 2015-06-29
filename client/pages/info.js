var AmpersandModel = require('ampersand-model');
var Collection = require('ampersand-rest-collection');
var View = require('ampersand-view');
var PageView = require('./base');
var templates = require('../templates');
var Widget = require('../views/widget');

var widgetModel = AmpersandModel.extend({
    props: {
        name: 'string',
    }
});

var widgetCollection = Collection.extend({
    model: widgetModel,
    url : 'data/widgets.json',
});

var widgetSelectorItemView = View.extend({
    template: '<button type="button" class="btn btn-default" data-hook="item"></button>',
    bindings: {
        'model.name': {
            type: 'text',
            hook: 'item'
        },
    },
    events: {
        'click [data-hook~=item]':    'handleClick',
    },
    handleClick:  function () {
        var div = document.createElement('div');
        var w = new Widget({el: div});
        this.parent.renderSubview(w, this.parent.queryByHook('widgets'));
    },
});

module.exports = PageView.extend({
    pageTitle: 'more info',
    template: templates.pages.info,

    initialize: function() {
        this.collection = new widgetCollection();
        this.collection.fetch();
    },
    subviews: {},
    render: function() {
        this.renderWithTemplate(this);
        this.renderCollection(this.collection, widgetSelectorItemView, this.queryByHook('widget-selector'));
        return this;
    }
});
