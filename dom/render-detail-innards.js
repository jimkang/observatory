function renderDeedDetailInnards({ parent, deed, project, user }) {
  var projectDetails = parent.select('.project-details');
  var projectNameLink = projectDetails.select('.name-link');
  var projectStartDate = projectDetails.select('.date.started');
  var projectLastActiveDate = projectDetails.select('.date.last-active');
  var projectDescription = projectDetails.select('.description');
  var deedDetails = parent.select('.deed-details');
  var deedName = deedDetails.select('.name');
  var deedDateLink = deedDetails.select('.date-link');

  projectNameLink.text(project.name);
  projectNameLink.attr('href', getProjectLink(user, project));
  projectStartDate.text(dateStringToDisplayForm(project.startDate));
  projectLastActiveDate.text(dateStringToDisplayForm(project.lastActiveDate));
  projectDescription.text(project.description);

  deedDetails.classed('hidden', !deed);
  if (deed) {
    deedName.text(deed.message);
    deedDateLink.text(dateStringToDisplayForm(deed.committedDate));
    deedDateLink.attr('href', getDeedLink(user, project, deed));
  }
}

function getProjectLink(user, project) {
  return `https://github.com/${user}/${project.name}`;
}

function getDeedLink(user, project, deed) {
  return `https://github.com/${user}/${project.name}/commit/${
    deed.abbreviatedOid
  }`;
}

function dateStringToDisplayForm(dateString) {
  var date = new Date(dateString);
  return date.toLocaleDateString() + ', ' + date.toLocaleTimeString();
}

module.exports = renderDeedDetailInnards;
