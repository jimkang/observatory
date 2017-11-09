function renderDeedDetailInnards({ parent, deed, project, user }) {
  var projectDetails = parent.select('.project-details');
  var projectNameLink = projectDetails.select('.name-link');
  var projectDate = projectDetails.select('.date');
  var projectDescription = projectDetails.select('.description');
  var deedDetails = parent.select('.deed-details');
  var deedName = deedDetails.select('.name');
  var deedDateLink = deedDetails.select('.date-link');

  projectNameLink.text(project.name);
  projectNameLink.attr('href', getProjectLink(user, project));
  projectDate.text(dateStringToDisplayForm(project.pushedAt));
  projectDescription.text(project.description);

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
