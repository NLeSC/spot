/**
 * Color handling
 *
 * All colors are a chroma.js color. See http://gka.github.io/chroma.js/
 * @module client/colors
 */
var Chroma = require('chroma-js');

var colors = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];

/**
 * Get nth color
 * @param {number} color number
 * @returns {Object} color
 */
module.exports.getColor = function getColor (i) {
  i = parseInt(i);
  if (i < 0 || i >= colors.length) {
    i = colors.length - 1;
  }
  return Chroma(colors[i]);
};

/**
 * Color for unselected groups
 */
module.exports.unselectedColor = Chroma('#aaaaaa');
