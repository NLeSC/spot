var app = require('ampersand-app');
var View = require('ampersand-view');
var templates = require('../templates');

var state = true;

module.exports = View.extend({
    template: templates.includes.bookmarks,
    events: {
        'click [data-hook="bookmark-button"]': 'clickButton',
    },
    render: function () {
        this.renderWithTemplate(this);
        if (this.parent.collection == app.me.bookmarked) {
            this.queryByHook('icon').innerText = "bookmark_outline";
        }
        else {
            this.queryByHook('icon').innerText = "bookmark";
        }
    },
    clickButton: function () {

        state = ! state; 

        // delayed import to break circular dependency on first loading
        // there is still a race condition if you would press the bookmark button immediately
        var AnalyzePage = require('../pages/analyze');

        // window.componentHandler.upgradeDom();
        if(state) {
            app.trigger('page', new AnalyzePage({collection: app.me.bookmarked}));
        }
        else {
            app.trigger('page', new AnalyzePage({collection: app.me.widgets}));
        }
    }, 
});

