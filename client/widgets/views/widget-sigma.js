var AmpersandView = require('ampersand-view');
var misval = require('../../../framework/util/misval.js');
var colors = require('../../colors');

// NOTE: sigma and sigma plugins do not work properly with require()
// workaround via browserify-shim (configured in package.json)
var Sigma = require('sigmajs');
require('sigmajs.layout.forceAtlas2');
require('sigmajs.renderers.parallelEdges');

function deinitChart (view) {
  if (view._sigma) {
    view._sigma.killForceAtlas2();
    view._sigma.kill();
    delete view._sigma;
  }

  delete view._config;
}

function initChart (view) {
  // tear down existing stuff
  deinitChart(view);

  // Configure plot
  view._config = view.model.sigmaConfig();

  // Get a new sigma plot
  view._sigma = new Sigma({
    renderers: [{
      container: view.el,
      type: 'canvas'
    }],
    settings: view._config
  });

  // In callbacks on the chart we will need the view, so store a reference
  view._sigma._Ampersandview = view;

  // cache for nodes and their positions
  view._nodes = {};

  // number of nodes on screen
  view._nnodes = 0;
}

// test if node exits, and add it if not
function testNode (view, label) {
  var alpha;
  var x;
  var y;

  if (!view._sigma.graph.nodes(label)) {
    // try to get previous postion, or generate new one
    if (view._nodes.hasOwnProperty(label)) {
      x = view._nodes[label].x;
      y = view._nodes[label].y;
    } else {
      alpha = view._nnodes * 2.0 * 3.1415297 / 5.333333;
      x = 10.0 * Math.cos(alpha);
      y = 10.0 * Math.sin(alpha);
    }

    view._sigma.graph.addNode({
      id: label,
      label: label,
      size: 1,
      color: '#666',
      x: x,
      y: y
    });
    view._nnodes++;
  }
}

function drawGraph (view) {
  var filter = view.model.filter;
  var edgeToCount = {};
  var count;
  var type;

  var edgePartition = view.model.filter.partitions.get(3, 'rank');
  if (edgePartition) {
    type = 'curve';
    edgePartition.groups.forEach(function (group, n) {
      edgeToCount[group.value] = n;
    });
  } else {
    count = 0;
    type = 'line';
  }

  // draw new ones
  filter.data.forEach(function (group, id) {
    if (group.aa !== misval && group.aa !== 0 && group.a !== misval && group.b !== misval) {
      testNode(view, group.a);
      testNode(view, group.b);

      if (edgePartition) {
        if (edgeToCount.hasOwnProperty(group.c)) {
          count = edgeToCount[group.c];
        } else {
          return;
        }
      }

      // add edge
      view._sigma.graph.addEdge({
        color: colors.getColor(count).css(),
        id: 'e' + id,
        source: group.a,
        target: group.b,
        count: count,
        type: type
      });
    }
  });
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

    this._sigma.killForceAtlas2();

    // remove graph, but cache the node positions
    this._nodes = {};
    this._nnodes = 0;
    this._sigma.graph.nodes().forEach(function (node) {
      this._nodes[node.id] = node;
    }, this);
    this._sigma.graph.clear();

    drawGraph(this);
    this._sigma.refresh();

    this._sigma.startForceAtlas2({
      worker: true,
      adjustSizes: true,
      barnesHutOptimize: true,
      edgeWeightInfluence: 1,
      slowDown: 10,
      gravity: 1
    });
  },

  initChart: function () {
    initChart(this);
  },

  deinitChart: function () {
    deinitChart(this);
  }
});
