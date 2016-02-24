var PageView = require('./base');
var templates = require('../templates');

var app = require('ampersand-app');

module.exports = PageView.extend({
    pageTitle: 'datasets',
    template: templates.pages.datasets,

    render: function () {
        this.renderWithTemplate();
    },

});
