var app = require('ampersand-app');
var View = require('ampersand-view');
var PageView = require('./base');
var templates = require('../templates');
var Widget = require('../views/widget');

var widgetSelectorItemView = View.extend({
    template: '<button type="button" class="btn btn-default" data-hook="item"></button>',
    bindings: {
        'model.type': {
            type: 'text',
            hook: 'item'
        },
    },
    events: {
        'click [data-hook~=item]':    'handleClick',
    },
    handleClick:  function () {
        var w = new Widget({model: this.model});
        this.parent.renderSubview(w, this.parent.queryByHook('widgets') );
    },
});

module.exports = PageView.extend({
    pageTitle: 'more info',
    template: templates.pages.info,

    initialize: function() {
        this.collection = app.widgets;
    },

    subviews: {},

    render: function() {
        this.renderWithTemplate(this);
        this.renderCollection(app.widgets, widgetSelectorItemView, this.queryByHook('widget-selector'));
        return this;
    }
});
