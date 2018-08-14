function arrangeProjectDataByYear({ projectData, sortBy = 'startDate' }) {
  var projectsByYear = {};
  projectData.forEach(placeProject);
  return projectsByYear;

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
}

module.exports = arrangeProjectDataByYear;
