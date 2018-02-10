var d3 = require('d3-selection');
var accessor = require('accessor');
var GetPropertySafely = require('get-property-safely');
var EaseThrottle = require('../ease-throttle');
var formatProjectIntoActivityGroup = require('../format-project-into-activity-group');

var activityContainer = d3.select('#activity-container');
// var activityBoard = d3.select('#activity-board');
var activityGroupRoot = d3.select('#activity-groups');

function RenderActivityView({ user }) {
  return EaseThrottle({ fn: renderActivityView });

  function renderActivityView({ projectData }) {
    d3.selectAll('.view-root:not(#activity-container)').classed('hidden', true);
    activityContainer.classed('hidden', false);
    var activityData = projectData.map(formatProjectIntoActivityGroup);
    if (activityData[0].activities) {
      var activityGroups = activityGroupRoot
        .selectAll('.activity-group')
        .data(activityData, accessor());

      activityGroups.exit().remove();

      // console.log('activityGroups.enter().size()', activityGroups.enter().size())
      var newGroups = activityGroups
        .enter()
        .append('rect')
        .classed('activity-group', true);
      newGroups.attr('height', 40);

      var groupsToUpdate = newGroups.merge(activityGroups);
      // console.log('groupsToUpdate size', groupsToUpdate.size())
      groupsToUpdate
        .attr(
          'width',
          group => 20 * (group.activities ? group.activities.length : 0)
        )
        .attr('y', (group, i) => 40 * i);
    }
    // activityGroups.selectAll('.activity-group').data()
  }
}

module.exports = RenderActivityView;
