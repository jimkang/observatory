var d3 = require('d3-selection');
var callNextTick = require('call-next-tick');

function renderArrangementMetaControls({
  outerContainerSelector,
  hide = false
}) {
  var outerContainer = d3.select(outerContainerSelector);
  var arrangementControls = outerContainer.select('.arrangement-controls');
  var showButton = outerContainer.select('.show-arrangement-controls-button');
  var hideButton = arrangementControls.select(
    '.hide-arrangement-controls-button'
  );

  arrangementControls.classed('hidden', hide);

  showButton.on('click.show', onClickShow);
  showButton.classed('hidden', !hide);

  hideButton.on('click.hide', onClickHide);

  function onClickShow() {
    callNextTick(renderArrangementMetaControls, {
      outerContainerSelector,
      hide: false
    });
  }

  function onClickHide() {
    callNextTick(renderArrangementMetaControls, {
      outerContainerSelector,
      hide: true
    });
  }
}

module.exports = renderArrangementMetaControls;
