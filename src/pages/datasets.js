var Spot = require('spot-framework');
var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');
var $ = require('jquery');

const dialogPolyfill = require('dialog-polyfill');
var SessionModel = require('./datasets/session-model');

var DatasetCollectionView = require('./datasets/dataset-collection');
var SessionCollectionView = require('./datasets/session-collection');

module.exports = PageView.extend({
  template: templates.datasets.page,
  initialize: function () {
    this.pageName = 'datasets';
    this.helpTemplate = '';


    // // display or hide elements
    // var serverButton = document.getElementById('serverButton-card');
    // console.log(serverButton);
    // if ( process.env.MODE !== 'server' ) {
    //   // serverButton.style.display = 'inherit';
    //   // serverButton.style.display = 'none';
    //   // serverButton.style.display = 'inline';
    // }


    var localStorageDatasets = app.getDatasetsFromLocalStorage();
    localStorageDatasets.forEach(function(dset, index) {
      app.me.datasets.add(dset);
      console.log("[" + index + "]: " + dset.id + '  ', dset.name);
    });

    var localStorageSessions = app.getSessionsFromLocalStorage();
    localStorageSessions.forEach(function(sess, index) {
      const now = new Date();
      var sessMod = new SessionModel({
        id: sess.id,
        name: 'Local session',
        date: now.toLocaleString()
      });
      app.sessions.add(sessMod);
    });

  },
  events: {
    'change [data-hook~=json-upload-input]': 'importJSON',
    'change [data-hook~=csv-upload-input]': 'importCSV',
    'click [data-hook~=server-connect]': 'connectToServer',

    'input [data-hook~=dataset-selector]': 'input',
    'input [data-hook~=CSV-separator-other-input]': 'setOtherSeperator',
    'click [data-hook~=search-button]': 'search',
    'click [data-hook~=clear-button]': 'clear',

    'click [data-hook~=CSV-settings-button]': 'showCSVSettings',
    'click [data-hook~=CSV-settings-close]': 'closeCSVSettings',

    'click [data-hook~=session-cloud-upload]': 'uploadSessionZenodo',
    'click [data-hook~=session-cloud-download]': 'showCloudDownloadInfo',
    'click [data-hook~=session-download]': 'exportSession',
    'change [data-hook~=session-upload-input]': 'importLocalSession',
    'click [data-hook~=data-download]': 'exportData',

    'click [data-hook~=session-download-cloud-close-button]': 'closeCloudDownloadInfo',
    'click [data-hook~=session-download-cloud-get]': 'getRemoteSession',
    'click [data-hook~=session-upload-cloud-close-button]': 'closeCloudUploadInfo',

    'click #CSV-separator-comma': function () { app.CSVSeparator = ','; },
    'click #CSV-separator-colon': function () { app.CSVSeparator = ':'; },
    'click #CSV-separator-semicolon': function () { app.CSVSeparator = ';'; },
    'click #CSV-separator-pipe': function () { app.CSVSeparator = '|'; },
    'click #CSV-separator-tab': function () { app.CSVSeparator = '\t'; },
    'click #CSV-separator-other': function () { this.el.querySelector('[data-hook~="CSV-separator-other-input"]').focus(); },
    'click #CSV-header-columns': function () { app.CSVHeaders = this.query('#CSV-header-columns').checked; },
    'click #CSV-quote-single': function () { app.CSVQuote = '\''; },
    'click #CSV-quote-double': function () { app.CSVQuote = '"'; },
    'click #CSV-quote-none': function () { app.CSVQuote = null; },
    'click #CSV-comment-pound': function () { app.CSVComment = '#'; },
    'click #CSV-comment-exclamation': function () { app.CSVComment = '!'; },
    'click #CSV-comment-slash': function () { app.CSVComment = '/'; },
    'click #CSV-comment-dash': function () { app.CSVComment = '-'; },
    'click #CSV-comment-percent': function () { app.CSVComment = '%'; }
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

    if (app.CSVComment === '#') {
      this.query('#CSV-comment-pound').checked = true;
    } else if (app.CSVComment === '!') {
      this.query('#CSV-comment-exclamation').checked = true;
    } else if (app.CSVComment === '/') {
      this.query('#CSV-comment-slash').checked = true;
    } else if (app.CSVComment === '-') {
      this.query('#CSV-comment-dash').checked = true;
    } else if (app.CSVComment === 'percent') {
      this.query('#CSV-comment-percent').checked = true;
    }

    // mdl hook ups
    this.once('remove', function () {
      app.me.datasets.off('add');
    });
    app.me.datasets.on('add', function () {
      window.componentHandler.upgradeDom();
    });
    app.sessions.on('add', function () {
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
    },
    sessions: {
      hook: 'session-items',
      constructor: SessionCollectionView
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
  setOtherSeperator: function () {
    var select = this.el.querySelector('[data-hook~="CSV-separator-other-input"]');
    app.CSVSeparator = select.value;
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

  connectToServer: function () {
    app.me = new Spot({
      sessionType: 'server'
    });
    app.message({
      text: 'Connecting to server at ' + process.env.DB_SERVER + ":" + process.env.DB_SERVER_PORT,
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
    dialogPolyfill.registerDialog(dialog);
    dialog.showModal();
  },
  closeCSVSettings: function () {
    var dialog = this.queryByHook('CSV-settings');
    dialogPolyfill.registerDialog(dialog);
    dialog.close();
  },
  showCloudUploadInfo: function () {
    var dialog = this.queryByHook('session-upload-cloud');
    dialogPolyfill.registerDialog(dialog);
    dialog.showModal();
  },
  closeCloudUploadInfo: function () {
    var dialog = this.queryByHook('session-upload-cloud');
    dialogPolyfill.registerDialog(dialog);
    dialog.close();
  },

  showCloudDownloadInfo: function () {
    var dialog = this.queryByHook('session-download-cloud');
    dialogPolyfill.registerDialog(dialog);
    dialog.showModal();
  },
  closeCloudDownloadInfo: function () {
    var dialog = this.queryByHook('session-download-cloud');
    dialogPolyfill.registerDialog(dialog);
    dialog.close();
  },

  /////////////////////////////////////////////
  importJSON: function () {
    console.log('called function importJSON');
    app.importJSON();
  },

  importCSV: function () {
    console.log('called function importCSV');
    app.importCSV();
  },

  getRemoteSession: function () {
    console.log('called function getRemoteSession');
    var sessionUrl = this.queryByHook('session-import-remote-link').value;

    // TODO: verify the link
    if (sessionUrl !== '') {
      console.log('Downloading:', sessionUrl);
      this.closeCloudDownloadInfo();

      app.message({
        text: 'Downloading the session. Please wait.',
        type: 'ok'
      });

      app.importRemoteSession(sessionUrl);
    }
  },


  exportSession: function () {
    console.log('called function exportSession');
    app.exportSession();
  },

  exportData: function () {
    console.log('called function exportData');
  },

  importLocalSession: function () {
    console.log('called function importLocalSession');
    app.importLocalSession();
  },
  uploadSessionZenodo: function () {
    console.log('Called datasets.js::uploadSessionZenodo()')
    app.me.socket.emit('uploadZenodo');
  },
  uploadSessionZenodo2: function () {

    var that = this;

    var json = app.me.toJSON();
    if (app.me.sessionType === 'client') {
      app.me.datasets.forEach(function (dataset, i) {
        json.datasets[i].data = dataset.data;
      });
    }

    var sessionData = new window.Blob([JSON.stringify(json)], {type: 'application/json'});
    var shareLink = this.queryByHook('session-upload-cloud-link');
    var shareDirectLink = this.queryByHook('session-upload-cloud-link-direct');

    var fileformData = new FormData();
    var zenodo_id = null;

    fileformData.append("file", sessionData, "sessionfile.json");

    var metadata =  {
      metadata: {
        'title': 'SPOT Session',
        'upload_type': 'dataset',
        'creators': [{'name': 'Faruk, Diblen',
        'affiliation': 'NLeSC'}]
      }
    };

    // console.log("Creating a DOI");
    app.zenodoRequest({
      url_addition:"",
      requestType:"doi",
      bodyData:{}
    }).then(function(doi_data) {

      // console.log("doi_data: ", doi_data);
      zenodo_id = doi_data.id;
      // console.log("Zenodo id:", zenodo_id);

      // console.log("Uploading file");
      app.zenodoRequest({
        url_addition:zenodo_id + "/files",
        requestType:"upload",
        bodyData:fileformData
      }).then(function(upload_data) {

        // console.log("upload_data: ", upload_data);
        // console.log("direct link: ", upload_data.links.download);

        metadata.metadata = {
          ...metadata.metadata,
          'description': '<p><a href="' + process.env.PROTOCOL + '://' + process.env.BASE_URL + ":" + process.env.PORT + '/#session=' + 'https://sandbox.zenodo.org/record/' + zenodo_id + '/files/sessionfile.json' + '">Open with SPOT</a></p>'
        }
        // console.log('<p><a href="' + process.env.PROTOCOL + '://' + process.env.BASE_URL + ":" + process.env.PORT + '/#session=' + 'https://sandbox.zenodo.org/record/' + zenodo_id + '/files/sessionfile.json' + '">Open with SPOT</a></p>');
        // console.log("Setting the metadata");
        app.zenodoRequest({
          url_addition: zenodo_id,
          requestType: "meta",
          bodyData: metadata
        }).then(function(metadata_data) {

          // console.log("metadata_data: ", metadata_data);

          // console.log("Publishing...");
          app.zenodoRequest({
            url_addition: zenodo_id + "/actions/publish",
            requestType: "publish",
            bodyData: {}
          }).then(function(publish_data) {

            // console.log("publish_data: ", publish_data);
            // console.log("links: ", publish_data.links.record_html);
            shareLink.value = publish_data.links.record_html;
            shareDirectLink.value = process.env.PROTOCOL + '://' + process.env.BASE_URL + ":" + process.env.PORT + '/#session=' + 'https://sandbox.zenodo.org/record/' + zenodo_id + '/files/sessionfile.json';
            that.showCloudUploadInfo();
          }).catch(function(error_publish){
            console.error(error_publish);
          });

        }).catch(function(error_metadata){
          console.error(error_metadata);
        });

      }).catch(function(error_upload){
        console.error(error_upload);
      });

    }).catch(function(error_doi){
      console.error(error_doi);
    });

  },



});

