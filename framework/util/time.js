var AmpersandModel = require('ampersand-model');
var AmpersandColllection = require('ampersand-collection');
var moment = require('moment-timezone');

/*
 * Time is grouped by truncating; the resolution is determined in util-time.getResolution()
 * See [this table](http://momentjs.com/docs/#/durations/creating/) for accpetable values
 * when using a crossfilter dataset.
 */
function refineUnits (units) {
  if (units === 'minute' || units === 'minutes') {
    units = 'seconds';
  } else if (units === 'hour' || units === 'hours') {
    units = 'minutes';
  } else if (units === 'day' || units === 'days') {
    units = 'hours';
  } else if (units === 'week' || units === 'weeks') {
    units = 'days';
  } else if (units === 'month' || units === 'months') {
    units = 'days';
  } else if (units === 'year' || units === 'years') {
    units = 'months';
  }
  return units;
}

function getFormat (units) {
  var fmt;
  if (units === 'seconds') {
    fmt = 'mm:ss';
  } else if (units === 'minutes') {
    fmt = 'HH:mm';
  } else if (units === 'hours') {
    fmt = 'HH:00';
  } else if (units === 'days') {
    fmt = 'dddd do';
  } else if (units === 'weeks') {
    fmt = 'wo';
  } else if (units === 'months') {
    fmt = 'YY MMM';
  } else if (units === 'years') {
    fmt = 'YYYY';
  }
  return fmt;
}

function getDatetimeResolution (start, end) {
  var humanized = end.from(start, true).split(' ');
  var units = humanized[humanized.length - 1];
  return refineUnits(units);
}

function getDurationResolution (min, max) {
  var length = moment.duration(max.as('milliseconds') - min.as('milliseconds'), 'milliseconds');
  var humanized = length.humanize().split(' ');

  var units = humanized[humanized.length - 1];
  return refineUnits(units);
}

var TimePart = AmpersandModel.extend({
  props: {
    /**
     * The format string for momentjs
     * @memberof! TimePart
     * @type {string}
     */
    momentFormat: ['string', true],
    /**
     * The format string for postgresql
     * @memberof! TimePart
     * @type {string}
     */
    postgresFormat: ['string', true],
    /**
     * The human readable descprition of the datetime part
     * @memberof! TimePart
     * @type {string}
     */
    description: ['string', true],
    /**
     * Data type after conversion: 'continuous', or 'categorial'
     * @memberof! TimePart
     * @type {string}
     */
    type: ['string', true],
    /**
     * For continuous datetime parts (ie, day-of-year), the minimum value
     * @memberof! TimePart
     * @type {number}
     */
    min: ['number', true, 0],
    /**
     * For continuous datetime parts (ie, day-of-year), the maximum value
     * @memberof! TimePart
     * @type {number}
     */
    max: ['number', true, 1],
    /**
     * When true, calculate the minimum and maximum value from the
     * original datetime limits. Used for continuous datetime parts (ie, year)
     * @memberof! TimePart
     * @type {boolean}
     */
    calculate: ['boolean', true, false],
    /**
     * For categorial datetime parts (Mon, Tue, ..), the array of possible values
     * @memberof! TimePart
     * @type {String[]}
     */
    groups: ['array']
  }
});

var TimeParts = AmpersandColllection.extend({
  model: TimePart,
  indexes: ['description']
});

