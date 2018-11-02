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
    .sort(compareDesc)
    .map(convertToYearKit);

  function placeProject(project) {
    var year;
    var month;
    if (project[sortBy]) {
      year = project[sortBy].getFullYear();
      month = project[sortBy].getMonth();
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
      year,
      monthKits: Object.keys(projectsByMonth).map(convertToMonthKit)
    };

    function convertToMonthKit(month) {
      return {
        month,
        name: monthNames[month],
        projects: projectsByMonth[month].sort(compareDescWithSortKey)
      };
    }
  }

  function compareDesc(keyA, keyB) {
    if (keyA < keyB) {
      return 1;
    } else {
      return -1;
    }
  }

  function compareDescWithSortKey(objectA, objectB) {
    if (objectA[sortBy] < objectB[sortBy]) {
      return 1;
    } else {
      return -1;
    }
  }
}

module.exports = arrangeProjectDataByYear;
