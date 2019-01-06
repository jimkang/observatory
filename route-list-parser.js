var compact = require('lodash.compact');
// TODO: This should be in route-state.
function parse(s) {
  return s ? compact(s.split('|')) : [];
}

function stringify(items) {
  return items.join('|');
}

module.exports = {
  parse,
  stringify
};
