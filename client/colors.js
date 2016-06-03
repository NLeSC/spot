var chroma = require('chroma-js');

var colors = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];

function getColor (i) {
  i = parseInt(i);
  if (i < 0 || i >= colors.length) {
    return chroma('#ffed6f');
  }

  return chroma(colors[i]);
}

module.exports = {
  get: getColor
};
