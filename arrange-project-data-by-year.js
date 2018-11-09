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

function arrangeProjectDataByYear({ projectData, sortBy = 'startDate' }) {
  var projectsByYear = {};
  projectData.forEach(placeProject);

  return Object.keys(projectsByYear)
    .sort(comparators.compareDesc)
    .map(convertToYearKit);

  function placeProject(project) {
    var year;
    var month;
    if (project[sortBy]) {
      year = +project[sortBy].getFullYear();
      month = +project[sortBy].getMonth();
    }
    if (year && month) {
      var projectsForYear = projectsByYear[year];
      if (!projectsForYear) {
        projectsForYear = {};
        projectsByYear[year] = projectsForYear;
      }
      var projectsForMonth = projectsForYear[month];
      if (!projectsForMonth) {
        projectsForMonth = [];
        projectsForYear[month] = projectsForMonth;
      }
      projectsForMonth.push(project);
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

module.exports = arrangeProjectDataByYear;
