var d3 = require('d3-selection');
var renderDetailInnards = require('./render-detail-innards');

function RenderDeedDetails({ user, detailsLayerSelector = '.details-layer' }) {
  // Pre-rendering prep with static elements.
  var detailsLayer = d3.select(detailsLayerSelector);
  var detailsBox = detailsLayer.select('.details-box');
  if (detailsBox.empty()) {
    detailsBox = createDetailsBox(detailsLayer);
  }
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

function createDetailsBox(layer) {
  var template = document.getElementById('details-box-template');
  var inst = document.importNode(template.content, true);
  layer.node().appendChild(inst);
  return layer.select('.details-box');
}

module.exports = RenderDeedDetails;
