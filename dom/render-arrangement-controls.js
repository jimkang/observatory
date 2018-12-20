var d3 = require('d3-selection');
var curry = require('lodash.curry');

function renderArrangementControls({
  containerSelector,
  criteria,
  onControlChange
}) {
  var filterCriteria = criteria.filter(curry(criterionWorksAs)('filter'));
  var sortByCriteria = criteria.filter(curry(criterionWorksAs)('sortBy'));
  var groupByCriteria = criteria.filter(curry(criterionWorksAs)('groupBy'));
  console.log(filterCriteria, sortByCriteria, groupByCriteria);
}

function criterionWorksAs(role, criterion) {
  return criterion.roles.indexOf(role) !== -1;
}

module.exports = renderArrangementControls;
