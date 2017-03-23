var BaseWidget = require('./base-widget');
var Vis = require('vis');
var misval = require('../../../framework/util/misval.js');
var colors = require('../../colors');
var util = require('./util');

function deinitChart (view) {
  if (view._graph3d) {
    delete view._graph3d;
  }
}

function initChart (view) {
  // tear down existing stuff
  deinitChart(view);

  var filter = view.model.filter;
  if (!(filter && filter.isConfigured)) {
    return;
  }

  view._config = view.model.vis3dConfig();

  var primary = filter.partitions.get(1, 'rank');
  var secondary = filter.partitions.get(2, 'rank');
  var tertiary = filter.partitions.get(3, 'rank');

  // axes labels
  if (primary.showLabel) {
    view._config.xLabel = primary.label;
  } else {
    view._config.xLabel = '';
  }
  if (secondary.showLabel) {
    view._config.yLabel = secondary.label;
  } else {
    view._config.yLabel = '';
  }
  if (tertiary.showLabel) {
    view._config.zLabel = tertiary.label;
  } else {
    view._config.zLabel = '';
  }

  // set ranges
  view._config.xMin = primary.minval;
  view._config.xMax = primary.maxval;
  view._config.yMin = secondary.minval;
  view._config.yMax = secondary.maxval;
  view._config.zMin = tertiary.minval;
  view._config.zMax = tertiary.maxval;

  // force a square full size plot
  var width = view.el.offsetWidth;
  var height = view.el.offsetHeight;

  view._config.width = width + 'px';
  view._config.height = height + 'px';

  // click callback
  view._config.onclick = function (point) {
    var groupx = primary.groups.models[point.i];
    primary.updateSelection(groupx);

    var groupy = secondary.groups.models[point.j];
    secondary.updateSelection(groupy);

    var groupz = tertiary.groups.models[point.k];
    tertiary.updateSelection(groupz);

    view.model.filter.updateDataFilter();
  };

  // add plot to the DOM
  view._graph3d = new Vis.Graph3d(view.el);
  view._graph3d.setOptions(view._config);
}

function update (view) {
  var filter = view.model.filter;

  if (filter.isConfigured) {
    if (!view._graph3d) {
      initChart(view);
    }
  } else {
    deinitChart(view);
    return;
  }

  // force a square full size plot
  var width = view.el.offsetWidth;
  var height = view.el.offsetHeight;

  view._config.width = width + 'px';
  view._config.height = height + 'px';

  updateScatter(view);
  view._graph3d.redraw();
}

function updateScatter (view) {
  var filter = view.model.filter;

  var primary = filter.partitions.get(1, 'rank');
  var secondary = filter.partitions.get(2, 'rank');
  var tertiary = filter.partitions.get(3, 'rank');

  var valueFn = function (group) {
    if (group.count !== misval) {
      return parseFloat(group.count) || null;
    }
    return null;
  };

  // update the data
  var data = new Vis.DataSet();

  var Fx = primary.filterFunction();
  var Fy = secondary.filterFunction();
  var Fz = tertiary.filterFunction();

  var dotColor = function (group) {
    if (Fx(group.a) && Fy(group.b) && Fz(group.c)) {
      return colors.getColor(0).hex();
    } else {
      return colors.unselectedColor.hex();
    }
  };

  filter.data.forEach(function (group) {
    if (valueFn(group)) {
      var i = util.partitionValueToIndex(primary, group.a);
      var j = util.partitionValueToIndex(secondary, group.b);
      var k = util.partitionValueToIndex(tertiary, group.c);

      if (i === +i && j === +j && k === +k) {
        data.add({
          x: primary.groups.models[i].value,
          y: secondary.groups.models[j].value,
          z: tertiary.groups.models[k].value,
          style: dotColor(group),
          i: i,
          j: j,
          k: k
        });
      }
    }
  });
  view._graph3d.setData(data);
}

module.exports = BaseWidget.extend({
  template: '<div class="widgetInner mdl-card__media"></div>',

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
