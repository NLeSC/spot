var Spot = require('spot-framework');
var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');
var csv = require('csv');
var $ = require('jquery');

var DatasetCollectionView = require('./datasets/dataset-collection');

module.exports = PageView.extend({
  template: templates.datasets.page,
  initialize: function () {
    this.pageName = 'datasets';
  },
  events: {
    'change [data-hook~=json-upload-input]': 'uploadJSON',
    'change [data-hook~=csv-upload-input]': 'uploadCSV',
    'click [data-hook~=server-connect]': 'connectToServer',

    'input [data-hook~=dataset-selector]': 'input',
    'click [data-hook~=search-button]': 'search',
    'click [data-hook~=clear-button]': 'clear',

    'click [data-hook~=CSV-settings-button]': 'showCSVSettings',
    'click [data-hook~=CSV-settings-close]': 'closeCSVSettings',

    'click #CSV-separator-comma': function () { app.CSVSeparator = ','; },
    'click #CSV-separator-colon': function () { app.CSVSeparator = ':'; },
    'click #CSV-separator-semicolon': function () { app.CSVSeparator = ';'; },
    'click #CSV-separator-pipe': function () { app.CSVSeparator = '|'; },
    'click #CSV-separator-tab': function () { app.CSVSeparator = '\t'; },
    'click #CSV-header-columns': function () { app.CSVHeaders = this.query('#CSV-header-columns').checked; },
    'click #CSV-quote-single': function () { app.CSVQuote = '\''; },
    'click #CSV-quote-double': function () { app.CSVQuote = '"'; },
    'click #CSV-quote-none': function () { app.CSVQuote = null; }
  },
  render: function () {
    // Reset the CSV parsing dialog.
    // NOTE: we could do this via bindings, but this is easier (less code)
    this.renderWithTemplate(this);
    this.query('#CSV-header-columns').checked = app.CSVHeaders;

    if (app.CSVSeparator === ',') {
      this.query('#CSV-separator-comma').checked = true;
    } else if (app.CSVSeparator === ':') {
      this.query('#CSV-separator-colon').checked = true;
    } else if (app.CSVSeparator === ';') {
      this.query('#CSV-separator-semicolon').checked = true;
    } else if (app.CSVSeparator === '|') {
      this.query('#CSV-separator-pipe').checked = true;
    } else if (app.CSVSeparator === '\t') {
      this.query('#CSV-separator-tab').checked = true;
    }

    if (app.CSVQuote === '"') {
      this.query('#CSV-quote-double').checked = true;
    } else if (app.CSVQuote === '\'') {
      this.query('#CSV-quote-single').checked = true;
    } else if (app.CSVQuote === null) {
      this.query('#CSV-quote-none').checked = true;
    }

    // mdl hook ups
    this.once('remove', function () {
      app.me.datasets.off('add');
    });
    app.me.datasets.on('add', function () {
      window.componentHandler.upgradeDom();
    });
  },
  session: {
    needle: 'string',
    showSearch: 'boolean'
  },
  subviews: {
    datasets: {
      hook: 'dataset-items',
      constructor: DatasetCollectionView
    }
  },
  bindings: {
    'model.isLockedDown': {
      type: 'toggle',
      hook: 'add-datasets-div',
      invert: true
    },
    'showSearch': {
      type: 'toggle',
      hook: 'search-bar'
    },
    'needle': {
      type: 'value',
      hook: 'dataset-selector'
    }
  },
  input: function () {
    var select = this.el.querySelector('[data-hook~="dataset-selector"]');
    this.needle = select.value;

    this.update();
  },
  search: function () {
    this.showSearch = !this.showSearch;
    if (this.showSearch) {
      this.queryByHook('dataset-selector').focus();
    }
  },
  clear: function () {
    this.needle = '';
    this.update();
  },
  update: function () {
    // build regexp for searching
    try {
      var regexp = new RegExp(this.needle, 'i'); // case insensitive search

      // search through collection, check both name and description
      this.model.datasets.forEach(function (e) {
        var hay = e.name + e.URL + e.description;
        e.show = regexp.test(hay.toLowerCase());
      });
    } catch (error) {
    }
  },
  uploadJSON: function () {
    var fileLoader = this.queryByHook('json-upload-input');
    var uploadedFile = fileLoader.files[0];
    var reader = new window.FileReader();
    var dataURL = fileLoader.files[0].name;

    // TODO: enforce spot.driver === 'client'

    var dataset = app.me.datasets.add({
      name: dataURL,
      URL: dataURL,
      description: 'uploaded JSON file'
    });

    reader.onload = function (ev) {
      app.message({
        text: 'Processing',
        type: 'ok'
      });
      try {
        dataset.data = JSON.parse(ev.target.result);

        // automatically analyze dataset
        dataset.scan();
        dataset.facets.forEach(function (facet, i) {
          if (i < 20) {
            facet.isActive = true;

            if (facet.isCategorial) {
              facet.setCategories();
            } else if (facet.isContinuous || facet.isDatetime || facet.isDuration) {
              facet.setMinMax();
            }
          }
        });
        app.message({
          text: dataURL + ' was uploaded succesfully. Configured ' + dataset.facets.length + ' facets',
          type: 'ok'
        });
        window.componentHandler.upgradeDom();

        // Automatically activate dataset if it is the only one
        if (app.me.datasets.length === 1) {
          $('.mdl-switch').click(); // only way to get the switch in the 'on' position
        }
      } catch (ev) {
        app.me.datasets.remove(dataset);
        app.message({
          text: 'Error parsing JSON file: ' + ev,
          type: 'error',
          error: ev
        });
      }
    };

    reader.onerror = function (ev) {
      var error = ev.srcElement.error;

      app.message({
        text: 'File loading problem: ' + error,
        type: 'error',
        error: ev
      });
    };

    reader.onprogress = function (ev) {
      if (ev.lengthComputable) {
        // ev.loaded and ev.total are ProgressEvent properties
        app.progress(parseInt(100.0 * ev.loaded / ev.total));
      }
    };

    reader.readAsText(uploadedFile);
  },
  uploadCSV: function () {
    var fileLoader = this.queryByHook('csv-upload-input');
    var uploadedFile = fileLoader.files[0];
    var reader = new window.FileReader();
    var dataURL = fileLoader.files[0].name;

    // TODO: enforce spot.driver === 'client'

    var dataset = app.me.datasets.add({
      name: dataURL,
      URL: dataURL,
      description: 'uploaded CSV file'
    });

    reader.onload = function (ev) {
      app.message({
        text: 'Processing',
        type: 'ok'
      });
      var options = {
        columns: app.CSVHeaders, // treat first line as header with column names
        relax_column_count: false, // accept malformed lines
        delimiter: app.CSVSeparator, // field delimieter
        quote: app.CSVQuote, // String quoting character
        comment: '', // Treat all the characters after this one as a comment.
        trim: true // ignore white space around delimiter
      };

      csv.parse(ev.target.result, options, function (err, data) {
        if (err) {
          app.me.datasets.remove(dataset);
          app.message({
            text: 'Error parsing CSV file: ' + err.message,
            type: 'error',
            error: ev
          });
        } else {
          dataset.data = data;

          // automatically analyze dataset
          dataset.scan();
          dataset.facets.forEach(function (facet, i) {
            if (i < 20) {
              facet.isActive = true;

              if (facet.isCategorial) {
                facet.setCategories();
              } else if (facet.isContinuous || facet.isDatetime || facet.isDuration) {
                facet.setMinMax();
              }
            }
          });
          app.message({
            text: dataURL + ' was uploaded succesfully. Configured ' + dataset.facets.length + ' facets',
            type: 'ok'
          });
          window.componentHandler.upgradeDom();

          // Automatically activate dataset if it is the only one
          if (app.me.datasets.length === 1) {
            $('.mdl-switch').click(); // only way to get the switch in the 'on' position
          }
        }
      });
    };

    reader.onerror = function (ev) {
      app.me.datasets.remove(dataset);
      app.message({
        text: 'File loading problem: ' + reader.error,
        type: 'error',
        error: reader.error
      });
    };

    reader.onprogress = function (ev) {
      if (ev.lengthComputable) {
        // ev.loaded and ev.total are ProgressEvent properties
        app.progress(parseInt(100.0 * ev.loaded / ev.total));
      }
    };

    reader.readAsText(uploadedFile);
  },
  connectToServer: function () {
    app.me = new Spot({
      sessionType: 'server'
    });
    app.message({
      text: 'Connecting to server at ' + window.location.origin,
      type: 'ok'
    });
    app.me.connectToServer();
    app.me.socket.emit('getDatasets');

    app.navigate('home');
    setTimeout(function () {
      app.navigate('datasets');
    }, 100);
  },
  showCSVSettings: function () {
    var dialog = this.queryByHook('CSV-settings');
    dialog.showModal();
  },
  closeCSVSettings: function () {
    var dialog = this.queryByHook('CSV-settings');
    dialog.close();
  }
});
