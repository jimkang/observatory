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

// TODO: Draw activities in postion
  function renderActivityView({ projectData }) {
    d3.selectAll('.view-root:not(#activity-container)').classed('hidden', true);
    activityContainer.classed('hidden', false);
    var activityGroupData = [];
    var earliestActivityDate;
    var latestActivityDate;

    for (var i = 0; i < projectData.length; ++i) {
      let ag = formatProjectIntoActivityGroup(projectData[i]);
      activityGroupData.push(ag);
      if (ag.startDate) {
        if (!earliestActivityDate) {
          earliestActivityDate = ag.startDate;
        } else if (ag.startDate < earliestActivityDate) {
          earliestActivityDate = ag.startDate;
        }
      }
      if (ag.lastActiveDate) {
        if (!latestActivityDate) {
          latestActivityDate = ag.lastActiveDate;
        } else if (ag.lastActiveDate > latestActivityDate) {
          latestActivityDate = ag.lastActiveDate;
        }
      }
    }
    console.log('earliestActivityDate', earliestActivityDate);
    console.log('latestActivityDate', latestActivityDate);
    // TODO: Use these dates to determine the x scale.
    // One day should at least be some amount of pixels. 20?

    if (activityGroupData[0].activities) {
      var activityGroups = activityGroupRoot
        .selectAll('.activity-group')
        .data(activityGroupData, accessor());

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
