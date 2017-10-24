var d3 = require('d3-selection');
var renderDetailInnards = require('./render-detail-innards');

// Pre-rendering prep with static elements.
var detailsLayer = d3.select('.details-layer');
var detailsBox = d3.select('.details-box');
var closeButton = detailsBox.select('.close-button');

closeButton.on('click', hideBox);

function RenderDeedDetails({user}) {
  return renderDeedDetails;

  function renderDeedDetails({deed, project}) {
    renderDetailInnards({
      parent: detailsBox,
      deed,
      project,
      user: user
    });
    detailsLayer.classed('destroyed', false);
  }
}

function hideBox() {
  detailsLayer.classed('destroyed', true);
}

module.exports = RenderDeedDetails;
