var comparators = require('./comparators');
var curry = require('lodash.curry');

var monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

function arrangeProjectsBySortGroupFilter({
  projectData,
  sortCriterion,
  groupByCriterion,
  filterCriteria
}) {
  // Filter
  var filtered = projectData;
  if (filterCriteria && filterCriteria.length > 0) {
    filtered = projectData.filter(meetsFilterCriteria);
  }

  // Sort
  // Group by sort headings
  // Group
  return filtered;

  function meetsFilterCriteria(project) {
    return filterCriteria.some(projectMeetsCriterion);

    function projectMeetsCriterion(criterion) {
      var projectPropertyValue = project[criterion.category];
      if (Array.isArray(projectPropertyValue)) {
        return projectPropertyValue.indexOf(criterion.name) !== -1;
      } else {
        return projectPropertyValue === criterion.name;
      }
    }
  }

  function convertToYearKit(year) {
    var projectsByMonth = projectsByYear[year];
    return {
      year: +year,
      monthKits: Object.keys(projectsByMonth).map(convertToMonthKit)
    };

    function convertToMonthKit(month) {
      return {
        month: +month,
        name: monthNames[month],
        projects: projectsByMonth[month].sort(
          curry(comparators.compareDescWithSortKey)(sortBy)
        )
      };
    }
  }
}

module.exports = arrangeProjectsBySortGroupFilter;
