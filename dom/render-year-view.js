var d3 = require('d3-selection');
var accessor = require('accessor')();
var EaseThrottle = require('../ease-throttle');
var decorateProject = require('../decorate-project');
var arrangeProjectDataByYear = require('../arrange-project-data-by-year');
var mergeYearKits = require('../merge-year-kits');

var yearContainer = d3.select('#year-container');
var yearsRoot = d3.select('#years-root');

var displayNamesForSort = {
  startDate: 'Started',
  lastActiveDate: 'Last Active'
};

function RenderYearView() {
  return EaseThrottle({ fn: renderYearView });

  function renderYearView({ projectData }) {
    d3.selectAll('.view-root:not(#year-container)').classed('hidden', true);
    yearContainer.classed('hidden', false);
    projectData.forEach(decorateProject);
    var yearKits = mergeYearKits({
      startDate: arrangeProjectDataByYear({ projectData, sortBy: 'startDate' }),
      lastActiveDate: arrangeProjectDataByYear({
        projectData,
        sortBy: 'lastActiveDate'
      })
    });
    console.log('yearKits', yearKits);

    var years = yearsRoot.selectAll('.year').data(yearKits, accessor('year'));
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
    newMonths.append('div').classed('month-sort-section-root', true);

    var monthsToUpdate = newMonths.merge(months);
    monthsToUpdate.select('.month-title').text(accessor('name'));

    var monthSortSections = monthsToUpdate
      .select('.month-sort-section-root')
      .selectAll('.month-sort-section')
      .data(accessor('projectsWithSort'), accessor('sort'));

    monthSortSections.exit().remove();
    var newMonthSortSections = monthSortSections
      .enter()
      .append('div')
      .classed('month-sort-section', true);
    newMonthSortSections.append('div').classed('month-sort-name', true);
    newMonthSortSections.append('div').classed('month-project-root', true);
    var monthSortSectionsToUpdate = newMonthSortSections.merge(
      monthSortSections
    );
    monthSortSectionsToUpdate
      .select('.month-sort-name')
      .text(getDisplayNameForSort);

    // Put projects under .month-project-root rather than directly under sort section.
    var projects = monthSortSectionsToUpdate
      .select('.month-project-root')
      .selectAll('.project')
      .data(accessor('projects'), accessor()); // Need to provide accessor so that things get properly removed/added.

    projects.exit().remove();
    var newProjects = projects
      .enter()
      .append('div')
      .classed('project', true);
    newProjects.append('div').classed('project-name', true);
    newProjects.append('div').classed('project-deed-root', true);

    var projectsToUpdate = newProjects.merge(projects);
    projectsToUpdate.select('.project-name').text(accessor('name'));
    // Sort by different kinds of dates: Started, shipped, etc.
  }
}

function getDisplayNameForSort(d) {
  return displayNamesForSort[d.sort];
}

module.exports = RenderYearView;
