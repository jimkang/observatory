function filterProjects({ projectData, filterCriteria }) {
  // Filter
  var filtered = projectData;
  if (filterCriteria && filterCriteria.length > 0) {
    filtered = projectData.filter(meetsFilterCriteria);
  }
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
}

module.exports = filterProjects;
