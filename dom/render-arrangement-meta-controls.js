var d3 = require('d3-selection');

function renderArrangementMetaControls({
  outerContainerSelector,
  showControls,
  onShowControls,
  onHideControls
}) {
  var outerContainer = d3.select(outerContainerSelector);
  var arrangementControls = outerContainer.select('.arrangement-controls');
  var showButton = outerContainer.select('.show-arrangement-controls-button');
  var hideButton = arrangementControls.select(
    '.hide-arrangement-controls-button'
  );

  showButton.on('click.show', onShowControls);
  hideButton.on('click.hide', onHideControls);

  if (showControls) {
    arrangementControls.classed('hidden', false);
    showButton.classed('hidden', true);
  } else {
    arrangementControls.classed('hidden', true);
    showButton.classed('hidden', false);
  }
}

module.exports = renderArrangementMetaControls;
