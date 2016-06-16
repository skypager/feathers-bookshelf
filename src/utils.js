import errors from 'feathers-errors';

export function errorHandler(error) {
  const e = error.toJSON();
  const data = Object.assign({ errors: error.errors}, e);
  throw new errors.BadRequest(e.summary, data);
}

export function getOrder(sort={}) {
  const order = {};

  Object.keys(sort).forEach(name => {
    order[name] = sort[name] === 1 ? 'asc' : 'desc';
  });

  return order;
}

const queryMappings = {
  $lt: '<',
  $lte: '<=',
  $gt: '>',
  $gte: '>=',
  $ne: '!',
  $nin: '!',
};

const specials = ['$sort', '$limit', '$skip', '$select'];

function getValue(value, prop) {
  if(typeof value === 'object' && specials.indexOf(prop) === -1) {
    const query = {};

    Object.keys(value).forEach(key => {
      if(queryMappings[key]) {
        query[queryMappings[key]] = value[key];
      } else {
        query[key] = value[key];
      }
    });

    return query;
  }

  return value;
}

export function getWhere(query) {
  const where = {};

  if(typeof query !== 'object') {
    return {};
  }

  Object.keys(query).forEach(prop => {
    const value = query[prop];

    if(prop === '$or') {
      where.or = value;
    } else if(value.$in) {
      where[prop] = value.$in;
    } else {
      where[prop] = getValue(value, prop);
    }
  });

  return where;
}
