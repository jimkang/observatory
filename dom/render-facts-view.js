var d3 = require('d3-selection');
var accessor = require('accessor')();
var GetPropertySafely = require('get-property-safely');
var EaseThrottle = require('../ease-throttle');
var formatProjectIntoActivitySortGroup = require('../format-project-into-activity-group');

var deedContainer = d3.select('#deedsort-container');
// var deedBoard = d3.select('#deed-board');
var deedGroupRoot = d3.select('#deedsort-container .deed-groups');

function RenderFactsView({ user }) {
  return EaseThrottle({ fn: renderFactsView });

  function renderFactsView({ projectData }) {
    d3.selectAll('.view-root:not(#deedsort-container)').classed('hidden', true);
    deedContainer.classed('hidden', false);
    // TODO: We don't need to format in this complex a way.
    var deedData = projectData.map(formatProjectIntoActivitySortGroup);
    // TODO: Actually sort.
    if (deedData[0].activities) {
      var deedGroups = deedGroupRoot
        .selectAll('.deed-group')
        .data(deedData, accessor());

      deedGroups.exit().remove();

      // console.log('deedGroups.enter().size()', deedGroups.enter().size())
      var newGroups = deedGroups
        .enter()
        .append('rect')
        .classed('deed-group', true);
      newGroups.attr('height', 40);

      var groupsToUpdate = newGroups.merge(deedGroups);
      // console.log('groupsToUpdate size', groupsToUpdate.size())
      groupsToUpdate
        .attr(
          'width',
          group => 20 * (group.activities ? group.activities.length : 0)
        )
        .attr('y', (group, i) => 40 * i);
    }
    // deedGroups.selectAll('.deed-group').data()
  }
}

module.exports = RenderFactsView;
