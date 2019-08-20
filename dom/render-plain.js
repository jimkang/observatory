var d3 = require('d3-selection');
var accessor = require('accessor')();
var GetPropertySafely = require('get-property-safely');
var renderDetailInnards = require('./render-detail-innards');
var comparators = require('../comparators');

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

function RenderPlain({ user }) {
  return renderPlain;

  function renderPlain({ projectData }) {
    projectData.sort(comparators.compareLastUpdatedDesc);
    var projects = basicProjectListRoot
      .selectAll('.project')
      .data(projectData, accessor());
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
    return `https://github.com/${user}/${deed.projectName}/commit/${deed.abbreviatedOid}`;
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
