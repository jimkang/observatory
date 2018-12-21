var d3 = require('d3-selection');
var curry = require('lodash.curry');
var accessor = require('accessor')();
var groupBy = require('lodash.groupby');

function renderArrangementControls({
  containerSelector,
  criteria,
  onControlChange
}) {
  var filterCriteria = criteria.filter(curry(criterionWorksAs)('filter'));
  var filterCriteriaByCategory = groupBy(filterCriteria, 'category');
  var sortByCriteria = criteria.filter(curry(criterionWorksAs)('sortBy'));
  var groupByCriteria = criteria.filter(curry(criterionWorksAs)('groupBy'));
  console.log(filterCriteriaByCategory, sortByCriteria, groupByCriteria);

  var container = d3.select(containerSelector);
  var filtersRoot = container.select('.filter-list');
  var sortsRoot = container.select('.sort-list');
  var groupBysRoot = container.select('.group-by-list');

  var filterCriteriaCategoryRoots = filtersRoot
    .selectAll('.filter-category-root')
    .data(Object.keys(filterCriteriaByCategory), accessor('identity'));
  filterCriteriaCategoryRoots.exit().remove();
  var newCategoryRoots = filterCriteriaCategoryRoots
    .enter()
    .append('div')
    .classed('filter-category-root', true);
  newCategoryRoots.append('h5').classed('category-title', true);
  newCategoryRoots.append('ul').classed('filter-criteria-root', true);

  var currentCategoryRoots = newCategoryRoots.merge(
    filterCriteriaCategoryRoots
  );
  currentCategoryRoots.select('.category-title').text(accessor('identity'));
  var filterCriteriaRoots = currentCategoryRoots.selectAll(
    '.filter-criteria-root'
  );
  var filterCriteriaForCategory = filterCriteriaRoots
    .selectAll('.criterion')
    .data(getCriteriaForCategory, makeCriterionId);
  filterCriteriaForCategory.exit().remove();
  filterCriteriaForCategory
    .enter()
    .append('li')
    .classed('criterion', true)
    .merge(filterCriteriaForCategory)
    .text(accessor('name'));

  function getCriteriaForCategory(category) {
    return filterCriteriaByCategory[category];
  }

  filtersRoot;
}

function criterionWorksAs(role, criterion) {
  return criterion.roles.indexOf(role) !== -1;
}

function makeCriterionId(c) {
  return c.category + '|' + c.name;
}

module.exports = renderArrangementControls;
