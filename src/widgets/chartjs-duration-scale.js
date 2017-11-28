/* global window: false */
'use strict';
var moment = require('moment-timezone');

function prettyPrintDuration (tick) {
  var parts = [];
  var count;
  var remainder = moment.duration(tick);

  count = Math.floor(remainder.asYears());
  if (count) { if (count === 1) { parts.push('1 year'); } else { parts.push(count.toString() + ' years'); } }
  remainder.subtract(count, 'years');

  count = Math.floor(remainder.asMonths());
  if (count) { if (count === 1) { parts.push('1 month'); } else { parts.push(count.toString() + ' months'); } }
  remainder.subtract(count, 'months');

  count = Math.floor(remainder.asWeeks());
  if (count) { if (count === 1) { parts.push('1 week'); } else { parts.push(count.toString() + ' weeks'); } }
  remainder.subtract(count, 'weeks');

  count = Math.floor(remainder.asDays());
  if (count) { if (count === 1) { parts.push('1 day'); } else { parts.push(count.toString() + ' days'); } }
  remainder.subtract(count, 'days');

  count = Math.floor(remainder.asHours());
  if (count) { if (count === 1) { parts.push('1 hour'); } else { parts.push(count.toString() + ' hours'); } }
  remainder.subtract(count, 'hours');

  count = Math.floor(remainder.asMinutes());
  if (count) { if (count === 1) { parts.push('1 minute'); } else { parts.push(count.toString() + ' minutes'); } }
  remainder.subtract(count, 'minutes');

  count = Math.floor(remainder.asSeconds());
  if (count) { if (count === 1) { parts.push('1 second'); } else { parts.push(count.toString() + ' seconds'); } }
  remainder.subtract(count, 'seconds');

  count = Math.floor(remainder.asMilliseconds());
  if (count) { if (count === 1) { parts.push('1 millisecond'); } else { parts.push(count.toString() + ' milliseconds'); } }
  return parts.join(' ');
}

var time = {
  units: [{
    name: 'millisecond',
    steps: [1, 2, 5, 10, 20, 50, 100, 250, 500]
  }, {
    name: 'second',
    steps: [1, 2, 5, 10, 30]
  }, {
    name: 'minute',
    steps: [1, 2, 5, 10, 30]
  }, {
    name: 'hour',
    steps: [1, 2, 3, 6, 12]
  }, {
    name: 'day',
    steps: [1, 2, 5]
  }, {
    name: 'week',
    maxStep: 4
  }, {
    name: 'month',
    maxStep: 3
//  }, {
//    name: 'quarter',
//    maxStep: 4
  }, {
    name: 'year',
    maxStep: false
  }]
};

var defaultConfig = {
};

