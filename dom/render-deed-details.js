var d3 = require('d3-selection');

// Pre-rendering prep with static elements.
var detailsLayer = d3.select('.details-layer');
var detailsBox = d3.select('.details-box');
var closeButton = detailsBox.select('.close-button');

var projectDetails = detailsBox.select('.project-details');
var projectNameLink = projectDetails.select('.name-link');
var projectDate = projectDetails.select('.date');
var projectDescription = projectDetails.select('.description');
var deedDetails = detailsBox.select('.deed-details');
var deedName = deedDetails.select('.name');
var deedDateLink = deedDetails.select('.date-link');

closeButton.on('click', hideBox);

function RenderDeedDetails({user}) {
  return renderDeedDetails;

  function renderDeedDetails({deed, project}) {
    projectNameLink.text(project.name);
    projectNameLink.attr('href', getProjectLink(user, project));
    projectDate.text(dateStringToDisplayForm(project.pushedAt));
    projectDescription.text(project.description);

    deedName.text(deed.message);
    deedDateLink.text(dateStringToDisplayForm(deed.committedDate));
    deedDateLink.attr('href', getDeedLink(user, project, deed));

    detailsLayer.classed('destroyed', false);
  }
}

function hideBox() {
  detailsLayer.classed('destroyed', true);
}

function dateStringToDisplayForm(dateString) {
  var date = new Date(dateString);
  return date.toLocaleDateString() + ', ' + date.toLocaleTimeString();
}

function getDeedLink(user, project, deed) {
  return `https://github.com/${user}/${project.name}/commit/${deed.abbreviatedOid}`;
}

function getProjectLink(user, project) {
  return `https://github.com/${user}/${project.name}`;
}

module.exports = RenderDeedDetails;
