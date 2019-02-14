var defaultCriteria = require('./criteria');

function getCriteriaForNames(names, criteria = defaultCriteria) {
  return criteria.filter(criterionMatchesName);

  function criterionMatchesName(criterion) {
    return names.indexOf(criterion.name) !== -1;
  }
}

module.exports = getCriteriaForNames;
