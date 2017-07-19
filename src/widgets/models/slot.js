/**
 * A slot defines how a variable can be added to a plot
 *
 * @class Slot
 * @extends Base
 */
var Base = require('../../../framework/util/base');

module.exports = Base.extend({
  props: {
    /**
     * Description of this slot, to be shown in the UI
     */
    description: {
      type: 'string',
      required: 'true'
    },
    /**
     * Type of slot:
     * 1. partition: partitions the data along this variable
     * 2. aggregate: this variable is used to style the plot: bar height, color, etc.
     */
    type: {
      type: 'string',
      required: true,
      default: 'partition',
      values: ['partition', 'aggregate']
    },
    rank: 'number',
    required: 'boolean'
  }
});
