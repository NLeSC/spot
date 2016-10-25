var AmpersandView = require('ampersand-view');
var misval = require('../../../framework/util/misval.js');

// NOTE: sigma and sigma plugins do not work properly with require()
// workaround via browserify-shim (configured in package.json)
var Sigma = require('sigmajs');
require('sigmajs.layout.forceAtlas2');

function deinitChart (view) {
  if (view._sigma) {
    view._sigma.stopForceAtlas2();
    view._sigma.kill();
    delete view._sigma;
  }
  delete view._config;
}

function drawEdges (view, nodes) {
  var filter = view.model.filter;
  var sigma = view._sigma;

  // draw new ones
  filter.data.forEach(function (group, id) {
    if (group.a !== misval && group.b !== misval && group.aa !== misval) {
      if (nodes.hasOwnProperty(group.a) && nodes.hasOwnProperty(group.b)) {
        sigma.graph.addEdge({
          id: 'e' + id,
          source: group.a,
          target: group.b
        });
      }
    }
  });
}

function drawNodes (view) {
  var filter = view.model.filter;
  var sigma = view._sigma;

  // a link is between 'src' (partition 1) and 'dst' (partition 2)
  // so add nodes for all possible start and end points
  var nodes = {};

  var src = filter.partitions.get('1', 'rank');
  src.groups.forEach(function (group) {
    if (!nodes.hasOwnProperty(group.label)) {
      nodes[group.label] = true;
      sigma.graph.addNode({
        id: group.label,
        label: group.label,
        size: 1,
        x: Math.random(),
        y: Math.random()
      });
    }
  });

  var dst = filter.partitions.get('2', 'rank');
  dst.groups.forEach(function (group) {
    if (!nodes.hasOwnProperty(group.label)) {
      nodes[group.label] = true;
      sigma.graph.addNode({
        id: group.label,
        label: group.label,
        size: 1,
        x: Math.random(),
        y: Math.random()
      });
    }
  });
  return nodes;
}

function initChart (view) {
  // tear down existing stuff
  deinitChart(view);

  // Configure plot
  view._config = view.model.sigmaConfig();

  // Get a new sigma plot
  view._sigma = new Sigma({
    renderers: [{
      container: view.el
    }],
    settings: view._config
  });

  // In callbacks on the chart we will need the view, so store a reference
  view._sigma._Ampersandview = view;
}

module.exports = AmpersandView.extend({
  template: '<div class="widgetInner sigmajs mdl-card__media"></div>',
  renderContent: function () {
    var filter = this.model.filter;

    // redraw when the model indicates new data is available
    filter.on('newData', function () {
      this.update();
    }, this);

    // render data if available
    if (filter.isConfigured && filter.data) {
      this.update();
    }
  },

  update: function () {
    var filter = this.model.filter;

    if (filter.isConfigured && (!this._sigma)) {
      initChart(this);
    }

    if (filter.isConfigured) {
      this._sigma.stopForceAtlas2();
      this._sigma.graph.clear();
      var nodes = drawNodes(this);
      drawEdges(this, nodes);
      this._sigma.refresh();
      try {
        this._sigma.startForceAtlas2({ worker: true, gravity: 1 });
      } catch (error) {
        console.log(error);
      }
    }
  },

  initChart: function () {
    initChart(this);
  },

  deinitChart: function () {
    deinitChart(this);
  }
});
