var Spot = require('spot-framework');
var PageView = require('./base');
var templates = require('../templates');
var app = require('ampersand-app');
var csv = require('csv');
var $ = require('jquery');

var SessionModel = require('./datasets/session-model');
const dialogPolyfill = require('dialog-polyfill');

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

      console.log("[" + index + "]: " + sessMod.id + '  ', sessMod.date);
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
    'change [data-hook~=session-upload-input]': 'importSession',
    'click [data-hook~=data-download]': 'exportData',

    'click [data-hook~=session-download-cloud-close-button]': 'closeCloudDownloadInfo',
    'click [data-hook~=session-download-cloud-get]': 'importRemoteSession',
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
  importJSON: function () {
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
  importCSV: function () {
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
        comment: app.CSVComment, // Treat all the characters after this one as a comment.
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
          app.addDatasetToLocalStorage(dataset);
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

  uploadSessionZenodo: function () {

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
    
    console.log("Creating a DOI");
    that.zenodoRequest({
      url_addition:"",
      requestType:"doi",
      bodyData:{}
    }).then(function(doi_data) {

      console.log("doi_data: ", doi_data);
      zenodo_id = doi_data.id;
      console.log("Zenodo id:", zenodo_id);

      console.log("Uploading file");
      that.zenodoRequest({
        url_addition:zenodo_id + "/files", 
        requestType:"upload", 
        bodyData:fileformData
      }).then(function(upload_data) {
      
        console.log("upload_data: ", upload_data);
        console.log("direct link: ", upload_data.links.download);

        metadata.metadata = {
          ...metadata.metadata,
          'description': '<p><a href="' + process.env.PROTOCOL + '://' + process.env.BASE_URL + ":" + process.env.PORT + '/#session=' + upload_data.links.download + '">Open with SPOT</a></p>'
        }
        console.log('<p><a href="' + process.env.PROTOCOL + '://' + process.env.BASE_URL + ":" + process.env.PORT + '/#session=' + upload_data.links.download + '">Open with SPOT</a></p>');

        console.log("Setting the metadata");
        that.zenodoRequest({
          url_addition: zenodo_id,
          requestType: "meta",
          bodyData: metadata
        }).then(function(metadata_data) {

          console.log("metadata_data: ", metadata_data);

          console.log("Publishing...");
          that.zenodoRequest({
            url_addition: zenodo_id + "/actions/publish", 
            requestType: "publish", 
            bodyData: {}
          }).then(function(publish_data) {
  
            console.log("publish_data: ", publish_data);
            console.log("links: ", publish_data.links.record_html);
            shareLink.value = publish_data.links.record_html;
            shareDirectLink.value = process.env.PROTOCOL + '://' + process.env.BASE_URL + ":" + process.env.PORT + '/#session=' + upload_data.links.download;
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

  downloadSessionZenodo: function (sessionUrl) {

    var that = this;

    // var sessionData = new window.Blob([JSON.stringify(json)], {type: 'application/json'});

    that.zenodoRequest({
      url_addition:"", 
      requestType:"download", 
      bodyData:{},
      zenodoId: '',
      fileHash: ''
    }).then(function(download_data) {

      console.log(download_data);

    }).catch(function(error_download){
      console.error(error_download);
    }); 

  },



  zenodoRequest: async function(zenodoParams) {

    var url_addition = zenodoParams.url_addition;
    var requestType = zenodoParams.requestType;
    var bodyData = zenodoParams.bodyData;
    console.log('requestType:', requestType);

    var base_url = new URL("https://sandbox.zenodo.org/api/deposit/depositions");
    var zenodoToken = process.env.ZENODO_TOKEN;
    if (url_addition) {
      console.log(" Addition is provided: ", url_addition);
      base_url = base_url + "/" + url_addition;
    }
    var url = new URL(base_url),
    params = {
      access_token: zenodoToken
    };
    Object.keys(params).forEach(function(key){
      url.searchParams.append(key, params[key]);
    });

    console.log('Zenodo base_url:', base_url);
    console.log('Zenodo url:', url);

    var request_options = {};

    if (requestType === "doi") {
      request_options = {
        cache: "no-cache",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData)
      }
    }
    else if (requestType === "upload") {
      request_options = {
        cache: "no-cache",
        method: "POST",
        body: bodyData
      }
    }
    else if (requestType === "publish") {
      request_options = {
        cache: "no-cache",
        method: "POST",
      }
    }    
    else if (requestType === "meta") {
      request_options = {
        cache: "no-cache",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyData)
      }
    }
    else if (requestType === "download") {
      request_options = {
        cache: "no-cache",
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        body: bodyData
      }
    }
    else {
      console.error('Unknown method');
    }

    console.log('request_options: ', request_options);

    var response = await fetch(url, request_options);
    var data = await response.json();
    return data;
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
  importRemoteSession: function () {
    var sessionUrl = this.queryByHook('session-download-cloud-link').value;

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
    var json = app.me.toJSON();

    if (app.me.sessionType === 'client') {
      // for client datasets, also save the data in the session file
      app.me.datasets.forEach(function (dataset, i) {
        json.datasets[i].data = dataset.data;
      });
    }
    var blob = new window.Blob([JSON.stringify(json)], {type: 'application/json'});
    var url = window.URL.createObjectURL(blob);

    var element = document.createElement('a');
    element.download = 'session.json';
    element.href = url;
    element.click();

    window.URL.revokeObjectURL(url);
  },
  exportData: function () {
    var chartsData = [];

    var partitionRankToName = {1: 'a', 2: 'b', 3: 'c', 4: 'd'};
    var aggregateRankToName = {1: 'aa', 2: 'bb', 3: 'cc', 4: 'dd', 5: 'ee'};

    app.me.dataview.filters.forEach(function (filter) {
      var map = {};
      var axis = [];
      filter.partitions.forEach(function (partition) {
        map[partitionRankToName[partition.rank]] = partition.facetName;
        axis.push(partition.facetName);
      });
      filter.aggregates.forEach(function (aggregate) {
        map[aggregateRankToName[aggregate.rank]] = aggregate.operation + ' ' + aggregate.facetName;
      });
      map['count'] = 'count';

      var data = [];
      filter.data.forEach(function (d) {
        var mapped = {};
        Object.keys(d).forEach(function (k) {
          if (map[k]) {
            mapped[map[k]] = d[k];
          }
        });
        data.push(mapped);
      });
      chartsData.push({
        chartType: filter.chartType,
        axis: axis.join(','),
        data: data
      });
    });

    var blob = new window.Blob([JSON.stringify(chartsData)], {type: 'application/json'});
    var url = window.URL.createObjectURL(blob);

    var element = document.createElement('a');
    element.download = 'data.json';
    element.href = url;
    element.click();

    window.URL.revokeObjectURL(url);
  },
  importSession: function () {
    var fileLoader = this.queryByHook('session-upload-input');
    var uploadedFile = fileLoader.files[0];
    var reader = new window.FileReader();

    reader.onload = function (ev) {
      var data = JSON.parse(ev.target.result);
      app.loadSessionBlob(data);
      app.message({
        text: 'Session "' + uploadedFile.name + '" was uploaded succesfully',
        type: 'ok'
      });
    };

    reader.onerror = function (ev) {
      app.message({
        text: 'Could not load Session "' + uploadedFile.name + '"',
        type: 'error',
        error: ev
      });
    };

    reader.readAsText(uploadedFile);
  }


});
