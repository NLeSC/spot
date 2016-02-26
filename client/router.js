var app = require('ampersand-app');
var Router = require('ampersand-router');
var HomePage = require('./pages/home');
var DatasetsPage = require('./pages/datasets');
var FacetsPage = require('./pages/facets');
var FacetsEditPage = require('./pages/facets_edit');
var AnalyzePage = require('./pages/analyze');


module.exports = Router.extend({
    routes: {
        '': 'home',
        'home':    'home',
        'datasets': 'datasets',
        'facets': 'facets',
        'facets/:id': 'facetsEdit',
        'analyze': 'analyze',
        '(*path)': 'catchAll'
    },

    // ------- ROUTE HANDLERS ---------
    home: function () {
        app.trigger('page', new HomePage({
            model: app.me
        }));
    },

    datasets: function () {
        app.trigger('page', new DatasetsPage({
            model: app.me
        }));
    },

    facets: function () {
        app.trigger('page', new FacetsPage({
            model: app.me,
            collection: app.facets
        }));
    },

    facetsEdit: function (id) {
        app.trigger('page', new FacetsEditPage({
            model: app.facets.get(id)
        }));
    },

    analyze: function () {
        app.trigger('page', new AnalyzePage({
            model: app.me,
            collection: app.me.widgets
        }));
    },

    catchAll: function () {
        this.redirectTo('');
    }
});
