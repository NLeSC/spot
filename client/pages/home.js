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
                if (error) return console.warn(error);
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
});
