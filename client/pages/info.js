var PageView = require('./base');
var templates = require('../templates');


module.exports = PageView.extend({
    pageTitle: 'more info',
    template: templates.pages.info,
    initialize: function() {
        console.log( "info: ", this );
    },
});
