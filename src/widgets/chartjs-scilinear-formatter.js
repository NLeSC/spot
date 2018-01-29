/**
 * Formatter for tick labels on a linear axis in chartjs
 *
 * Override the default behavious such that it:
 *  * switches to scientific notation for large numbers with a lot of 'trailing zeros': 1e25
 *  * only prints the trailing (least significant) digits when zoomin in: 100000000000.1 prints as '..000.1'
 *
 * see issue #142
 */
module.exports = function (tickValue, index, ticks) {
  // Find the proper tick spacing
  // if we have lots of ticks, don't use the ones
  var delta = Math.abs(ticks.length > 3 ? ticks[2] - ticks[1] : ticks[1] - ticks[0]);

  if (tickValue === 0) {
    return '0';
  }

  // Find the order of magnitude of the least significant digit
  var leastSignificantOOM = Math.floor(Math.log10(delta));

  // Find the order magnitude of the most significant digit
  var logTicks = [];
  ticks.forEach(function (value, i) {
    if (value !== 0) {
      logTicks.push(Math.log10(Math.abs(value)));
    }
  });
  var mostSignificantOOM = Math.floor(Math.max.apply(Math, logTicks));

  // We can chose between 3 different notations for '12.34':
  //   fixed precision:     12.34
  //   scientific notation: 1.234e1
  //   and truncated         ..34
  // find how long each notation would be, and chose the optimal one

  // when using scientific notation (1,2303e2), how many digits would it take?
  var totalNumberOfDigits = mostSignificantOOM + 1 - leastSignificantOOM;

  // when using fixed notation (123.03), how many digits would it take?
  var fixedNotationDitigts = 1 +
    Math.max(0, mostSignificantOOM) +           // digits before '.'
    Math.max(0, Math.abs(leastSignificantOOM)); // digits after '.'

  // when truncating the string to the last 5 digits, it is of course 5 digits

  var tickString = '';
  if (fixedNotationDitigts < 9) {
    var numDecimal = Math.max(Math.min(-1 * leastSignificantOOM, 20), 0); // toFixed has a max of 20 decimal places
    tickString = tickValue.toFixed(numDecimal);
  } else if (totalNumberOfDigits < 9) {
    tickString = tickValue.toExponential(totalNumberOfDigits - 1);
  } else {
    tickString = tickValue.toFixed(Math.max(0, -1 * leastSignificantOOM));
    tickString = '..' + tickString.substring(tickString.length - 5, tickString.length);
  }

  return tickString;
};
