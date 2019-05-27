var Spot = require('spot-framework');
var BaseWidget = require('./base-widget');
var colors = require('../../colors');
var misval = Spot.util.misval;

// NOTE: sigma and sigma plugins do not work properly with require()
// workaround via browserify-shim (configured in package.json)
var Sigma = require('sigmajs');
require('sigmajsLayoutForceAtlas2');
require('sigmajsRenderersParallelEdges');

function deinitChart (view) {
  if (view._sigma) {
    view._sigma.killForceAtlas2();
    view._sigma.kill();
    delete view._sigma;
  }
  delete view._config;
  view.isInitialized = false;
}

function initChart (view) {
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

  view.isInitialized = true;
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
      // place all new nodes on a circle
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
    if (group.count !== 0 && group.a !== misval && group.b !== misval) {
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

function update (view) {
  if (!view.isInitialized) {
    return;
  }

  // remove graph, but cache the node positions
  view._sigma.killForceAtlas2();
  view._nodes = {};
  view._nnodes = 0;
  view._sigma.graph.nodes().forEach(function (node) {
    view._nodes[node.id] = node;
  });
  view._sigma.graph.clear();

  // redraw graph
  drawGraph(view);
  view._sigma.refresh();

  view._sigma.startForceAtlas2({
    worker: true,
    adjustSizes: true,
    barnesHutOptimize: true,
    edgeWeightInfluence: 1,
    slowDown: 10,
    gravity: 1
  });
}

module.exports = BaseWidget.extend({
  template: '<div class="widgetInner sigmajs mdl-card__media"></div>',

  update: function () {
    update(this);
  },

  initChart: function () {
    initChart(this);
  },

  deinitChart: function () {
    deinitChart(this);
  }
});