module.exports = function (Chart, moment) {
  var helpers = Chart.helpers;
  moment = moment || require('moment');

  var DurationScale = Chart.Scale.extend({
    getLabelMoment: function (datasetIndex, index) {
      if (datasetIndex === null || index === null) {
        return null;
      }

      if (typeof this.labelMoments[datasetIndex] !== 'undefined') {
        return this.labelMoments[datasetIndex][index];
      }

      return null;
    },
    getLabelDiff: function (datasetIndex, index) {
      var me = this;
      if (datasetIndex === null || index === null) {
        return null;
      }

      if (me.labelDiffs === undefined) {
        me.buildLabelDiffs();
      }

      if (typeof me.labelDiffs[datasetIndex] !== 'undefined') {
        return me.labelDiffs[datasetIndex][index];
      }

      return null;
    },
    getMomentStartOf: function (tick) {
      var me = this;
      return moment.duration(Math.floor(tick.as(me.tickUnit)), me.tickUnit);
    },
    determineDataLimits: function () {
      var me = this;
      me.labelMoments = [];

      // Get min max from labels
      var scaleLabelMoments = [];
      if (me.chart.data.labels && me.chart.data.labels.length > 0) {
        me.firstTick = null;
        me.lastTick = null;

        helpers.each(me.chart.data.labels, function (label) {
          var labelMoment = me.parseDuration(label);

          scaleLabelMoments.push(labelMoment);

          if (me.firstTick === null || me.firstTick > labelMoment) {
            me.firstTick = labelMoment;
          }
          if (me.lastTick === null || me.lastTick < labelMoment) {
            me.lastTick = labelMoment;
          }
        }, me);
      } else {
        me.firstTick = moment.duration('PT1S');
        me.lastTick = moment.duration('PT10S');
      }

      // Adjust min max from datasets, and build the labelMoments[dataset][point] array
      helpers.each(me.chart.data.datasets, function (dataset, datasetIndex) {
        var momentsForDataset = [];
        var datasetVisible = me.chart.isDatasetVisible(datasetIndex);

        if (typeof dataset.data[0] === 'object' && dataset.data[0] !== null) {
          helpers.each(dataset.data, function (value) {
            var labelMoment;
            if (me.isHorizontal()) {
              labelMoment = me.parseDuration(value.x);
            } else {
              labelMoment = me.parseDuration(value.y);
            }
            momentsForDataset.push(labelMoment);

            if (datasetVisible) {
              // May have gone outside the scale ranges, make sure we keep the first and last ticks updated
              me.firstTick = me.firstTick > labelMoment ? labelMoment : me.firstTick;
              me.lastTick = me.lastTick < labelMoment ? labelMoment : me.lastTick;
            }
          }, me);
        } else {
          // We have no labels. Use the ones from the scale
          momentsForDataset = scaleLabelMoments;
        }

        me.labelMoments.push(momentsForDataset);
      }, me);

      // We will modify these, so clone for later
      me.firstTick = moment.duration(me.firstTick);
      me.lastTick = moment.duration(me.lastTick);
    },
    buildLabelDiffs: function () {
      var me = this;
      me.labelDiffs = [];
      var scaleLabelDiffs = [];
      // Parse common labels once
      if (me.chart.data.labels && me.chart.data.labels.length > 0) {
        helpers.each(me.chart.data.labels, function (label) {
          var labelMoment = me.parseDuration(label);

          if (moment.isDuration(labelMoment)) {
            scaleLabelDiffs.push(moment.duration(labelMoment).subtract(me.firstTick).as(me.tickUnit));
          }
        }, me);
      }

      helpers.each(me.chart.data.datasets, function (dataset) {
        var diffsForDataset = [];

        if (typeof dataset.data[0] === 'object' && dataset.data[0] !== null) {
          helpers.each(dataset.data, function (value) {
            var labelMoment;
            if (me.isHorizontal()) {
              labelMoment = me.parseDuration(value.x);
            } else {
              labelMoment = me.parseDuration(value.y);
            }

            if (moment.isDuration(labelMoment)) {
              diffsForDataset.push(moment.duration(labelMoment).subtract(me.firstTick).as(me.tickUnit));
            }
          }, me);
        } else {
          // We have no labels. Use common ones
          diffsForDataset = scaleLabelDiffs;
        }
        me.labelDiffs.push(diffsForDataset);
      }, me);
    },
    buildTicks: function () {
      var me = this;

      me.ctx.save();
      var tickFontSize = helpers.getValueOrDefault(me.options.ticks.fontSize, Chart.defaults.global.defaultFontSize);
      var tickFontStyle = helpers.getValueOrDefault(me.options.ticks.fontStyle, Chart.defaults.global.defaultFontStyle);
      var tickFontFamily = helpers.getValueOrDefault(me.options.ticks.fontFamily, Chart.defaults.global.defaultFontFamily);
      var tickLabelFont = helpers.fontString(tickFontSize, tickFontStyle, tickFontFamily);
      me.ctx.font = tickLabelFont;

      me.ticks = [];
      me.unitScale = 1; // How much we scale the unit by, ie 2 means 2x unit per step
      me.scaleSizeInUnits = 0; // How large the scale is in the base unit (seconds, minutes, etc)

      // Determine the smallest needed unit of the time
      var innerWidth = me.isHorizontal() ? me.width - (me.paddingLeft + me.paddingRight) : me.height - (me.paddingTop + me.paddingBottom);

      // Crude approximation of what the label length might be
      var tempFirstLabel = me.tickFormatFunction(me.firstTick, 0, []);
      var tickLabelWidth = me.ctx.measureText(tempFirstLabel).width;
      var cosRotation = Math.cos(helpers.toRadians(me.options.ticks.maxRotation));
      var sinRotation = Math.sin(helpers.toRadians(me.options.ticks.maxRotation));
      tickLabelWidth = (tickLabelWidth * cosRotation) + (tickFontSize * sinRotation);
      var labelCapacity = innerWidth / (tickLabelWidth);

      // Start as small as possible
      me.tickUnit = 'millisecond';
      me.scaleSizeInUnits = moment.duration(me.lastTick).subtract(me.firstTick).as(me.tickUnit);

      var unitDefinitionIndex = 0;
      var unitDefinition = time.units[unitDefinitionIndex];

      // While we aren't ideal and we don't have units left
      while (unitDefinitionIndex < time.units.length) {
        // Can we scale this unit. If `false` we can scale infinitely
        me.unitScale = 1;

        if (helpers.isArray(unitDefinition.steps) && Math.ceil(me.scaleSizeInUnits / labelCapacity) < helpers.max(unitDefinition.steps)) {
          // Use one of the predefined steps
          for (var idx = 0; idx < unitDefinition.steps.length; ++idx) {
            if (unitDefinition.steps[idx] >= Math.ceil(me.scaleSizeInUnits / labelCapacity)) {
              me.unitScale = helpers.getValueOrDefault(me.options.time.unitStepSize, unitDefinition.steps[idx]);
              break;
            }
          }

          break;
        } else if ((unitDefinition.maxStep === false) || (Math.ceil(me.scaleSizeInUnits / labelCapacity) < unitDefinition.maxStep)) {
          // We have a max step. Scale this unit
          me.unitScale = helpers.getValueOrDefault(me.options.time.unitStepSize, Math.ceil(me.scaleSizeInUnits / labelCapacity));
          break;
        } else {
          // Move to the next unit up
          ++unitDefinitionIndex;
          unitDefinition = time.units[unitDefinitionIndex];

          me.tickUnit = unitDefinition.name;
          var leadingUnitBuffer = moment.duration(me.firstTick).subtract(me.getMomentStartOf(me.firstTick)).as(me.tickUnit);
          var trailingUnitBuffer = me.getMomentStartOf(moment.duration(me.lastTick).add(1, me.tickUnit)).subtract(me.lastTick).as(me.tickUnit);
          me.scaleSizeInUnits = moment.duration(me.lastTick).subtract(me.firstTick).as(me.tickUnit) + leadingUnitBuffer + trailingUnitBuffer;
        }
      }

      // Round the first tick
      var roundedStart = me.getMomentStartOf(me.firstTick);

      // Round the last tick
      var roundedEnd = me.getMomentStartOf(me.lastTick);
      var delta = moment.duration(roundedEnd).subtract(me.lastTick).as(me.tickUnit);
      if (delta < 0) {
        // Do not use end of because we need me to be in the next time unit
        me.lastTick = roundedEnd.add(1, me.tickUnit);
      } else if (delta >= 0) {
        me.lastTick = roundedEnd;
      }

      me.scaleSizeInUnits = moment.duration(me.lastTick).subtract(me.firstTick).as(me.tickUnit);

      me.ticks.push(moment.duration(me.firstTick));

      // For every unit in between the first and last moment, create a moment and add it to the ticks tick
      for (var i = 1; i <= me.scaleSizeInUnits; ++i) {
        var newTick = moment.duration(roundedStart).add(i, me.tickUnit);

        if (i % me.unitScale === 0) {
          me.ticks.push(newTick);
        }
      }

      me.ctx.restore();

      // Invalidate label diffs cache
      me.labelDiffs = undefined;
    },
    // Get tooltip label
    getLabelForIndex: function (index, datasetIndex) {
      var me = this;
      var label = me.chart.data.labels && index < me.chart.data.labels.length ? me.chart.data.labels[index] : '';

      if (typeof me.chart.data.datasets[datasetIndex].data[0] === 'object') {
        if (me.isHorizontal()) {
          label = me.chart.data.datasets[datasetIndex].data[index].x;
        } else {
          label = me.chart.data.datasets[datasetIndex].data[index].y;
        }
      }

      return prettyPrintDuration(me.parseDuration(label));
    },
    // Function to format an individual tick mark
    tickFormatFunction: function (tick, index, ticks) {
      return tick.toISOString();
    },
    convertTicksToLabels: function () {
      var me = this;
      me.tickMoments = me.ticks;
      me.ticks = me.ticks.map(me.tickFormatFunction, me);
    },
    getPixelForValue: function (value, index, datasetIndex) {
      var me = this;
      var offset = null;
      if (index !== undefined && datasetIndex !== undefined) {
        offset = me.getLabelDiff(datasetIndex, index);
      }

      if (offset === null) {
        if (!value || !moment.isDuration(value)) {
          // not already a moment object
          value = me.parseDuration(value);
        }
        if (value && moment.isDuration(value)) {
          offset = moment.duration(value).subtract(me.firstTick).as(me.tickUnit);
        }
      }

      if (offset !== null) {
        var decimal = offset !== 0 ? offset / me.scaleSizeInUnits : offset;

        if (me.isHorizontal()) {
          var innerWidth = me.width - (me.paddingLeft + me.paddingRight);
          var valueOffset = (innerWidth * decimal) + me.paddingLeft;

          return me.left + Math.round(valueOffset);
        }
        var innerHeight = me.height - (me.paddingTop + me.paddingBottom);
        var heightOffset = (innerHeight * decimal) + me.paddingTop;

        return me.top + Math.round(heightOffset);
      }
    },
    getPixelForTick: function (index) {
      return this.getPixelForValue(this.tickMoments[index], null, null);
    },
    getValueForPixel: function (pixel) {
      var me = this;
      var innerDimension = me.isHorizontal() ? me.width - (me.paddingLeft + me.paddingRight) : me.height - (me.paddingTop + me.paddingBottom);
      var offset = (pixel - (me.isHorizontal() ? me.left + me.paddingLeft : me.top + me.paddingTop)) / innerDimension;
      offset *= me.scaleSizeInUnits;
      return moment.duration(me.firstTick).add(moment.duration(offset, me.tickUnit).asSeconds(), 'seconds');
    },
    parseDuration: function (label) {
      return moment.duration(label);
    }
  });
  Chart.scaleService.registerScaleType('spot-duration', DurationScale, defaultConfig);
};
