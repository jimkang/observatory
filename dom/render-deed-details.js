var d3 = require('d3-selection');
var renderDetailInnards = require('./render-detail-innards');

function RenderDeedDetails({ user, detailsLayerSelector = '.details-layer' }) {
  // Pre-rendering prep with static elements.
  var detailsLayer = d3.select(detailsLayerSelector);
  var detailsBox = detailsLayer.select('.details-box');
  var closeButton = detailsBox.select('.close-button');

  closeButton.on('click', hideBox);

  return renderDeedDetails;

  function renderDeedDetails({ deed, project }) {
    renderDetailInnards({
      parent: detailsBox,
      deed,
      project,
      user
    });
    detailsLayer.classed('destroyed', false);
  }

  function hideBox() {
    detailsLayer.classed('destroyed', true);
  }
}

module.exports = RenderDeedDetails;
