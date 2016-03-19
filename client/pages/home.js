var $ = require('jquery');
var PageView = require('./base');
var templates = require('../templates');
var Me = require('./../models/me');
var d3 = require('d3');
var crossfilter = require('crossfilter');
var app = require('ampersand-app');

module.exports = PageView.extend({
    pageTitle: 'home',
    template: templates.pages.home,
    events: {
        'click [data-hook~=session-download]': 'downloadSession',
        'change [data-hook~=session-upload-input]': 'uploadSession',
        'change [data-hook~=json-upload-input]': 'uploadJSON',
    },
    downloadSession: function () {
        var fileLoader = this.queryByHook('session-upload-input');
        console.log(fileLoader);

        var json = JSON.stringify(app.me.toJSON());
        var blob = new Blob([json], {type: "application/json"});
        var url = URL.createObjectURL(blob);

        var a = this.queryByHook('session-download');
        a.download = "session.json";
        a.href = url;

        // FIXME: life cycle of the object url
        // var objectURL = window.URL.createObjectURL(fileObj);
        // window.URL.revokeObjectURL(objectURL);
    },
    uploadSession: function () {
        var fileLoader = this.queryByHook('session-upload-input');
        var uploadedFile = fileLoader.files[0];

        var reader = new FileReader();

        reader.onload = function (evt) {

            var data = JSON.parse(evt.target.result);
            app.me.set(data);

            // FIXME: more subtle approach? and does this free all dimensions and groups?
            delete window.app.crossfilter;

            // Load the actual data, and add it to the crossfilter when ready
            d3.json(app.me.data_url, function (error,json) {
                if (error) {
                    console.warn(error);
                    return;
                }

                // Tag the data with the data_url
                json.forEach(function (d) {
                    d.data_url = app.me.data_url;
                });

                window.app.crossfilter = crossfilter(json);
                console.log("Data loaded");
            });
        };

        reader.onloadend = function (evt) {
            console.log("Done", evt);
        };

        reader.onerror = function (evt) {
            console.log("Error", evt);
        };

        reader.readAsText(uploadedFile);

    },
    uploadJSON: function () {
        var fileLoader = this.queryByHook('json-upload-input');
        var uploadedFile = fileLoader.files[0];

        app.me.data_url = fileLoader.files[0].name; // FIXME: can we get an URI for a local file?

        var reader = new FileReader();

        reader.onload = function (evt) {
            var json = JSON.parse(evt.target.result);

            // Tag the data with the data_url
            json.forEach(function (d) {
                d.data_url = app.me.data_url;
            });

            window.app.crossfilter.add(json);
        };

        reader.onloadend = function (evt) {
            console.log("Done", evt);
        };

        reader.onerror = function (evt) {
            console.log("Error", evt);
        };

        reader.readAsText(uploadedFile);
    },
});
