var d3 = require('d3-selection');
var accessor = require('accessor')();
var EaseThrottle = require('../ease-throttle');
var arrangeProjectDataByYear = require('../arrange-project-data-by-year');
var filterProjects = require('../filter-projects');
var mergeYearKits = require('../merge-year-kits');
var findWhere = require('lodash.findwhere');
var getCriteriaForNames = require('../get-criteria-for-names');
var listParser = require('../route-list-parser');
var renderArrangementControls = require('./render-arrangement-controls');
var renderArrangementMetaControls = require('./render-arrangement-meta-controls');

var yearContainer = d3.select('#year-container');
var yearsRoot = d3.select('#years-root');

var displayNamesForSort = {
  startDate: 'Started',
  shippedDate: 'Shipped',
  lastGrownDate: 'Grown*',
  lastTendedDate: 'Tended**'
};

function RenderYearView({ onDeedClick, onCriteriaControlChange }) {
  return EaseThrottle({ fn: renderYearView });

  function renderYearView({ projectData, filterCriteriaNames }) {
    d3.selectAll('.view-root:not(#year-container)').classed('hidden', true);
    yearContainer.classed('hidden', false);

    renderArrangementMetaControls({
      outerContainerSelector: '#year-container .arrangement-controls-container'
    });
    renderArrangementControls({
      containerSelector: '#year-container .arrangement-controls',
      selectedCriteriaNames: filterCriteriaNames,
      onCriteriaControlChange
    });

    var filtered = filterProjects({
      projectData,
      filterCriteria: getCriteriaForNames(listParser.parse(filterCriteriaNames))
    });

    var yearKits = mergeYearKits({
      startDate: arrangeProjectDataByYear({
        projectData: filtered,
        sortBy: 'startDate'
      }),
      shippedDate: arrangeProjectDataByYear({
        projectData: filtered,
        sortBy: 'shippedDate'
      }),
      lastGrownDate: arrangeProjectDataByYear({
        projectData: filtered,
        sortBy: 'lastGrownDate'
      }),
      lastTendedDate: arrangeProjectDataByYear({
        projectData: filtered,
        sortBy: 'lastTendedDate'
      })
    });
    yearKits.forEach(addPlaceHolderMonthSortSectionsToYearKit);
    //console.log('yearKits', yearKits);

    var years = yearsRoot.selectAll('.year').data(yearKits);
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
  return `${displayNamesForSort[d.sort]} (${d.projects.length})`;
}

function aIsLaterThanB(a, b) {
  return new Date(a.committedDate) > new Date(b.committedDate) ? -1 : 1;
}

function getClassesForMonthSortSection(d) {
  return `month-sort-section ${d.sort}`;
}

function addPlaceHolderMonthSortSectionsToYearKit(yearKit) {
  yearKit.monthKits.forEach(addPlaceHolderMonthSortSectionsToMonthKit);
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

module.exports = RenderYearView;
