var app = require('ampersand-app');
var Router = require('ampersand-router');
var HomePage = require('./pages/home');
var FiltersPage = require('./pages/filters');
var InfoPage = require('./pages/info');
var UHIMapPage = require('./pages/uhimap');


module.exports = Router.extend({
    routes: {
        '': 'home',
        'uhimap': 'uhimap',
        'filters': 'filters',
        'info': 'info',
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

    info: function () {
        app.trigger('page', new InfoPage({
            model: app.me
        }));
    },

    uhimap: function () {
        app.trigger('page', new UHIMapPage({
            model: app.me
        }));
    },

    catchAll: function () {
        this.redirectTo('');
    }
});
