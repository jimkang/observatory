var d3 = require('d3-selection');
var accessor = require('accessor');
var GetPropertySafely = require('get-property-safely');
var EaseThrottle = require('../ease-throttle');

function RenderActivityView({ user }) {
  return EaseThrottle({ fn: renderActivityView });

  function renderActivityView({ projectData }) {
    d3.selectAll('.view-root:not(#activity-container)').classed('hidden', true);
    d3.select('#activity-container').classed('hidden', false);
  }
}

module.exports = RenderActivityView;
