/**
 * Created by Oleksandr <alex@moonion.com> on 8/31/19
 * moonion.com;
 */

import {initFields, isValidFields, encodeFields} from '../helpers';
import BD from 'binary-data';


class BaseModel {
  constructor(data, fields, protocol) {
    this._fields = fields;
    if (data instanceof Buffer) {
      // console.log("BaseModel", data.toString('hex'));
      this._buffer = data;
      let packet;
      try {
        packet = BD.decode(data, protocol);
      } catch (e) {
        console.log(e);
      }
      // console.log("BaseModel -packet", packet);
      fields.forEach((field) => {
        let value = packet[field.name];
        if (!value && field.default) {
          value = field.default
        }
        this[field.name] = value;
      });

    } else if (Array.isArray(data) && data.length) {
      fields.forEach((field, i) => {
        if (!data[i]) return
        this[field.name] = data[i];
      })
    } else if (data && typeof data === 'object') {
      fields.forEach((field) => {
        let value = data[field.name];
        if (!value && field.default) {
          value = field.default
        }
        this[field.name] = !field.encode || value instanceof Buffer ? value : field.encode(value);
      })
    }


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
