var d3 = require('d3-selection');
var accessor = require('accessor')();
var GetPropertySafely = require('get-property-safely');
var EaseThrottle = require('../ease-throttle');
var decorateProject = require('../decorate-project');
var arrangeProjectDataByYear = require('../arrange-project-data-by-year');

var deedContainer = d3.select('#year-container');
// var deedBoard = d3.select('#deed-board');
var deedGroupRoot = d3.select('#year-container .deed-groups');

function RenderYearView({ user }) {
  return EaseThrottle({ fn: renderYearView });

  function renderYearView({ projectData }) {
    d3.selectAll('.view-root:not(#year-container)').classed('hidden', true);
    deedContainer.classed('hidden', false);
    projectData.forEach(decorateProject);
    var yearKits = arrangeProjectDataByYear({ projectData });
    console.log('yearKits', yearKits);
  }
}

module.exports = RenderYearView;
