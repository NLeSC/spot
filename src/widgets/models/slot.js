/**
 * A slot defines how a variable can be added to a plot
 *
 * @class Slot
 */
var AmpersandModel = require('ampersand-model');

function labelForPartition (facet) {
  // use: "label [units]" or "label"
  if (facet.units.length > 0) {
    return facet.name + ' [' + facet.units + ']';
  } else {
    return facet.name;
  }
}

module.exports = AmpersandModel.extend({
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
    /**
     * Supported facet types. A subset of: [constant, categorial, datetime, duration, text]
     */
    supportedFacets: {
      type: 'array',
      required: true,
      default: function () {
        return [];
      }
    },
    rank: 'number',
    required: 'boolean',
    isFilled: 'boolean'
  },
  /**
   * Remove facet from the slot
   * @returns {boolean} succes True if something was removed
   */
  emptySlot: function () {
    var filter = this.collection.parent.filter;
    if (!filter || !this.isFilled) {
      return false;
    }

    filter.releaseDataFilter();
    if (this.type === 'partition') {
      var partition = filter.partitions.get(this.rank, 'rank');
      filter.partitions.remove(partition);
    } else if (this.type === 'aggregate') {
      var aggregate = filter.aggregates.get(this.rank, 'rank');
      filter.aggregates.remove(aggregate);
    }
    this.isFilled = false;
    return true;
  },
  /**
   * Try to fill the slot with the provided facet
   * returns true on success, false on failure
   * The tryFillSlot caller is responsible to do a app.trigger('refresh')
   *
   * @param {Facet} facet
   * @param {string} operation Optional. Requested operation for aggregates
   * @returns {boolean} success
   */
  tryFillSlot: function (facet, operation) {
    var filter = this.collection.parent.filter;
    if (!filter || this.isFilled) {
      return false;
    }

    // check if this slot accepts this type of facet
    if (this.supportedFacets.indexOf(facet.type) === -1) {
      return false;
    }

    // Release this filter, and add relevant partition or aggregate
    filter.releaseDataFilter();

    if (this.type === 'partition') {
      var partition = filter.partitions.add({
        facetName: facet.name,
        label: labelForPartition(facet),
        showLabel: (this.rank !== 1) || !facet.isCategorial,
        rank: this.rank
      });
      partition.reset();
    } else if (this.type === 'aggregate') {
      filter.aggregates.add({
        facetName: facet.name,
        label: facet.name,
        rank: this.rank,
        operation: operation || 'avg'
      });
    } else {
      console.error('Illegal slot');
      return false;
    }

    this.isFilled = true;
    return true;
  }
});
