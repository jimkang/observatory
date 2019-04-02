var d3 = require('d3-selection');
var accessor = require('accessor')();
var GetPropertySafely = require('get-property-safely');
var EaseThrottle = require('../ease-throttle');
var renderDetailInnards = require('./render-detail-innards');
var comparators = require('../comparators');
var renderArrangementControls = require('./render-arrangement-controls');
var renderArrangementMetaControls = require('./render-arrangement-meta-controls');
var filterProjects = require('../filter-projects');
var listParser = require('../route-list-parser');
var getCriteriaForNames = require('../get-criteria-for-names');

const projectDetailsSkeleton = `<div class="project-details">
      <a class="name-link" target="_blank"></a>
      <div>Last updated: <span class="date last-active"></span></div>
      <div class="description"></div>
      <div class="show-deeds">Deeds</div>
    </div>
  </div>
`;

var idKey = accessor();
var messageKey = accessor('message');

var basicProjectListRoot = d3.select('#basic-project-list');

var deedsKey = GetPropertySafely('deeds', []);

function RenderPlain({ user, onCriteriaControlChange }) {
  return EaseThrottle({ fn: renderPlain });

  function renderPlain({ projectData, filterCriteriaNames }) {
    // Hide the controls if there aren't many projects.
    d3.select('#plain-container .arrangement-controls').classed(
      'hidden',
      projectData.length < 10
    );
    renderArrangementMetaControls({
      outerContainerSelector:
        '#plain-container .arrangement-controls-container',
      hide: false
    });
    renderArrangementControls({
      containerSelector: '#plain-container .arrangement-controls',
      selectedCriteriaNames: filterCriteriaNames,
      onCriteriaControlChange
    });

    var filtered = filterProjects({
      projectData,
      filterCriteria: getCriteriaForNames(listParser.parse(filterCriteriaNames))
    });

    filtered.sort(comparators.compareLastUpdatedDesc);
    var projects = basicProjectListRoot
      .selectAll('.project')
      .data(filtered, accessor());
    projects.exit().remove();
    var newProjects = projects
      .enter()
      .append('li')
      .classed('project', true);
    var projectDescriptions = newProjects
      .append('div')
      .classed('project-description', true)
      .on('click', toggleDeedList);
    projectDescriptions.html(projectDetailsSkeleton);

    newProjects
      .append('ul')
      .classed('deeds-root', true)
      .classed('hidden', true);

    var allProjects = newProjects.merge(projects);
    allProjects.each(callRenderInnards);

    var deedsRoot = allProjects.select('.deeds-root');
    var deeds = deedsRoot.selectAll('.deed').data(deedsKey, idKey);
    // deeds.exit().remove();
    var newDeeds = deeds
      .enter()
      .append('li')
      .classed('deed', true);
    newDeeds
      .append('a')
      .classed('deed-name', true)
      .attr('href', getDeedLinkFromDeed)
      .attr('target', '_blank');

    var allDeeds = newDeeds.merge(deeds);
    allDeeds.select('.deed-name').text(messageKey);

    function callRenderInnards(project) {
      renderDetailInnards({
        parent: d3.select(this).select('.project-description'),
        project,
        user
      });
    }
  }

  function getDeedLinkFromDeed(deed) {
    return `https://github.com/${user}/${deed.projectName}/commit/${
      deed.abbreviatedOid
    }`;
  }
}

function toggleDeedList() {
  var deedsRoot = d3.select(findProjectParent(this)).select('.deeds-root');
  deedsRoot.classed('hidden', !deedsRoot.classed('hidden'));
}

function findProjectParent(node) {
  var projectNode = node;
  while (!projectNode.classList.contains('project') && projectNode.parentNode) {
    projectNode = projectNode.parentNode;
  }
  return projectNode;
}

module.exports = RenderPlain;
