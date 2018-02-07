var d3 = require('d3-selection');
var accessor = require('accessor');
var GetPropertySafely = require('get-property-safely');
var EaseThrottle = require('../ease-throttle');

var activityContainer = d3.select('#activity-container');
// var activityBoard = d3.select('#activity-board');
var activityGroups = d3.select('#activity-groups');

function RenderActivityView({ user }) {
  return EaseThrottle({ fn: renderActivityView });

  function renderActivityView({ projectData }) {
    d3.selectAll('.view-root:not(#activity-container)').classed('hidden', true);
    activityContainer.classed('hidden', false);
    if (projectData[0].deeds) {
      debugger;
    }
    // activityGroups.selectAll('.activity-group').data()
  }
}

module.exports = RenderActivityView;
