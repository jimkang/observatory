var d3 = require('d3-selection');

function switchViewRoot(viewId) {
  var containerId = viewId + '-container';
  d3.selectAll('.view-root:not(#' + containerId + ')').classed('hidden', true);
  d3.select('#' + containerId).classed('hidden', false);
}

module.exports = switchViewRoot;
