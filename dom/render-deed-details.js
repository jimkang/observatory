var d3 = require('d3-selection');

// Pre-rendering prep with static elements.
var detailsBox = d3.select('.details-box');
detailsBox.on('click', hideBox);

var projectDetails = detailsBox.select('.project-details');
var projectName = projectDetails.select('.name');
var deedDetails = detailsBox.select('.deed-details');
var deedName = deedDetails.select('.name');

function renderDeedDetails({deed, project}) {
  projectName.text(project.name);
  deedName.text(deed.message);
  detailsBox.classed('destroyed', false);
}

function hideBox() {
  detailsBox.classed('destroyed', true);
}

module.exports = renderDeedDetails;
