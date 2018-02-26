var d3 = require('d3-selection');
var accessor = require('accessor');
var GetPropertySafely = require('get-property-safely');
var EaseThrottle = require('../ease-throttle');
var formatProjectIntoActivityGroup = require('../format-project-into-activity-group');
var scale = require('d3-scale');

const groupHeight = 40;
const dayInMS = 24 * 60 * 60 * 1000;
var activityContainer = d3.select('#activity-container');
var activityBoard = d3.select('#activity-board');
var activityGroupRoot = d3.select('#activity-groups');

function RenderActivityView({ user }) {
  return EaseThrottle({ fn: renderActivityView });

  // TODO: Draw activities in postion
  function renderActivityView({ projectData }) {
    d3.selectAll('.view-root:not(#activity-container)').classed('hidden', true);
    activityContainer.classed('hidden', false);

    var earliestActivityDate;
    var latestActivityDate;

    var activityGroupData = projectData
      .filter(hasDeeds)
      .map(formatProjectIntoActivityGroup);

    if (!activityGroupData || activityGroupData.length < 1) {
      return;
    }

    activityGroupData.forEach(updateSpanDates);
    if (!earliestActivityDate || !latestActivityDate) {
      return;
    }

    var totalDaysSpan =
      (latestActivityDate.getTime() - earliestActivityDate.getTime()) / dayInMS;
    console.log('totalDateSpan', totalDaysSpan);
    // TODO: Display totalDateSpan somewhere.
    
    activityBoard.attr('height', activityGroupData.length * groupHeight);

    var timeScale = scale
      .scaleTime()
      .domain([earliestActivityDate, latestActivityDate])
      .range([0, 960]);

    var activityGroups = activityGroupRoot
      .selectAll('.activity-group')
      .data(activityGroupData, accessor());

    activityGroups.exit().remove();

    // console.log('activityGroups.enter().size()', activityGroups.enter().size())
    var newGroups = activityGroups
      .enter()
      .append('g')
      .classed('activity-group', true);

    var groupsToUpdate = newGroups.merge(activityGroups);
    // console.log('groupsToUpdate size', groupsToUpdate.size())
    groupsToUpdate
      // .attr(
      //   'width',
      //   group => 20 * (group.activities ? group.activities.length : 0)
      // )
      .attr('transform', (group, i) => `translate(0, ${groupHeight * i})`);

    var activities = groupsToUpdate
      .selectAll('.activity')
      .data(accessor('activities'), accessor());

    activities.exit().remove();
    var newActivities = activities
      .enter()
      .append('rect')
      .classed('activity', true);
    newActivities
      .attr('fill', 'blue')
      .attr('width', 20)
      .attr('height', 20);
    var activitiesToUpdate = newActivities.merge(activities);
    // activitiesToUpdate.attr('x', timeScale(accessor('committedDate')));
    activitiesToUpdate.attr('x', getActivityX);

    function updateSpanDates(group) {
      if (group.startDate) {
        if (!earliestActivityDate) {
          earliestActivityDate = group.startDate;
        } else if (group.startDate < earliestActivityDate) {
          earliestActivityDate = group.startDate;
        }
      }
      if (group.lastActiveDate) {
        if (!latestActivityDate) {
          latestActivityDate = group.lastActiveDate;
        } else if (group.lastActiveDate > latestActivityDate) {
          latestActivityDate = group.lastActiveDate;
        }
      }
    }

    function getActivityX(d) {
      return timeScale(d.committedDate);
    }
  }
}

function hasDeeds(project) {
  return project && project.deeds && project.deeds.length > 0;
}

module.exports = RenderActivityView;
