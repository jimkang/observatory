var accessor = require('accessor')();

function renderDeedDetailInnards({ parent, deed, project, user }) {
  var projectDetails = parent.select('.project-details');
  var projectNameLink = projectDetails.select('.name-link');
  var projectStartDate = projectDetails.select('.date.started');
  var projectLastActiveDate = projectDetails.select('.date.last-active');
  var projectDescription = projectDetails.select('.description');
  var linkList = projectDetails.select('.link-list');
  var deedDetails = parent.select('.deed-details');
  var deedName = deedDetails.select('.name');
  var deedDateLink = deedDetails.select('.date-link');

  projectNameLink.text(project.name);
  projectNameLink.attr('href', getProjectLink(user, project));
  if (project.startDate) {
    projectStartDate.text(dateStringToDisplayForm(project.startDate));
  }
  if (project.lastActiveDate) {
    projectLastActiveDate.text(dateStringToDisplayForm(project.lastActiveDate));
  }
  var links = project.links || [];
  if (project.metalinks) {
    links = links.concat(project.metalinks);
  }
  renderLinks(links);
  projectDescription.text(project.description);

  deedDetails.classed('hidden', !deed);
  if (deed) {
    deedName.text(deed.message);
    deedDateLink.text(dateStringToDisplayForm(deed.committedDate));
    deedDateLink.attr('href', getDeedLink(user, project, deed));
  }

  function renderLinks(links) {
    var items = linkList.selectAll('li').data(links);
    items.exit().remove();
    var newItems = items.enter().append('li');
    newItems.append('a').attr('target', '_blank');
    var updateItems = newItems.merge(items);
    updateItems
      .select('a')
      .attr('href', accessor('0'))
      .text(accessor('1'));
  }
}

function getProjectLink(user, project) {
  return `https://github.com/${user}/${project.name}`;
}

function getDeedLink(user, project, deed) {
  return `https://github.com/${user}/${project.name}/commit/${deed.abbreviatedOid}`;
}

function dateStringToDisplayForm(dateString) {
  var date = new Date(dateString);
  return date.toLocaleDateString() + ', ' + date.toLocaleTimeString();
}

module.exports = renderDeedDetailInnards;
