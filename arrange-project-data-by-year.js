function arrangeProjectDataByYear({ projectData, sortBy = 'startDate' }) {
  var projectsByYear = {};
  projectData.forEach(placeProject);
  return Object.keys(projectsByYear)
    .sort(compareDesc)
    .map(convertToYearKit);

  function placeProject(project) {
    var year;
    if (project[sortBy]) {
      year = project[sortBy].getFullYear();
    }
    if (year) {
      var projectsForYear = projectsByYear[year];
      if (!projectsForYear) {
        projectsForYear = [];
        projectsByYear[year] = projectsForYear;
      }
      projectsForYear.push(project);
    }
  }

  function convertToYearKit(year) {
    return {
      year,
      projects: projectsByYear[year]
    };
  }

  function compareDesc(keyA, keyB) {
    if (keyA < keyB) {
      return 1;
    } else {
      return -1;
    }
  }
}

module.exports = arrangeProjectDataByYear;
