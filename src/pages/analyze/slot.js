var View = require('ampersand-view');
var templates = require('../../templates');
var sortablejs = require('sortablejs');
var app = require('ampersand-app');

var startDnd = function (type) {
  if (this.model.isFilled) {
    // do nothing if the slot is already filled
    this.dndClass = '';
  } else {
    if (this.model.supportedFacets.indexOf(type) > -1) {
      // highlight the drop zone
      this.dndClass = 'slot-start-dnd-accept';
    } else {
      // gray out the drop zone
      this.dndClass = 'slot-start-dnd-reject';
    }
  }
};

var stopDnd = function () {
  this.dndClass = '';
};

module.exports = View.extend({
  template: templates.analyze.slot,
  props: {
    dndClass: 'string', // CSS class to add when a facet dnd is in progress
    updateCounter: {
      type: 'number',
      default: 0,
      required: true
    }
  },
  derived: {
    requiredText: {
      deps: ['model.required', 'model.isFilled'],
      fn: function () {
        if (this.model.isFilled) {
          return 'click to configure';
        } else {
          if (this.model.required) {
            return 'required';
          } else {
            return 'optional';
          }
        }
      }
    },
    chipText: {
      deps: ['model.isFilled', 'updateCounter'],
      cache: false,
      fn: function () {
        var filter = this.collection.parent.filter;

        // stop accepting DND
        if (this._sortable) {
          this._sortable.option('disabled', true);
        }

        if (filter) {
          if (this.model.type === 'partition') {
            var partition = filter.partitions.get(this.model.rank, 'rank');
            if (partition) {
              return partition.facetName;
            }
          } else if (this.model.type === 'aggregate') {
            var aggregate = filter.aggregates.get(this.model.rank, 'rank');
            if (aggregate) {
              return aggregate.operation + ' ' + aggregate.label;
            }
          } else {
            console.error('Illegal slot');
          }
        }

        // this slots should accept DND
        if (this._sortable) {
          this._sortable.option('disabled', false);
        }
        return '';
      }
    }
  },
  initialize: function () {
    var filter = this.collection.parent.filter;
    this.model.isFilled = false;

    if (filter) {
      if (this.model.type === 'partition') {
        var partition = filter.partitions.get(this.model.rank, 'rank');
        if (partition) {
          this.model.isFilled = true;
        }
      } else if (this.model.type === 'aggregate') {
        var aggregate = filter.aggregates.get(this.model.rank, 'rank');
        if (aggregate) {
          this.model.isFilled = true;
        }
      } else {
        console.error('Illegal slot');
      }
    }

    // add remove classes 'dndAccept' and 'dndRefuse' on drag-and-drop
    app.on('dragStart', startDnd, this);
    app.on('dragEnd', stopDnd, this);
    this.on('remove', function () {
      app.off('dragStart', startDnd);
      app.off('dragEnd', stopDnd);
    }, this);
  },
  bindings: {
    'dndClass': {
      type: 'class',
      hook: 'drop-zone'
    },
    'model.description': {
      type: 'text',
      hook: 'description'
    },
    'requiredText': {
      type: 'text',
      hook: 'required'
    },
    'chipText': {
      type: 'text',
      hook: 'drop-zone'
    },
    'model.isFilled': {
      type: 'toggle',
      hook: 'button-div'
    }
  },
  events: {
    'click .clickTarget': 'rotateSetting',
    'click [data-hook~="delete"]': 'emptySlot'
  },
  rotateSetting: function () {
    var filter = this.collection.parent.filter;
    filter.releaseDataFilter();

    if (this.model.type === 'partition') {
      var partition = filter.partitions.get(this.model.rank, 'rank');
      if (!partition) {
        return;
      }

      app.navigate('partition/' + partition.getId());
    } else if (this.model.type === 'aggregate') {
      var values = ['count', 'avg', 'sum', 'stddev', 'min', 'max'];
      var aggregate = filter.aggregates.get(this.model.rank, 'rank');
      if (!aggregate) {
        return;
      }

      var i = values.indexOf(aggregate.operation) + 1;
      if (i >= values.length) {
        i = 0;
      }

      if (app.me.sessionType === 'client' && values[i] === 'min' | values[i] === 'max') {
        // crossfilter does not support min/max
        i = 0;
      }

      aggregate.operation = values[i];

      app.trigger('refresh');

      // force a redraw of the text
      this.updateCounter += 1;
    }
  },
  emptySlot: function () {
    if (this.model.emptySlot()) {
      app.trigger('refresh');

      // force a redraw of the chipText
      this.updateCounter += 1;
    }
  },
  tryFillSlot: function (facet) {
    if (this.model.tryFillSlot(facet)) {
      // Hack-ish feature:
      //  * for bubble plots, add a facet dropped as 'X axis' also as 'Point size'
      //  * for 3d scatter plots, add a facet dropped as 'X axis' also as 'Color by'
      var chartType = this.model.collection.parent.filter.chartType;
      if (chartType === 'bubbleplot') {
        if (this.model.description === 'X axis') {
          this.model.collection.get('Point size', 'description').tryFillSlot(facet, 'count');
        }
      } else if (chartType === 'scatterchart') {
        if (this.model.description === 'X axis') {
          this.model.collection.get('Color by', 'description').tryFillSlot(facet, 'count');
        }
      }

      app.trigger('refresh');

      // force a redraw of the chipText
      this.updateCounter += 1;
    }
  },
  render: function () {
    this.renderWithTemplate(this);

    var me = this;
    this._sortable = sortablejs.create(this.queryByHook('drop-zone'), {
      draggable: '.mdl-chip',
      disabled: me.model.isFilled,
      group: {
        name: 'facets',
        pull: false,
        put: true
      },
      onAdd: function (evt) {
        // get the dropped facet
        // because the ampersand view collection takes care of rendering a
        // prettier one
        var item = evt.item;
        var facetId = item.getAttribute('data-id');
        item.remove();

        var facet = app.me.dataview.facets.get(facetId);
        if (!facet) {
          console.error('Cannot find facet');
          return;
        }
        me.tryFillSlot(facet);
      }
    });
  }
});
