function getCriteriaForNames(criteria, names) {
  return criteria.filter(criterionMatchesName);

  function criterionMatchesName(criterion) {
    return names.indexOf(criterion.name) !== -1;
  }
}

module.exports = getCriteriaForNames;
