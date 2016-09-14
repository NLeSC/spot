var AmpersandModel = require('ampersand-model');
var AmpersandColllection = require('ampersand-collection');
var moment = require('moment-timezone');

var postgresTimeParts = [
  {
    format: 'NONE',
    description: 'No change',
    type: 'datetime'
  },
  {
    format: 'HH12',
    description: 'hour of day (01-12)',
    type: 'continuous',
    min: 1,
    max: 12
  },
  {
    format: 'HH24',
    description: 'hour of day (00-23)',
    type: 'continuous',
    min: 0,
    max: 23
  },
  {
    format: 'MI',
    description: 'minute (00-59)',
    type: 'continuous',
    min: 0,
    max: 59
  },
  {
    format: 'SS',
    description: 'second (00-59)',
    type: 'continuous',
    min: 0,
    max: 59
  },
  {
    format: 'MS',
    description: 'millisecond (000-999)',
    type: 'continuous',
    min: 0,
    max: 999
  },
  {
    format: 'US',
    description: 'microsecond (000000-999999)',
    type: 'continuous',
    min: 0,
    max: 999999
  },
  {
    format: 'SSSS',
    description: 'seconds past midnight (0-86399)',
    type: 'continuous',
    min: 0,
    max: 86399
  },
  {
    // TOOD
    format: 'AM',
    description: 'meridiem indicator',
    type: 'categorial',
    groups: []
  },
  {
    format: 'YYYY',
    description: 'year (4 or more digits)',
    type: 'continuous',
    calculate: true
  },
  {
    format: 'YYY',
    description: 'last 3 digits of year',
    type: 'continuous',
    min: 0,
    max: 999
  },
  {
    format: 'YY',
    description: 'last 2 digits of year',
    type: 'continuous',
    min: 0,
    max: 99
  },
  {
    format: 'Y',
    description: 'last digit of year',
    type: 'continuous',
    min: 0,
    max: 9
  },
  {
    format: 'IYYY',
    description: 'ISO 8601 week-numbering year (4 or more digits)',
    type: 'continuous',
    calculate: true
  },
  {
    format: 'IYY',
    description: 'last 3 digits of ISO 8601 week-numbering year',
    type: 'continuous',
    min: 0,
    max: 999
  },
  {
    format: 'IY',
    description: 'last 2 digits of ISO 8601 week-numbering year',
    type: 'continuous',
    min: 0,
    max: 99
  },
  {
    format: 'I',
    description: 'last digit of ISO 8601 week-numbering year',
    type: 'continuous',
    min: 0,
    max: 9
  },
  {
    format: 'BC',
    description: 'era indicator',
    type: 'categorial',
    groups: ['AD', 'BC']
  },
  {
    format: 'MONTH',
    description: 'full upper case month name (blank-padded to 9 chars)',
    type: 'categorial',
    groups: ['JANUARY  ', 'FEBURARY ', 'MARCH    ', 'APRIL    ', 'MAY      ', 'JUNE     ', 'JULY    ', 'AUGUST  ', 'SEPTEBMER', 'OCTOBER  ', 'NOVEMBER ', 'DECEMBER ']
  },
  {
    format: 'Month',
    description: 'full capitalized month name (blank-padded to 9 chars)',
    type: 'categorial',
    groups: ['January  ', 'Feburary ', 'March    ', 'April    ', 'May      ', 'June     ', 'July    ', 'August  ', 'Septebmer', 'October  ', 'November ', 'December ']
  },
  {
    format: 'month',
    description: 'full lower case month name (blank-padded to 9 chars)',
    type: 'categorial',
    groups: ['january  ', 'feburary ', 'march    ', 'april    ', 'may      ', 'june     ', 'july    ', 'august  ', 'septebmer', 'october  ', 'november ', 'december ']
  },
  {
    format: 'MON',
    description: 'abbreviated upper case month name (3 chars in English, localized lengths vary)',
    type: 'categorial',
    groups: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  },
  {
    format: 'Mon',
    description: 'abbreviated capitalized month name (3 chars in English, localized lengths vary)',
    type: 'categorial',
    groups: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  {
    format: 'mon',
    description: 'abbreviated lower case month name (3 chars in English, localized lengths vary)',
    type: 'categorial',
    groups: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  },
  {
    format: 'MM',
    description: 'number (01-12)',
    type: 'continuous',
    min: 1,
    max: 12
  },
  {
    format: 'DAY',
    description: 'full upper case day name (blank-padded to 9 chars)',
    type: 'categorial',
    groups: ['MONDAY   ', 'TUESDAY  ', 'WEDNESDAY', 'THURSDAY ', 'FRIDAY   ', 'SATURDAY ', 'SUNDAY   ']
  },
  {
    format: 'Day',
    description: 'full capitalized day name (blank-padded to 9 chars)',
    type: 'categorial',
    groups: ['Monday   ', 'Tuesday  ', 'Wednesday', 'Thursday ', 'Friday   ', 'Saturday ', 'Sunday   ']
  },
  {
    format: 'day',
    description: 'full lower case day name (blank-padded to 9 chars)',
    type: 'categorial',
    groups: ['monday   ', 'tuesday  ', 'wednesday', 'thursday ', 'friday   ', 'saturday ', 'sunday   ']
  },
  {
    format: 'DY',
    description: 'abbreviated upper case day name (3 chars in English, localized lengths vary)',
    type: 'categorial',
    groups: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  },
  {
    format: 'Dy',
    description: 'abbreviated capitalized day name (3 chars in English, localized lengths vary)',
    type: 'categorial',
    groups: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  {
    format: 'dy',
    description: 'abbreviated lower case day name (3 chars in English, localized lengths vary)',
    type: 'categorial',
    groups: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  },
  {
    format: 'DDD',
    description: 'day of year (001-366)',
    type: 'continuous',
    min: 1,
    max: 366
  },
  {
    format: 'IDDD',
    description: 'day of ISO 8601 week-numbering year (001-371; day 1 of the year is Monday of the first ISO week)',
    type: 'continuous',
    min: 1,
    max: 371
  },
  {
    format: 'DD',
    description: 'day of month (01-31)',
    type: 'continuous',
    min: 1,
    max: 31
  },
  {
    format: 'D',
    description: 'day of the week, Sunday (1) to Saturday (7)',
    type: 'continuous',
    min: 1,
    max: 7
  },
  {
    format: 'ID',
    description: 'ISO 8601 day of the week, Monday (1) to Sunday (7)',
    type: 'continuous',
    min: 1,
    max: 7
  },
  {
    format: 'W',
    description: 'week of month (1-5) (the first week starts on the first day of the month)',
    type: 'continuous',
    min: 1,
    max: 5
  },
  {
    format: 'WW',
    description: 'week number of year (1-53) (the first week starts on the first day of the year)',
    type: 'continuous',
    min: 1,
    max: 53
  },
  {
    format: 'IW',
    description: 'week number of ISO 8601 week-numbering year (01-53; the first Thursday of the year is in week 1)',
    type: 'continuous',
    min: 1,
    max: 53
  },
  {
    format: 'CC',
    description: 'century (2 digits) (the twenty-first century starts on 2001-01-01)',
    type: 'continuous',
    min: 0,
    max: 99
  },
  {
    format: 'J',
    description: 'Julian Day (days since November 24, 4714 BC at midnight)',
    type: 'continuous',
    calculate: true
  },
  {
    // TODO
    format: 'Q',
    description: 'quarter',
    type: 'continuous'
  },
  {
    format: 'RM',
    description: 'month in upper case Roman numerals (I-XII; I=January)',
    type: 'categorial',
    groups: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  },
  {
    format: 'rm',
    description: 'month in lower case Roman numerals (i-xii; i=January)',
    type: 'categorial',
    groups: ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii']
  }
];

var momentTimeParts = [
  {
    format: 'NONE',
    description: 'No change',
    type: 'datetime'
  },
  {
    format: 'M',
    description: 'Month (1-12)',
    type: 'continuous',
    min: 1,
    max: 12
  },
  {
    format: 'MMM',
    description: 'Month (Jan - Dec)',
    type: 'categorial',
    groups: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  {
    format: 'MMMM',
    description: 'Month (January - December)',
    type: 'categorial',
    groups: ['January', 'Feburary', 'March', 'April', 'May', 'June', 'July', 'August', 'Septebmer', 'October', 'November', 'December']
  },
  {
    format: 'Q',
    description: 'Quarter (1-4)',
    type: 'continuous',
    min: 1,
    max: 4
  },
  {
    format: 'D',
    description: 'Day of Month  (1-31)',
    type: 'continuous',
    min: 1,
    max: 31
  },
  {
    format: 'DDD',
    description: 'Day of Year (1-365)',
    type: 'continuous',
    min: 1,
    max: 365
  },
  {
    format: 'd',
    description: 'Day of Week (0-6)',
    type: 'continuous',
    min: 0,
    max: 6
  },
  {
    format: 'dd',
    description: 'Day of Week (Su-Sa)',
    type: 'categorial',
    groups: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  },
  {
    format: 'ddd',
    description: 'Day of Week (Sun-Sat)',
    type: 'categorial',
    groups: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  },
  {
    format: 'dddd',
    description: 'Day of Week (Sunday-Saturday)',
    type: 'categorial',
    groups: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  {
    format: 'E',
    description: 'Day of Week ISO (1-7)',
    type: 'continuous',
    min: 1,
    max: 7
  },
  {
    format: 'w',
    description: 'Week of Year (1-53)',
    type: 'continuous',
    min: 1,
    max: 53
  },
  {
    format: 'W',
    description: 'Week of Year ISO  (1-53)',
    type: 'continuous',
    min: 1,
    max: 53
  },
  {
    format: 'YY',
    description: 'Year last two digits',
    type: 'continuous',
    min: 0,
    max: 99
  },
  {
    format: 'Y',
    description: 'Year',
    type: 'continuous',
    calculate: true
  },
  {
    format: 'A',
    description: 'AM/PM',
    type: 'categorial',
    groups: ['AM', 'PM']
  },
  {
    format: 'H',
    description: 'Hour (0-23)',
    type: 'continuous',
    min: 0,
    max: 23
  },
  {
    format: 'h',
    description: 'Hour (1-12)',
    type: 'continuous',
    min: 1,
    max: 12
  },
  {
    format: 'm',
    description: 'Minute (0-59)',
    type: 'continuous',
    min: 0,
    max: 59
  },
  {
    format: 's',
    description: 'Second (0-59)',
    type: 'continuous',
    min: 0,
    max: 59
  },
  {
    format: 'SSS',
    description: 'Milliseconds (0-999)',
    type: 'continuous',
    min: 0,
    max: 999
  },
  {
    format: 'SSSSSS',
    description: 'microseconds (0-999999)',
    type: 'continuous',
    min: 0,
    max: 999999
  },
  {
    format: 'X',
    description: 'Unix Timestamp',
    type: 'continuous',
    calculate: true
  }
];

var momentDurationUnits = [
  {
    description: 'years',
    format: 'years'
  },
  {
    description: 'months',
    format: 'months'
  },
  {
    description: 'weeks',
    format: 'weeks'
  },
  {
    description: 'days',
    format: 'days'
  },
  {
    description: 'hours',
    format: 'hours'
  },
  {
    description: 'minutes',
    format: 'minutes'
  },
  {
    description: 'seconds',
    format: 'seconds'
  },
  {
    description: 'milliseconds',
    format: 'milliseconds'
  }];

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

var TimePart = AmpersandModel.extend({
  props: {
    /**
     * The format string
     * @memberof! TimePart
     * @type {string}
     */
    format: ['string', true],
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

var DurationUnit = AmpersandModel.extend({
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

var TimeParts = AmpersandColllection.extend({
  model: TimePart,
  indexes: ['format']
});

var TimeZones = AmpersandColllection.extend({
  model: TimeZone
});

var DurationUnits = AmpersandColllection.extend({
  model: DurationUnit
});

var timeZones = new TimeZones();
timeZones.add({
  description: 'No change',
  format: 'NONE'
});

moment.tz.names().forEach(function (tz) {
  timeZones.add({
    description: tz,
    format: tz
  });
});

module.exports = {
  clientTimeParts: new TimeParts(momentTimeParts),
  serverTimeParts: new TimeParts(postgresTimeParts),
  timeZones: timeZones,
  durationUnits: new DurationUnits(momentDurationUnits)
};
