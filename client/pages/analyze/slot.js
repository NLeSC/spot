var View = require('ampersand-view');
var templates = require('../../templates');
var sortablejs = require('sortablejs');
var app = require('ampersand-app');

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
      deps: ['model.required'],
      fn: function () {
        if (this.model.required) {
          return 'required';
        } else {
          return 'optional';
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
              return partition.name;
            }
          } else if (this.model.type === 'aggregate') {
            var aggregate = filter.aggregates.get(this.model.rank, 'rank');
            if (aggregate) {
              return aggregate.operation + ' ' + aggregate.name;
            }
          } else {
            console.error('Illegal slot');
          }
        }
        return '';
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
    }
  },
  events: {
    'click [data-hook~="slot"]': 'rotateSetting'
  },
  rotateSetting: function () {
    var filter = this.collection.parent.filter;

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

      if (app.me.dataview.datasetType === 'client' && values[i] === 'min' | values[i] === 'max') {
        // crossfilter does not support min/max
        i = 0;
      }

      aggregate.operation = values[i];

      // refresh data for this plot
      filter.initDataFilter();

      // force a redraw of the text
      this.updateCounter += 1;
    }
  },
  render: function () {
    this.renderWithTemplate(this);

    var me = this;
    var filter = this.collection.parent.filter;

    this._sortable = sortablejs.create(this.queryByHook('drop-zone'), {
      draggable: '.mdl-chip',
      group: {
        name: 'facets',
        pull: true,
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

        if (me.model.type === 'partition') {
          filter.partitions.add({
            facetName: facet.name,
            name: facet.name,
            units: facet.units,
            rank: me.model.rank
          });
        } else if (me.model.type === 'aggregate') {
          filter.aggregates.add({
            facetName: facet.name,
            name: facet.name,
            units: facet.units,
            rank: me.model.rank
          });
        } else {
          console.error('Illegal slot');
          return;
        }
        me.isFilled = true;
        filter.initDataFilter();

        // force a redraw of the text
        me.updateCounter += 1;
      }
    });
  }
});
