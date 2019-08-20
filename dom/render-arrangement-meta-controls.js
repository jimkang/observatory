var d3 = require('d3-selection');
require('d3-transition');

const controlFadeDuration = 1000;

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
    showButton.classed('hidden', false);
    arrangementControls
      .transition()
      .duration(controlFadeDuration)
      .style('opacity', 0)
      .style('height', 0)
      .on('end', hideControls);
  }

  function hideControls() {
    arrangementControls.classed('hidden', true);
    // Get it ready to show later.
    arrangementControls.node().removeAttribute('style');
  }
}

module.exports = renderArrangementMetaControls;
