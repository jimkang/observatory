var d3 = require('d3-selection');
var accessor = require('accessor')();
var EaseThrottle = require('../ease-throttle');
var decorateProject = require('../decorate-project');
var arrangeProjectDataByYear = require('../arrange-project-data-by-year');

var yearContainer = d3.select('#year-container');
var yearsRoot = d3.select('#years-root');

function RenderYearView({ user }) {
  return EaseThrottle({ fn: renderYearView });

  function renderYearView({ projectData }) {
    d3.selectAll('.view-root:not(#year-container)').classed('hidden', true);
    yearContainer.classed('hidden', false);
    projectData.forEach(decorateProject);
    var yearKits = arrangeProjectDataByYear({ projectData });
    console.log('yearKits', yearKits);

    var years = yearsRoot.selectAll('year').data(yearKits, accessor('year'));
    years.exit().remove();
    var newYears = years
      .enter()
      .append('div')
      .classed('year', true);
    newYears.append('div').classed('year-title', true);
    newYears.append('div').classed('year-project-root', true);

    var yearsToUpdate = newYears.merge(years);

    yearsToUpdate.select('.year-title').text(accessor('year'));

    var projects = yearsToUpdate
      .selectAll('.year-project-root')
      .data(accessor('projects'));

    projects.exit().remove();
    var newProjects = projects
      .enter()
      .append('div')
      .classed('project', true);
    newProjects.append('div').classed('project-name', true);
    newProjects.append('div').classed('year-deed-root', true);

    var projectsToUpdate = newProjects.merge(projects);
    projectsToUpdate.select('.project-name').text(accessor('name'));
    // TODO: deeds under years?
    // Sort by different kinds of dates: Started, shipped, etc.
  }
}

module.exports = RenderYearView;
