var d3 = require('d3-selection');
var curry = require('lodash.curry');
var accessor = require('accessor');
var groupBy = require('lodash.groupby');
var listParser = require('../route-list-parser');
var criteria = require('../criteria');

var defaultFilterCriteria = criteria.filter(criterionIncludesFilterRole);

// WARNING: This works fine here, but won't as a general solution.
var snakeCaseRegex = /([a-z]+)([A-Z])([a-z]+)/;

function renderArrangementControls({
  containerSelector,
  criteria = defaultFilterCriteria,
  selectedCriteriaNames,
  filterMode,
  onCriteriaControlChange,
  onCriteriaFilterModeChange
}) {
  var selectedCriteriaNameArray = listParser.parse(selectedCriteriaNames);
  var container = d3.select(containerSelector);

  var someFilterOption = document.getElementById('filter-some-option');
  var everyFilterOption = document.getElementById('filter-every-option');

  if (filterMode === 'some') {
    someFilterOption.setAttribute('checked', 'checked');
    everyFilterOption.removeAttribute('checked');
  } else {
    everyFilterOption.setAttribute('checked', 'checked');
    someFilterOption.removeAttribute('checked');
  }

  renderCriteria('filter', 'filter');
  renderCriteria('sort', 'sortBy');
  renderCriteria('group-by', 'groupBy', true);

  function renderCriteria(
    criterionType,
    criterionTypeCamelCase,
    renderCategoriesAsCriteria = false
  ) {
    d3.select(someFilterOption).on('click', onSomeFilterClick);
    d3.select(everyFilterOption).on('click', onEveryFilterClick);

    var criteriaForCategory = criteria.filter(
      curry(criterionWorksAs)(criterionTypeCamelCase)
    );
    var criteriaByCategory = groupBy(criteriaForCategory, 'category');
    var root = container.select('.' + criterionType + '-list');
    var criteriaCategoryRoots = root
      .selectAll('.' + criterionType + '-category-root')
      .data(Object.keys(criteriaByCategory), accessor('identity'));

    criteriaCategoryRoots.exit().remove();
    var newCategoryRoots = criteriaCategoryRoots
      .enter()
      .append('div')
      .classed('' + criterionType + '-category-root', true);
    newCategoryRoots.append('h5').classed('category-title', true);
    newCategoryRoots
      .append('ul')
      .classed(criterionType + '-criteria-root', true);

    if (renderCategoriesAsCriteria) {
      newCategoryRoots.on('click', curry(onCriterionClick)(criterionType));
    }
    var currentCategoryRoots = newCategoryRoots.merge(criteriaCategoryRoots);
    currentCategoryRoots.select('.category-title').text(snakeToSentenceCase);

    if (!renderCategoriesAsCriteria) {
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
        .classed('selected', isInSelectedCriteria)
        .on('click', curry(onCriterionClick)(criterionType))
        .merge(filterCriteriaForCategory)
        .text(getDisplayName);
    }

    function getCriteriaForCategory(category) {
      return criteriaByCategory[category];
    }

    function onSomeFilterClick() {
      onCriteriaFilterModeChange({ filterMode: 'some' });
      everyFilterOption.removeAttribute('checked');
    }

    function onEveryFilterClick() {
      onCriteriaFilterModeChange({ filterMode: 'every' });
      someFilterOption.removeAttribute('checked');
    }
  }

  function onCriterionClick(criterionType, criterion) {
    if (criterionType === 'filter') {
      // Toggle `selected` class.
      var sel = d3.select(this);
      var selected = sel.classed('selected');
      selected = !selected;
      sel.classed('selected', selected);
    }
    onCriteriaControlChange({ criterion, criterionType, selected });
  }

  function isInSelectedCriteria(criterion) {
    return selectedCriteriaNameArray.indexOf(criterion.name) !== -1;
  }
}

function snakeToSentenceCase(s) {
  var matches = s.match(snakeCaseRegex);
  if (matches && matches.length > 3) {
    return (
      capitalizeFirst(matches[1]) + ' ' + matches[2].toLowerCase() + matches[3]
    );
  } else {
    return capitalizeFirst(s);
  }
}

function capitalizeFirst(s) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}

function getDisplayName(criterion) {
  return snakeToSentenceCase(criterion.name);
}

function criterionWorksAs(role, criterion) {
  return criterion.roles.indexOf(role) !== -1;
}

function makeCriterionId(c) {
  return c.category + '|' + c.name;
}

function criterionIncludesFilterRole(c) {
  return c.roles.indexOf('filter') !== -1;
}

module.exports = renderArrangementControls;
