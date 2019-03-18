var Spot = require('spot-framework');
var app = require('ampersand-app');
var Router = require('./router');
var MainView = require('./pages/main');
var DatasetsView = require('./pages/datasets');
var domReady = require('domready');
var widgetFactory = require('./widgets/widget-factory');
var viewFactory = require('./widgets/view-factory');
var Collection = require('ampersand-collection');

var SessionModel = require('./pages/datasets/session-model');
var dialogPolyfill = require('dialog-polyfill');

var Help = require('intro.js');
var templates = require('./templates');
var csv = require('csv');
var $ = require('jquery');

require('babel-polyfill');
require('mdl');

var sessionCollection = Collection.extend({
  mainIndex: 'id',
  indexes: ['name'],
  model: SessionModel
});

// attach our app to `window` so we can
// easily access it from the console.
window.app = app;

// Extends our main app singleton
app.extend({
  /**
   * [fullscreenMode description]
   * @type {Boolean}
   */
  fullscreenMode: false,
  /**
   * [demoSession description]
   * @type {Boolean}
   */
  demoSession: false,
  /**
   * [mobileBrowser description]
   * @type {Boolean}
   */
  mobileBrowser: false,
  /**
   * [me description]
   * @type {Spot}
   */
  me: new Spot(),
  /**
   * [widgetFactory description]
   * @type {any}
   */
  widgetFactory: widgetFactory,
  /**
   * [viewFactory description]
   * @type {any}
   */
  viewFactory: viewFactory,
  /**
   * [router description]
   * @type {Router}
   */
  router: new Router(),
  /**
   * [CSVSeparator description]
   * @type {String}
   */
  CSVSeparator: ',',
  /**
   * [CSVHeaders description]
   * @type {Boolean}
   */
  CSVHeaders: true,
  /**
   * [CSVQuote description]
   * @type {String}
   */
  CSVQuote: '"',
  /**
   * [CSVComment description]
   * @type {String}
   */
  CSVComment: '#',

  helper: {enabled: false, instance: new Help()},

  /**
   * [sessions description]
   * @type {any}
   */
  sessions: new sessionCollection(),
  /**
   * This is where it all starts
   */
  init: function () {
    // Create and attach our main view
    this.mainView = new MainView({
      model: this.me,
      el: document.body
    });

    // this kicks off our backbutton tracking (browser history)
    // and will cause the first matching handler in the router
    // to fire.
    this.router.history.start({
      root: '/',
      pushState: true,
      hashChange: true
    });
  },
  /**
   * This is a helper for navigating around the app.
     this gets called by a global click handler that handles
     all the <a> tags in the app.
     it expects a url pathname for example: "/costello/settings"
   * @param  {any} page [description]
   */
  navigate: function (page) {

    // clean all help items before navigating to new page
    app.stopHelp();

    var url = (page.charAt(0) === '/') ? page.slice(1) : page;
    this.router.history.navigate(url, {
      trigger: true
    });
  },
  /**
   * [description]
   * @param  {any} percentage [description]
   */
  progress: function (percentage) {
    var progressBar = document.getElementById('progress-bar');
    progressBar.MaterialProgress.setProgress(percentage);

    progressBar.style.display = 'inherit';
  },
  /**
   * [description]
   * @param  {boolean} status [description]
   */
  busy: function (status) {
    var that = this;
    console.log('Change spinner status:', status);
    var dialog = document.getElementById('main-dialog');
    dialogPolyfill.registerDialog(dialog);

    if ( status.enable === true ){
      dialog.showModal();

      // console.log("HELLO");
      // setTimeout(function(){
      //     console.log("THIS IS");
      //     dialog.showModal();
      // }, 5000);
      // console.log("DOG");

    }
    else {
      dialog.close();
    }

  },
  /**
   * [description]
   * @param  {any} options [description]
   */
  message: function (options) {
    var snackbarContainer = document.getElementById('snack-bar');
    var snackData = { message: options.text };

    // BUGFIX: during app initialization, the snackbar is not always ready yet
    if (!snackbarContainer.MaterialSnackbar) {
      return;
    }

    var progressBar = document.getElementById('progress-bar');
    progressBar.style.display = 'none';

    if (options.type === 'error') {
      console.warn(options.text, options.error);
      snackData.timeout = 10000; // show error for 10 seconds
    } else {
      console.log(options.text);
      snackData.timeout = 2750;
    }
    snackbarContainer.MaterialSnackbar.showSnackbar(snackData);
  },

  /**
   * [description]
   */
  startHelp: function () {

    console.log(app.currentPage.helpTemplate);
    console.log(app.currentPage.helpHints);
    console.log(app.currentPage.helpSteps);
    if ( 
      (!app.currentPage.helpTemplate || app.currentPage.helpTemplate === '') &&
      (!app.currentPage.helpHints || app.currentPage.helpHints() === []) &&
      (!app.currentPage.helpSteps || app.currentPage.helpTemplate === []) 
    ) {
      console.log('No Help item was found for this page! Exiting.')
      return;
    }

    console.log(app.helper.enabled);

    if (app.helper.enabled) {
      console.log('Closing existing help!');
      app.stopHelp();
      return;
    }

    app.helper.enabled = true;

    console.log("app.helper: ", app.helper);

    if (app.currentPage.helpTemplate && app.currentPage.helpTemplate !== '') {
      console.log("Setting intros...");
      app.helper.instance.setOptions({
        steps: [
          {
            intro: window[app.currentPage.helpTemplate]()
          }
        ]
      });
    }

    app.helper.instance.setOptions({
      hints: app.currentPage.helpHints(),
      steps: app.currentPage.helpSteps()
    });

    app.helper.instance.onhintsadded(function() {
        console.log('all hints added');
    });
    app.helper.instance.onhintclick(function(hintElement, item, stepId) {
        console.log('hint clicked', hintElement, item, stepId);
    });
    app.helper.instance.onhintclose(function (stepId) {
        console.log('hint closed', stepId);
    });

    app.helper.instance.addHints();
    app.helper.instance.showHints();
    // app.helper.start();
  },
  stopHelp: function () {
    if (app.helper.enabled) {
      console.log('Closing existing help!');
      // app.helper.instance.helper.exit();
      app.helper.instance.hideHints();
      app.helper.enabled = false;
      return;
    }
  },


  /**
   * [description]
   */
  startWelcome: function () {
    var welcome = Help();
    welcome.setOption('tooltipClass', 'welcome-dialog');
    welcome.setOptions({
      'showStepNumbers': false,
      'showBullets': false,
      'showProgress': false,
      'skipLabel': 'Exit',
      'doneLabel': 'Start demo',
      'tooltipPosition': 'auto',
      steps: [
        {
          intro: templates.help.welcome()
        }
      ]
    });

    welcome.onchange(function (targetElement) {
      if (this._currentStep === this._introItems.length - 1) {
        $('.introjs-skipbutton').css('color', 'green');
      }
    });

    welcome.oncomplete(function () {
      window.localStorage.setItem('spotWelcome', 'done');
      app.message({
        text: 'Starting the demo session.',
        type: 'ok'
      });
      app.importRemoteSession('https://raw.githubusercontent.com/NLeSC/spot/master/dist/demo.json');
    });

    // add a flag when we exit
    welcome.onexit(function () {
      window.localStorage.setItem('spotWelcome', 'done');
    });

    var spotWelcome = window.localStorage.getItem('spotWelcome') === 'done';
    if (spotWelcome) {
      // console.log('No need to show welcome dialog again.');
    } else {
      console.log('Starting the welcome dialog.');
      welcome.start();
    }
  },
  /**
   * [description]
   * @return {boolean} [description]
   */
  detectMobile: function () {
    var check = false;
    if (navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i)
   ) {
      check = true;
    } else {
      check = false;
    }
    app.mobileBrowser = check;
    return check;
  },

  /**
   * [description]
   * @return {} [description]
   */
  addDatasetToLocalStorage: function(dataset) {
    console.log('Adding a dataset to the local storage');
    console.log(dataset);
    var allDatasets = this.getDatasetsFromLocalStorage();
    // allDatasets.forEach(function(dset, index) {
    //   console.log("[" + index + "]: " + dset.id + '  ', dset.name);
    // });
    allDatasets.push(dataset);
    localStorage.setItem('datasets', JSON.stringify(allDatasets));
  },
    /**
   * [description]
   * @return {} [description]
   */
  removeDatasetFromLocalStorage: function(dataset) {
    console.log('Removing a dataset from the local storage');
    console.log(dataset);
    var allDatasets = this.getDatasetsFromLocalStorage();
    allDatasets.forEach(function(dset, index) {
      console.log("[" + index + "]: " + dset.id + '  ', dset.name);
      if ( dataset.id === dset.id ) 
        allDatasets.splice(index, 1);
    });
    // var index = allDatasets.indexOf(dataset);
    // if (index > -1) {
    //   allDatasets.splice(index, 1);
    // }
    localStorage.setItem('datasets', allDatasets);
  },
    /**
   * [description]
   * @return {} [description]
   */
  getDatasetsFromLocalStorage: function() {
    console.log('Getting a list of datasets from the local storage');
    var allDatasets = JSON.parse(localStorage.getItem('datasets') || "[]");
    return allDatasets;
  },
  /**
   * [description]
   * @return {} [description]
   */
  addSessionToLocalStorage: function(session) {
    console.log('Adding a session to the local storage');
    console.log(session);
    var allSessions = this.getSessionsFromLocalStorage();
    // allDatasets.forEach(function(dset, index) {
    //   console.log("[" + index + "]: " + dset.id + '  ', dset.name);
    // });
    allSessions.push(session);
    localStorage.setItem('sessions', JSON.stringify(allSessions));
  },
    /**
   * [description]
   * @return {} [description]
   */
  removeSessionFromLocalStorage: function(input_session) {
    console.log('Removing a session from the local storage');
    console.log(input_session);
    var allSessions = this.getSessionsFromLocalStorage();
    allSessions.forEach(function(sess, index) {
      console.log("[" + index + "]: " + sess.id + '  ', sess.name);
      if ( input_session.id === sess.id ) 
        allSessions.splice(index, 1);
    });

    localStorage.setItem('sessions', allSessions);
  },
    /**
   * [description]
   * @return {} [description]
   */
  getSessionsFromLocalStorage: function() {
    console.log('Getting a list of sessions from the local storage');
    var allSessions = JSON.parse(localStorage.getItem('sessions') || "[]");
    return allSessions;
  },
  getCurrentSession: function () {
    var json = app.me.toJSON();
    // if (app.me.sessionType === 'client') {
    //   // for client datasets, also save the data in the session file
    //   app.me.datasets.forEach(function (dataset, i) {
    //     json.datasets[i].data = dataset.data;
    //   });
    // }
    // json.saveDate = Date().toLocaleString();
    var currentSession = json;
    return currentSession;
  },
  saveCurrentSession: function () {
    var currentSession = this.getCurrentSession();
    this.addSessionToLocalStorage(currentSession);
  },


  /**
   * [description]
   * @param  {any} sessionUrl [description]
   */
  
  importRemoteSession: function (sessionUrl) {
    console.log('app.js: Getting the remote session.');
    var that = this;


    var urlParts = sessionUrl.replace('http://','').replace('https://','').split(/[/?#]/);
    var domain = urlParts[0];

    // console.log(this.mainView);
    // console.log(DatasetsView);
    // console.log('domain:',domain);
    // console.log('urlParts:',urlParts);

    if ( (domain === "sandbox.zenodo.org") || (domain === "zenodo.org") ) {
      // console.log('The link is from Zenodo!');
      // get files using a proxy to fix CORS issues
      sessionUrl = 'http://localhost:8000/' + sessionUrl;
      // that.downloadSessionZenodo(sessionUrl);
      // return;
    }


    var request = new window.XMLHttpRequest();

    request.addEventListener('progress', updateProgress);
    request.addEventListener('load', transferComplete);
    request.addEventListener('error', transferFailed);
    request.addEventListener('abort', transferCanceled);

    request.open('GET', sessionUrl, true);
    request.responseType = 'json';

    // request.setRequestHeader('Access-Control-Allow-Headers', '*');

    function updateProgress (evt) {
      if (evt.lengthComputable) {
        var percentComplete = evt.loaded / evt.total;
        console.log('progress:', percentComplete);
        app.message({
          text: 'Progress: ' + percentComplete,
          type: 'ok'
        });
      }
    }

    function transferComplete (evt) {
      console.log('The transfer is complete.');
      app.message({
        text: 'Remote session was downloaded succesfully.',
        type: 'ok'
      });
      app.loadSessionBlob(request.response);
    }

    function transferFailed (evt) {
      console.log('An error occurred while transferring the file.');
      app.message({
        text: 'Remote session download problem.',
        type: 'error'
      });
    }

    function transferCanceled (evt) {
      console.log('The transfer has been canceled by the user.');
    }

    request.send();




    // fetch(sessionUrl,{
    //   mode: "no-cors",
    //   // headers: {
    //   //   "Content-Type": "application/json",
    //   //   "Access-Control-Allow-Origin":  "http://0.0.0.0:1923",
    //   //   "Access-Control-Allow-Methods": "POST",
    //   //   "Access-Control-Allow-Headers": "Content-Type, Authorization",
    //   // }
    // })
    // .then(function (res){
    //   console.log('res:', res);
    //   return res.json();
    // }).then(function(out) {
    //   console.log('out:', out);
    //   app.loadSessionBlob(out);
    // }).catch(function(err) {
    //   console.log('err:', err);
    //   throw err;
    // });




    // fetch(sessionUrl, {
    //   mode: "no-cors",
    //     headers: {
    //       "Content-Type": "application/json",
    //       // "Access-Control-Allow-Origin": "*",
    //       // "Access-Control-Allow-Methods": "DELETE, POST, GET, OPTIONS",
    //       // "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
    //     }
    //   })
    // .then(function(response) {
    //   if (response.status >= 400) {
    //     throw new Error("Bad response from server");
    //   }
    //   console.log(response);
    //   return response.json();
    // })
    // .then(function(stories) {
    //   console.log(stories);
    // });



  },

//   getRemoteJSON: function (url) {
//     fetch(url, {
//       mode: 'no-cors',
//       headers: {
//         "Content-Type": "application/json",
//       }
//     })
//     .then(function (response) {
//         if (!response.ok) {
//             console.log(response);
//             throw new Error("HTTP error " + response.status);
//         }
//         return response.json();
//     })
//     .then(function (json) {
//         this.users = json;
//         console.log(this.users);
//     })
//     .catch(function (err) {
//       console.log(err);
//         this.dataError = true;
//     })
//  },


  /**
   * [description]
   * @param  {any} data [description]
   */
  loadSessionBlob: function (data) {
    console.log('Loading the session.');
    app.me = new Spot(data);

    if (data.sessionType === 'server') {
      app.me.connectToServer(data.address);
    } else if (data.sessionType === 'client') {
      // add data from the session file to the dataset
      data.datasets.forEach(function (d, i) {
        app.me.datasets.models[i].crossfilter.add(d.data);
        app.me.datasets.models[i].isActive = false; // we'll turn it on later
      });
      // merge all the data into the app.me.dataview
      // by toggling the active datasets back on
      data.datasets.forEach(function (d, i) {
        if (d.isActive) {
          app.me.toggleDataset(app.me.datasets.models[i]);
        }
      });
    }
    // and automatically go to the analyze page
    app.navigate('/analyze');
  },


  ////////////////////////////////////
  importJSON: function () {
    // var fileLoader = this.queryByHook('json-upload-input');
    var fileLoader = document.getElementById('jsonuploadBtn');
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
    // var fileLoader = this.queryByHook('csv-upload-input');
    var fileLoader = document.getElementById('csvuploadBtn');
    var uploadedFile = fileLoader.files[0];
    var reader = new window.FileReader();
    var dataURL = fileLoader.files[0].name;

    // TODO: enforce spot.driver === 'client'

    var dataset = app.me.datasets.add({
      name: dataURL,
      URL: dataURL,
      description: 'Imported CSV file'
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
  importLocalSession: function () {
    // var fileLoader = this.queryByHook('session-upload-input');
    var fileLoader = document.getElementById('sessionuploadBtn');    
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
  },

  // uploadSessionZenodo: function () {

  //   var that = this;

  //   var json = app.me.toJSON();
  //   if (app.me.sessionType === 'client') {
  //     app.me.datasets.forEach(function (dataset, i) {
  //       json.datasets[i].data = dataset.data;
  //     });
  //   }

  //   var sessionData = new window.Blob([JSON.stringify(json)], {type: 'application/json'});
  //   var shareLink = this.queryByHook('session-upload-cloud-link');
  //   var shareDirectLink = this.queryByHook('session-upload-cloud-link-direct');

  //   var fileformData = new FormData();
  //   var zenodo_id = null;

  //   fileformData.append("file", sessionData, "sessionfile.json");

  //   var metadata =  {
  //     metadata: {
  //       'title': 'SPOT Session',
  //       'upload_type': 'dataset',
  //       'creators': [{'name': 'Faruk, Diblen',
  //       'affiliation': 'NLeSC'}]
  //     }
  //   };
    
  //   console.log("Creating a DOI");
  //   that.zenodoRequest({
  //     url_addition:"",
  //     requestType:"doi",
  //     bodyData:{}
  //   }).then(function(doi_data) {

  //     console.log("doi_data: ", doi_data);
  //     zenodo_id = doi_data.id;
  //     console.log("Zenodo id:", zenodo_id);

  //     console.log("Uploading file");
  //     that.zenodoRequest({
  //       url_addition:zenodo_id + "/files", 
  //       requestType:"upload", 
  //       bodyData:fileformData
  //     }).then(function(upload_data) {
      
  //       console.log("upload_data: ", upload_data);
  //       console.log("direct link: ", upload_data.links.download);

  //       metadata.metadata = {
  //         ...metadata.metadata,
  //         'description': '<p><a href="' + process.env.PROTOCOL + '://' + process.env.BASE_URL + ":" + process.env.PORT + '/#session=' + upload_data.links.download + '">Open with SPOT</a></p>'
  //       }
  //       console.log('<p><a href="' + process.env.PROTOCOL + '://' + process.env.BASE_URL + ":" + process.env.PORT + '/#session=' + upload_data.links.download + '">Open with SPOT</a></p>');

  //       console.log("Setting the metadata");
  //       that.zenodoRequest({
  //         url_addition: zenodo_id,
  //         requestType: "meta",
  //         bodyData: metadata
  //       }).then(function(metadata_data) {

  //         console.log("metadata_data: ", metadata_data);

  //         console.log("Publishing...");
  //         that.zenodoRequest({
  //           url_addition: zenodo_id + "/actions/publish", 
  //           requestType: "publish", 
  //           bodyData: {}
  //         }).then(function(publish_data) {
  
  //           console.log("publish_data: ", publish_data);
  //           console.log("links: ", publish_data.links.record_html);
  //           shareLink.value = publish_data.links.record_html;
  //           shareDirectLink.value = process.env.PROTOCOL + '://' + process.env.BASE_URL + ":" + process.env.PORT + '/#session=' + upload_data.links.download;
  //           that.showCloudUploadInfo();
  //         }).catch(function(error_publish){
  //           console.error(error_publish);
  //         });

  //       }).catch(function(error_metadata){
  //         console.error(error_metadata);
  //       });

  //     }).catch(function(error_upload){
  //       console.error(error_upload);
  //     });

  //   }).catch(function(error_doi){
  //     console.error(error_doi);
  //   }); 

  // },

  downloadSessionZenodo: function (sessionUrl) {
    var that = this;
    console.log('downloadSessionZenodo:: downloading a session from Zenodo.');

    // // var sessionData = new window.Blob([JSON.stringify(json)], {type: 'application/json'});
    // // https://zenodo.org/api/deposit/depositions/1234/files/12345678-9abc-def1-2345-6789abcdef12
    // // base --> https://sandbox.zenodo.org/api/deposit/depositions

    // // https://sandbox.zenodo.org/record/263732/files/sessionfile.json
    // that.zenodoRequest({
    //   base_url: sessionUrl,
    //   url_addition:"", 
    //   requestType:"download", 
    //   zenodoId: '',
    //   fileHash: ''
    // }).then(function(download_data) {

    //   console.log(download_data);
    //   that.loadSessionBlob(download_data);
    //   // that.importRemoteSession(download_data.links.download);

    // }).catch(function(error_download){
    //   console.error(error_download);
    // }); 









    var data = null;

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        console.log(this.responseText);
      }
    });
    
    xhr.open("GET", "https://sandbox.zenodo.org/record/263732/files/sessionfile.json?access_token=Fgr58GxjodIhSQIYX1XwIMvZoJauh26DrJ2OErbjx9KUrYP1JfwUywxEowUF");
    xhr.setRequestHeader("cache-control", "no-cache");
    // xhr.setRequestHeader("Postman-Token", "d656bb0c-be89-4775-ad90-91ca46d0bc57");
    
    xhr.send(data);



    var settings = {
      "async": true,
      "crossDomain": true,
      "url": "https://sandbox.zenodo.org/record/263732/files/sessionfile.json?access_token=Fgr58GxjodIhSQIYX1XwIMvZoJauh26DrJ2OErbjx9KUrYP1JfwUywxEowUF",
      "method": "GET",
      "headers": {
        "cache-control": "no-cache",
        "Postman-Token": "58d552db-19fb-4b5c-aee6-e57e5f7a8275"
      }
    }
    
    $.ajax(settings).done(function (response) {
      console.log(response);
    });



  },

  zenodoRequest: async function(zenodoParams) {

    var url_addition = zenodoParams.url_addition;
    var requestType = zenodoParams.requestType;
    var bodyData = zenodoParams.bodyData;
    console.log('requestType:', requestType);

    var base_url = new URL("https://sandbox.zenodo.org/api/deposit/depositions");

    if (zenodoParams.base_url){
      base_url = zenodoParams.base_url;
    }

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
        withCredentials: true,
        // headers: {
        //   "Content-Type": "application/json"
        // },
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



});

/**
 * run it on domReady
 */
domReady(function () {
  app.init();

  if ( process.env.MODE === 'server' ) {
    console.log('connecting to database at', process.env.DB_SERVER + ":" + process.env.DB_SERVER_PORT);
    app.me.isLockedDown = true;
    app.me.connectToServer(process.env.DB_SERVER + ":" + process.env.DB_SERVER_PORT);
    app.me.socket.emit('getDatasets');
  }
});

