var d3 = require('d3-selection');
var accessor = require('accessor')();
var EaseThrottle = require('../ease-throttle');
var arrangeProjectDataByYear = require('../arrange-project-data-by-year');
var mergeYearKits = require('../merge-year-kits');
var findWhere = require('lodash.findwhere');

var descriptiveYearContainer = d3.select('#descriptive-container');
var descriptiveYearsRoot = d3.select('#descriptive-root');

var displayNamesForSort = {
  startDate: 'Started',
  shippedDate: 'Shipped',
  lastActiveDate: 'Last Active'
};

function RenderDescriptiveView({ onDeedClick }) {
  return EaseThrottle({ fn: renderDescriptiveView });

  function renderDescriptiveView({ projectData }) {
    d3.selectAll('.view-root:not(#descriptive-container)').classed(
      'hidden',
      true
    );
    descriptiveYearContainer.classed('hidden', false);

    var descriptiveYearKits = mergeYearKits({
      startDate: arrangeProjectDataByYear({ projectData, sortBy: 'startDate' }),
      shippedDate: arrangeProjectDataByYear({
        projectData,
        sortBy: 'shippedDate'
      }),
      lastActiveDate: arrangeProjectDataByYear({
        projectData,
        sortBy: 'lastActiveDate'
      })
    });
    descriptiveYearKits.forEach(addPlaceHolderMonthSortSectionsToYearKit);
    console.log('descriptiveYearKits', descriptiveYearKits);

    var descriptiveYears = descriptiveYearsRoot
      .selectAll('.descriptiveYear')
      .data(descriptiveYearKits, accessor('descriptiveYear'));
    descriptiveYears.exit().remove();

    var newYears = descriptiveYears
      .enter()
      .append('div')
      .classed('descriptiveYear', true);
    newYears.append('div').classed('descriptiveYear-title', true);
    newYears.append('div').classed('month-root', true);

    var descriptiveYearsToUpdate = newYears.merge(descriptiveYears);

    descriptiveYearsToUpdate
      .select('.descriptiveYear-title')
      .text(accessor('descriptiveYear'));

    // The select, then selectAll is here because we want to put months under month-root
    // rather than directly under descriptiveYear.
    var months = descriptiveYearsToUpdate
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
      .attr('class', getClassesForMonthSortSection)
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
    newProjects.on('click', onProjectClick);

    var projectsToUpdate = newProjects.merge(projects);
    projectsToUpdate.select('.project-name').text(accessor('name'));

    function onProjectClick(project) {
      onDeedClick({ project, deed: project.deeds.sort(aIsLaterThanB)[0] });
    }
  }
}

function getDisplayNameForSort(d) {
  return displayNamesForSort[d.sort];
}

function aIsLaterThanB(a, b) {
  return new Date(a.committedDate) > new Date(b.committedDate) ? -1 : 1;
}

function getClassesForMonthSortSection(d) {
  return `month-sort-section ${d.sort}`;
}

function addPlaceHolderMonthSortSectionsToYearKit(descriptiveYearKit) {
  descriptiveYearKit.monthKits.forEach(
    addPlaceHolderMonthSortSectionsToMonthKit
  );
}

function addPlaceHolderMonthSortSectionsToMonthKit(monthKit) {
  for (var sort in displayNamesForSort) {
    if (!findWhere(monthKit.projectsWithSort, { sort })) {
      monthKit.projectsWithSort.push({
        sort,
        projects: []
      });
    }
  }
}

module.exports = RenderDescriptiveView;
