/*
 * NOTE: All methods prefixed with '_' are internal and not exposed via the
 * query builder.
 */

var squel = require('squel');

class CreateTableBlock extends squel.cls.Block {
  /* The method exposed by the query builder */
  table (name) {
    this._name = name;
  }

  /** The method which generates the output */
  _toParamString (options) {
    return {
      text: this._name,
      values: [] /* values for paramterized queries */
    };
  }
}

class CreateFieldBlock extends squel.cls.Block {
  constructor (options) {
    super(options);
    this._fields = [];
  }

  /** The method exposed by the query builder */
  field (name, type) {
    this._fields.push({ name: name, type: type });
  }

  /** The method which generates the output */
  _toParamString (options) {
    let str = this._fields.map((f) => {
      return `${f.name} ${f.type.toUpperCase()}`;
    }).join(', ');

    return {
      text: `(${str})`,
      values: [] /* values for paramterized queries */
    };
  }
}

class CreateTableQuery extends squel.cls.QueryBuilder {
  constructor (options, blocks) {
    super(options, blocks || [
      new squel.cls.StringBlock(options, 'CREATE TABLE'),
      new CreateTableBlock(options),
      new CreateFieldBlock(options)
    ]);
  }
}

module.exports = function (options) {
  return new CreateTableQuery(options);
};
