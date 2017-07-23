var findWhere = require('lodash.findwhere');

function addDeedToProject(onNonFatalError, projects, deed) {
  var containingProject = findWhere(projects, {name: deed.projectName});
  if (!containingProject) {
    onNonFatalError(new Error('No project ' + deed.projectName + ' found.'));
    // console.log('Looking in projects', projects);
  }
  else {
    if (!containingProject.deeds) {
      containingProject.deeds = [];
    }
    containingProject.deeds.push(deed);
  }
}

module.exports = addDeedToProject;
