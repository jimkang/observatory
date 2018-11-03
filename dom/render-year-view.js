var d3 = require('d3-selection');
var accessor = require('accessor')();
var EaseThrottle = require('../ease-throttle');
var decorateProject = require('../decorate-project');
var arrangeProjectDataByYear = require('../arrange-project-data-by-year');
var mergeYearKits = require('../merge-year-kits');

var yearContainer = d3.select('#year-container');
var yearsRoot = d3.select('#years-root');

function RenderYearView() {
  return EaseThrottle({ fn: renderYearView });

  function renderYearView({ projectData }) {
    d3.selectAll('.view-root:not(#year-container)').classed('hidden', true);
    yearContainer.classed('hidden', false);
    projectData.forEach(decorateProject);
    var yearKits = mergeYearKits({
      startDate: arrangeProjectDataByYear({ projectData, sortBy: 'startDate' }),
      lastActiveDate: arrangeProjectDataByYear({ projectData, sortBy: 'lastActiveDate' })
    });
    console.log('example yearKits:', arrangeProjectDataByYear({ projectData, sortBy: 'startDate' }));
    console.log('yearKits', yearKits);
    return;

    var years = yearsRoot.selectAll('year').data(yearKits, accessor('year'));
    years.exit().remove();
    var newYears = years
      .enter()
      .append('div')
      .classed('year', true);
    newYears.append('div').classed('year-title', true);
    newYears.append('div').classed('month-root', true);

    var yearsToUpdate = newYears.merge(years);

    yearsToUpdate.select('.year-title').text(accessor('year'));

    // The select, then selectAll is here because we want to put months under month-root
    // rather than directly under year.
    var months = yearsToUpdate
      .select('.month-root')
      .selectAll('.month')
      .data(accessor('monthKits'), accessor('month'));

    months.exit().remove();
    var newMonths = months
      .enter()
      .append('div')
      .classed('month', true);
    newMonths.append('div').classed('month-title', true);
    newMonths.append('div').classed('month-project-root', true);

    var monthsToUpdate = newMonths.merge(months);
    monthsToUpdate.select('.month-title').text(accessor('name'));

    // Put projects under .month-project-root rather than directly under month.
    var projects = monthsToUpdate
      .select('.month-project-root')
      .selectAll('.project')
      .data(accessor('projects'));

    projects.exit().remove();
    var newProjects = projects
      .enter()
      .append('div')
      .classed('project', true);
    newProjects.append('div').classed('project-name', true);
    newProjects.append('div').classed('project-deed-root', true);

    var projectsToUpdate = newProjects.merge(projects);
    projectsToUpdate.select('.project-name').text(accessor('name'));
    // TODO: deeds under years?
    // Sort by different kinds of dates: Started, shipped, etc.
  }
}

module.exports = RenderYearView;
