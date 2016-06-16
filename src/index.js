if(!global._babelPolyfill) { require('babel-polyfill'); }

import Proto from 'uberproto';
import filter from 'feathers-query-filters';
import errors from 'feathers-errors';
import * as utils from './utils';
import isArray from 'lodash/isArray'
import omit from 'lodash/omit'

class Service {
  constructor(options) {
    this.paginate = options.paginate || {};
    this.Model = options.Model;
    this.id = options.id || 'id';
  }

  extend(obj) {
    return Proto.extend(obj, this);
  }

  find(params) {
    const query = utils.getWhere(params.query)
    const options = utils.getOptions(params.query, 'find')

    const qb = this.Model.where(query)

    return qb
      .fetchAll(options)
      .then((r) => r.toJSON())
      .catch(utils.errorHandler)
  }

  get(id) {
    return this.getInstanceAt(id)
      .then((r) => r.toJSON())
      .catch(utils.errorHandler)
  }

  getInstanceAt(id, strict = true) {
    return this.Model.where({id})
    .fetch()
    .then((instance) => {
      if (!instance && strict) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }

      return instance
    })
  }

  create(data, params) {
    console.log('Create', data, params)

    return this.Model
      .collection()
      .create(data)
      .then((r) => r.toJSON())
      .catch(utils.errorHandler);
  }

  patch(id, data) {
    return this.Model.query()
      .where({id})
      .update(
        omit(data, 'id', 'created_at')
      )
      .then(() => this.get(id))
      .catch(utils.errorHandler)
  }

  update(id, data, ...args) {
    if (isArray(data)) {
      return Promise.reject('Not replacing multiple records. Did you mean `patch`?');
    }

    delete data[this.id];

    return this.Model
      .where({id})
      .fetch()
      .then(instance => {
        if (!instance) {
          throw new errors.NotFound(`No record found for id '${id}'`);
          return
        }

        const copy = {};
        Object.keys(instance.toJSON()).forEach(key => {
          // NOTE (EK): Make sure that we don't waterline created fields to null
          // just because a user didn't pass them in.
          if ((key === 'id') || (key === 'updated_at' || key === 'created_at') && typeof data[key] === 'undefined') {
            return;
          }

          if (typeof data[key] === 'undefined') {
            copy[key] = null;
          } else {
            copy[key] = data[key];
          }
        });

        return this.patch(id, copy, {});
    })
    .catch(utils.errorHandler);
  }

  remove(id, params) {
    return this.getInstanceAt(id)
      .then((model) => (
        model.destroy() && model
      ))
      .catch(utils.errorHandler)
  }
}

export default function init(Model) {
  return new Service({Model});
}

init.Service = Service;
