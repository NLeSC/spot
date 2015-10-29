var app = require('ampersand-app');
var Router = require('ampersand-router');
var HomePage = require('./pages/home');
var FiltersPage = require('./pages/filters');
var InfoPage = require('./pages/analyze');


module.exports = Router.extend({
    routes: {
        '': 'home',
        'filters': 'filters',
        'analyze': 'analyze',
        'person/add': 'personAdd',
        'person/:id': 'personView',
        'person/:id/edit': 'personEdit',
        '(*path)': 'catchAll'
    },

    // ------- ROUTE HANDLERS ---------
    home: function () {
        app.trigger('page', new HomePage({
            model: app.me
        }));
    },

    filters: function () {
        app.trigger('page', new FiltersPage({
            model: app.me,
            collection: app.filters
        }));
    },

    analyze: function () {
        app.trigger('page', new InfoPage({
            model: app.me
        }));
    },

    catchAll: function () {
        this.redirectTo('');
    }
});