var timeParts = new TimeParts([
  { description: 'ISO8601', type: 'datetime', calculate: true },
  { postgresFormat: 'month', momentFormat: 'M', description: 'Month (1-12)', type: 'continuous', min: 1, max: 12 },
  { postgresFormat: 'quarter', momentFormat: 'Q', description: 'Quarter (1-4)', type: 'continuous', min: 1, max: 4 },
  { postgresFormat: 'day', momentFormat: 'D', description: 'Day of Month  (1-31)', type: 'continuous', min: 1, max: 31 },
  { postgresFormat: 'doy', momentFormat: 'DDD', description: 'Day of Year (1-365)', type: 'continuous', min: 1, max: 365 },
  { postgresFormat: 'dow', momentFormat: 'd', description: 'Day of Week (0-6)', type: 'continuous', min: 0, max: 6 },
  { postgresFormat: 'isodow', momentFormat: 'E', description: 'Day of Week ISO (1-7)', type: 'continuous', min: 1, max: 7 },
  { postgresFormat: 'week', momentFormat: 'W', description: 'Week of Year ISO  (1-53)', type: 'continuous', min: 1, max: 53 },
  { postgresFormat: 'year', momentFormat: 'Y', description: 'Year', type: 'continuous', calculate: true },
  { postgresFormat: 'hours', momentFormat: 'H', description: 'Hour (0-23)', type: 'continuous', min: 0, max: 23 },
  { postgresFormat: 'minute', momentFormat: 'm', description: 'Minute (0-59)', type: 'continuous', min: 0, max: 59 },
  { postgresFormat: 'second', momentFormat: 's', description: 'Second (0-59)', type: 'continuous', min: 0, max: 59 },
  { postgresFormat: 'milliseconds', momentFormat: 'SSS', description: 'Milliseconds (0-999)', type: 'continuous', min: 0, max: 999 },
  { postgresFormat: 'microseconds', momentFormat: 'SSSSSS', description: 'microseconds (0-999999)', type: 'continuous', min: 0, max: 999999 },
  { postgresFormat: 'epoch', momentFormat: 'X', description: 'Unix Timestamp', type: 'continuous', calculate: true },
  { postgresFormat: 'Mon', momentFormat: 'MMM', description: 'Month (Jan - Dec)', type: 'categorial', groups: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
  { postgresFormat: 'Month', momentFormat: 'MMMM', description: 'Month (January - December)', type: 'categorial', groups: ['January', 'Feburary', 'March', 'April', 'May', 'June', 'July', 'August', 'Septebmer', 'October', 'November', 'December'] },
  { postgresFormat: 'Dy', momentFormat: 'ddd', description: 'Day of Week (Sun-Sat)', type: 'categorial', groups: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
  { postgresFormat: 'Day', momentFormat: 'dddd', description: 'Day of Week (Sunday-Saturday)', type: 'categorial', groups: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
  { postgresFormat: 'AM', momentFormat: 'A', description: 'AM/PM', type: 'categorial', groups: ['AM', 'PM'] }
]);

var DurationUnit = AmpersandModel.extend({
  props: {
    /**
     * The descriptive name of the time unit
     * @memberof! DurationUnit
     * @type {string}
     */
    description: ['string'],
    /**
     * Momentjs parsing format
     * @memberof! DurationUnit
     * @type {string}
     */
    momentFormat: ['string'],
    /**
     * Postgres parsing format
     * @memberof! DurationUnit
     * @type {string}
     */
    postgresFormat: ['string'],
    /**
     * Conversion factor to seconds
     * @memberof! DurationUnit
     * @type {string}
     */
    seconds: ['number']
  }
});

var DurationUnits = AmpersandColllection.extend({
  indexes: ['description'],
  model: DurationUnit
});

var durationUnits = new DurationUnits([
  {
    description: 'ISO8601',
    seconds: 1
  }, {
    description: 'millenium',
    momentFormat: 'millenium',
    postgresFormat: 'millenium',
    seconds: 100 * 365.25 * 24 * 60 * 60
  }, {
    description: 'century',
    momentFormat: 'century',
    postgresFormat: 'century',
    seconds: 100 * 365.25 * 24 * 60 * 60
  }, {
    description: 'decades',
    momentFormat: 'decades',
    postgresFormat: 'decade',
    seconds: 10 * 365.25 * 24 * 60 * 60
  }, {
    description: 'years',
    momentFormat: 'years',
    postgresFormat: 'year',
    seconds: 365.25 * 24 * 60 * 60
  }, {
    description: 'quarters',
    momentFormat: '',
    postgresFormat: 'quarter',
    seconds: 365.25 * 8 * 60 * 60
  }, {
    description: 'months',
    momentFormat: 'months',
    postgresFormat: 'month',
    seconds: 30 * 24 * 60 * 60
  }, {
    description: 'weeks',
    momentFormat: 'weeks',
    postgresFormat: 'week',
    seconds: 7 * 24 * 60 * 60
  }, {
    description: 'days',
    momentFormat: 'days',
    postgresFormat: 'day',
    seconds: 24 * 60 * 60
  }, {
    description: 'hours',
    momentFormat: 'hours',
    postgresFormat: 'hour',
    seconds: 60 * 60
  }, {
    description: 'minutes',
    momentFormat: 'minutes',
    postgresFormat: 'minute',
    seconds: 60
  }, {
    description: 'seconds',
    momentFormat: 'seconds',
    postgresFormat: 'second',
    seconds: 1
  }, {
    description: 'milliseconds',
    momentFormat: 'milliseconds',
    postgresFormat: 'milliseconds',
    seconds: 0.001
  }, {
    description: 'microseconds',
    momentFormat: 'microseconds',
    postgresFormat: 'microseconds',
    seconds: 0.000001
  }
]);

var TimeZone = AmpersandModel.extend({
  props: {
    /**
     * The descriptive name of the time zone
     * @memberof! TimeZone
     * @type {string}
     */
    description: ['string'],
    /**
     * The time zone format
     * @memberof! TimeZone
     * @type {string}
     */
    format: ['string']
  }
});

var TimeZones = AmpersandColllection.extend({
  indexes: ['description'],
  model: TimeZone
});

var timeZones = new TimeZones();
timeZones.add({
  description: 'ISO8601',
  format: 'ISO8601'
});

moment.tz.names().forEach(function (tz) {
  timeZones.add({
    description: tz,
    format: tz
  });
});

module.exports = {
  timeParts: timeParts,
  timeZones: timeZones,
  durationUnits: durationUnits,
  getDatetimeResolution: getDatetimeResolution,
  getDurationResolution: getDurationResolution,
  getFormat: getFormat
};
