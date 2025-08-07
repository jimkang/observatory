var d3 = require('d3-selection');
var accessor = require('accessor');
var { compareDescForPortfolio } = require('../comparators');
var curry = require('lodash.curry');
var Crown = require('csscrown');
var getGardenColorForProject = require('./get-garden-color-for-project');
var { hsl } = require('d3-color');

var crown = Crown({
  crownClass: 'selected-tych',
});

var portfolioContainer = d3.select('#portfolio-container');
var portfolioRoot = d3.select('#portfolio-root');

function RenderPortfolio() {
  return renderPortfolio;

  function renderPortfolio({ projectData }) {
    projectData.sort(compareDescForPortfolio);

    d3.selectAll('.view-root:not(#portfolio-container)').classed(
      'hidden',
      true
    );
    portfolioContainer.classed('hidden', false);

    var tychs = portfolioRoot.selectAll('.tych').data(projectData, accessor());
    tychs.exit().remove();
    var newTychs = tychs
      .enter()
      .append('div')
      .classed('tych', true)
      .classed('centered-col', true)
      .on('click', focusOnTych);

    newTychs
      .append('div')
      .classed('title', true)
      .append('a')
      .classed('title-link', true)
      .attr('target', '_blank');
    newTychs
      .append('a')
      .classed('project-window-link', true)
      .attr('target', '_blank')
      .append('img')
      .classed('project-window', true);
    newTychs.append('div').classed('description', true);
    newTychs.append('ul').classed('links-root', true);
    var newStats = newTychs.append('ul').classed('stats', true);
    appendItemWithLabelAndValue({
      parentSel: newStats,
      className: 'last-updated-date',
      label: 'Last updated',
    });
    appendItemWithLabelAndValue({
      parentSel: newStats,
      className: 'shipped-date',
      label: 'Date shipped',
    });
    appendItemWithLabelAndValue({
      parentSel: newStats,
      className: 'start-date',
      label: 'Date started',
    });
    appendItemWithLabelAndValue({
      parentSel: newStats,
      className: 'project-age',
      label: 'Project age',
    });
    appendItemWithLabelAndValue({
      parentSel: newStats,
      className: 'activity-count',
      label: 'Activity count',
    });

    var currentTychs = newTychs.merge(tychs);
    currentTychs.attr('class', getClassStringForTych);
    currentTychs
      .select('.title-link')
      .text(accessor('name'))
      .attr('href', getMainLinkHref)
      .style('text-decoration-color', getGardenColorForProject);
    currentTychs.select('.project-window-link').attr('href', getMainLinkHref);
    var projectWindows = currentTychs.select('.project-window');
    projectWindows.classed('hidden', doesNotHaveProfileImage);
    projectWindows.attr('src', accessor('profileImage'));
    currentTychs.select('.description').html(accessor('description'));

    var linksRoots = currentTychs.selectAll('.links-root');

    var linkItems = linksRoots.selectAll('li').data(getLinks, accessor('0'));
    linkItems.exit().remove();
    var newLinkItems = linkItems.enter().append('li');
    newLinkItems.append('a');
    newLinkItems
      .merge(linkItems)
      .select('a')
      .attr('href', accessor('0'))
      .attr('target', '_blank')
      .text(accessor('1'));

    // Consider pre-currying these, if there's any noticeable
    // performance impact.
    currentTychs
      .select('.start-date .value')
      .text(curry(getReadableDate)('startDate'));
    currentTychs
      .select('.shipped-date .value')
      .text(curry(getReadableDate)('shippedDate'));
    currentTychs
      .select('.last-updated-date .value')
      .text(curry(getReadableDate)('lastActiveDate'));
    currentTychs
      .select('.project-age .value')
      .text(accessor('activitySpanInDays'));
    currentTychs
      .select('.activity-count .value')
      .text(accessor({ path: 'activities/length' }));

    currentTychs.style('border-color', getGardenColorForProject);
    currentTychs.style('scrollbar-color', getColorsForScrollBar);

    function getClassStringForTych(project) {
      var classString = 'tych centered-col ';
      if (project.featuredStatus === 'featured') {
        classString += ' featured';
      }

      return classString;
    }
  }
}

function getMainLinkHref(project) {
  var links = getLinks(project);
  if (links.length > 0) {
    return links[0][0];
  }
  return '';
}

function doesNotHaveProfileImage(project) {
  return !project.profileImage;
}

function focusOnTych(project) {
  // Don't do anything when links within the tych are clicked.
  if (d3.event.target.tagName === 'A') {
    return;
  }

  var currentlySelectedTych = d3.select('.selected-tych');
  if (!currentlySelectedTych.empty()) {
    let currentlySelectedProject = currentlySelectedTych.datum();
    if (currentlySelectedProject.id === project.id) {
      this.classList.remove('selected-tych');
      this.scrollIntoView({ behavior: 'smooth' });
      return;
    }
  }

  // Give the selected-tych class to this element.
  crown(this);
  this.scrollIntoView({ behavior: 'smooth' });
}

function getLinks(project) {
  return getLinkArraySafely(project.links).concat(
    getLinkArraySafely(project.sources)
  );
}

function getLinkArraySafely(linkArray) {
  if (linkArray && Array.isArray(linkArray)) {
    if (linkArray.length < 1) {
      return [];
    }
    // If the project does have links, each link
    // should be an array. Starting with just
    // checking the first one.
    if (Array.isArray(linkArray[0])) {
      return linkArray;
    }
  }
  return [];
}

function appendItemWithLabelAndValue({ parentSel, className, label }) {
  var item = parentSel.append('li').classed(className, true);
  item
    .append('span')
    .classed('label', true)
    .text(label + ': ');
  item.append('span').classed('value', true);
}

function getReadableDate(prop, project) {
  if (project[prop]) {
    return project[prop].toLocaleDateString();
  }
  return 'Never';
}

function getColorsForScrollBar(project) {
  var baseColor = hsl(getGardenColorForProject(project));
  baseColor.opacity = 0.4;
  var thumbColor = baseColor.copy();
  thumbColor.s += 0.2;
  thumbColor.opacity = 0.4;
  var trackColor = baseColor.darker(1);
  trackColor.opacity = 0.25;
  return thumbColor.formatHsl() + ' ' + trackColor.formatHsl();
}

module.exports = RenderPortfolio;
