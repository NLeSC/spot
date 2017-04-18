var View = require('ampersand-view');
var templates = require('../../templates');
var sortablejs = require('sortablejs');
var app = require('ampersand-app');

function labelForPartition (facet) {
  // use: "label [units]" or "label"
  if (facet.units.length > 0) {
    return facet.name + ' [' + facet.units + ']';
  } else {
    return facet.name;
  }
}

module.exports = View.extend({
  template: templates.analyze.slot,
  props: {
    isFilled: 'boolean',
    updateCounter: {
      type: 'number',
      default: 0,
      required: true
    }
  },
  derived: {
    requiredText: {
      deps: ['model.required', 'isFilled'],
      fn: function () {
        if (this.isFilled) {
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
      deps: ['isFilled', 'updateCounter'],
      cache: false,
      fn: function () {
        var filter = this.collection.parent.filter;

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
        return '';
      }
    }
  },
  initialize: function () {
    var filter = this.collection.parent.filter;
    this.isFilled = false;

    if (filter) {
      if (this.model.type === 'partition') {
        var partition = filter.partitions.get(this.model.rank, 'rank');
        if (partition) {
          this.isFilled = true;
        }
      } else if (this.model.type === 'aggregate') {
        var aggregate = filter.aggregates.get(this.model.rank, 'rank');
        if (aggregate) {
          this.isFilled = true;
        }
      } else {
        console.error('Illegal slot');
      }
    }
  },
  bindings: {
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
    'isFilled': {
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
      filter.releaseDataFilter();

      var i = values.indexOf(aggregate.operation) + 1;
      if (i >= values.length) {
        i = 0;
      }

      if (app.me.dataview.datasetType === 'client' && values[i] === 'min' | values[i] === 'max') {
        // crossfilter does not support min/max
        i = 0;
      }

      aggregate.operation = values[i];

      filter.initDataFilter();
      app.trigger('refresh');

      // force a redraw of the text
      this.updateCounter += 1;
    }
  },
  emptySlot: function () {
    var filter = this.collection.parent.filter;
    if (!filter || !this.isFilled) {
      return;
    }

    filter.releaseDataFilter();
    if (this.model.type === 'partition') {
      var partition = filter.partitions.get(this.model.rank, 'rank');
      filter.partitions.remove(partition);
    } else if (this.model.type === 'aggregate') {
      var aggregate = filter.aggregates.get(this.model.rank, 'rank');
      filter.aggregates.remove(aggregate);
    }
    this.isFilled = false;
    app.trigger('refresh');

    this._sortable.option('disabled', false);
  },
  render: function () {
    this.renderWithTemplate(this);

    var me = this;
    var filter = this.collection.parent.filter;

    this._sortable = sortablejs.create(this.queryByHook('drop-zone'), {
      draggable: '.mdl-chip',
      disabled: this.isFilled,
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

        filter.releaseDataFilter();
        if (me.model.type === 'partition') {
          var partition = filter.partitions.add({
            facetName: facet.name,
            label: labelForPartition(facet),
            showLabel: (me.model.rank !== 1) || !facet.isCategorial,
            rank: me.model.rank
          });
          partition.reset();
          partition.setGroups();
        } else if (me.model.type === 'aggregate') {
          filter.aggregates.add({
            facetName: facet.name,
            label: facet.name,
            rank: me.model.rank
          });
        } else {
          console.error('Illegal slot');
          return;
        }
        me.isFilled = true;
        app.trigger('refresh');

        // force a redraw of the text
        me.updateCounter += 1;

        this.option('disabled', true);
      }
    });
  }
});
