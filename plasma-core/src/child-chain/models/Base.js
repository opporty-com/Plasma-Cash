import {initFields, isValidFields, encodeFields} from '../helpers';

/**
 * Created by Oleksandr <alex@moonion.com> on 8/31/19
 * moonion.com;
 */

class BaseModel {
  constructor(data, fields) {
    this._fields = fields;
    initFields(this, this._fields, data || {})
  }

  get(name) {
    if (typeof this[name] === "undefined")
      throw Error(`Not found params ${name}`);

    const fieldName = `_${name}`;
    if (this[fieldName]) {
      return this[fieldName]
    }
    const field = this._fields.find(f => f.name === name);
    if (!field)
      throw Error(`Not found fields ${name}`);
    this[fieldName] = field.decode(this[name]);
    return this[fieldName];
  }

  set(name, value) {
    const fieldName = `_${name}`;
    if (value instanceof Buffer) {
      delete this[fieldName];
      this[name] = value;
    } else {
      this[fieldName] = value;
      const field = this._fields.find(f => f.name === name);
      if (!field)
        throw Error(`Not found fields ${name}`);
      this[name] = field.encode(value);
    }
  }

  getJson() {
    let o = {};
    this._fields.forEach(field => {
      o[field.name] = this.get(field.name)
    });

    return o;
  }

}

export default BaseModel;
