// var findWhere = require('lodash.findwhere');

function addDeedToProject(onNonFatalError, collectedProjectsByName, deed) {
  var containingProject = collectedProjectsByName[deed.projectName];
  if (!containingProject) {
    onNonFatalError(new Error('No project ' + deed.projectName + ' found.'));
  }
  else {
    if (!containingProject.deeds) {
      containingProject.deeds = [];
      containingProject.deeds.push(deed);
    }
    else {
      var index = findIndexIndexWhere(containingProject.deeds, deed.id);
      if (index === -1) {
        containingProject.deeds.push(deed);
      }
      else {
        containingProject.deeds[index] = deed;
      }
    }
  }
}

function findIndexIndexWhere(deeds, id) {
  for (var i = 0; i < deeds.length; ++i) {
    if (deeds[i].id === id) {
      return i;
    }
  }
  return -1;
}

module.exports = addDeedToProject;
