var d3 = require('d3-selection');
var curry = require('lodash.curry');
var accessor = require('accessor')();
var groupBy = require('lodash.groupby');

function renderArrangementControls({
  containerSelector,
  criteria,
  onControlChange
}) {
  var container = d3.select(containerSelector);
  renderCriteria('filter', 'filter');
  renderCriteria('sort', 'sort');
  renderCriteria('group-by', 'groupBy');

  function renderCriteria(criterionType, criterionTypeCamelCase) {
    var criteriaForCategory = criteria.filter(
      curry(criterionWorksAs)(criterionTypeCamelCase)
    );
    var criteriaByCategory = groupBy(criteriaForCategory, 'category');
    var root = container.select('.' + criterionType + '-list');
    var filterCriteriaCategoryRoots = root
      .selectAll('.' + criterionType + '-category-root')
      .data(Object.keys(criteriaByCategory), accessor('identity'));
    filterCriteriaCategoryRoots.exit().remove();
    var newCategoryRoots = filterCriteriaCategoryRoots
      .enter()
      .append('div')
      .classed('' + criterionType + '-category-root', true);
    newCategoryRoots.append('h5').classed('category-title', true);
    newCategoryRoots
      .append('ul')
      .classed(criterionType + '-criteria-root', true);

    var currentCategoryRoots = newCategoryRoots.merge(
      filterCriteriaCategoryRoots
    );
    currentCategoryRoots.select('.category-title').text(accessor('identity'));
    var filterCriteriaRoots = currentCategoryRoots.selectAll(
      '.' + criterionType + '-criteria-root'
    );
    var filterCriteriaForCategory = filterCriteriaRoots
      .selectAll('.criterion')
      .data(getCriteriaForCategory, makeCriterionId);
    filterCriteriaForCategory.exit().remove();
    filterCriteriaForCategory
      .enter()
      .append('li')
      .classed('criterion', true)
      .on('click', onCriterionClick)
      .merge(filterCriteriaForCategory)
      .text(accessor('name'));

    function getCriteriaForCategory(category) {
      return criteriaByCategory[category];
    }
  }

  function onCriterionClick(criterion) {
    onControlChange({ criterionSelected: criterion });
  }
}

function criterionWorksAs(role, criterion) {
  return criterion.roles.indexOf(role) !== -1;
}

function makeCriterionId(c) {
  return c.category + '|' + c.name;
}

module.exports = renderArrangementControls;
