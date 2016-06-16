if(!global._babelPolyfill) { require('babel-polyfill'); }

import Proto from 'uberproto';
import filter from 'feathers-query-filters';
import errors from 'feathers-errors';
import * as utils from './utils';

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
    const query = utils.getQuery(params)
    const options = utils.getOptions(params, 'find')

    return this.Model.where(query).fetchAll(options).then((results) => (
      results
    )).catch(utils.errorHandler)
  }

  get(id) {
    return this.Model.findWhere({id}).fetch(params).then(instance => instance).catch(utils.errorHandler)
  }

  create(data) {
    return this.Model.create(data).catch(utils.errorHandler);
  }

  patch(... args) {
    return this.Model.update(...args)
  }

  update(id, data) {
    if (Array.isArray(data)) {
      return Promise.reject('Not replacing multiple records. Did you mean `patch`?');
    }

    delete data[this.id];

    return this.Model.findWhere({ id }).fetch().then(instance => {
      if (!instance) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }

      const copy = {};
      Object.keys(instance.toJSON()).forEach(key => {
        // NOTE (EK): Make sure that we don't waterline created fields to null
        // just because a user didn't pass them in.
        if ((key === 'created_at' || key === 'created_at') && typeof data[key] === 'undefined') {
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
    return this.get(id)
  }
}

export default function init(Model) {
  return new Service(Model);
}

init.Service = Service;
