var d3 = require('d3-selection');
var accessor = require('accessor');
var GetPropertySafely = require('get-property-safely');
var hierarchy = require('d3-hierarchy');
var scale = require('d3-scale');
var d3Format = require('d3-format');
// var d3Color = require('d3-color');
var interpolate = require('d3-interpolate');

var idKey = accessor();
var nameKey = accessor('name');
var messageKey = accessor('message');
var deedsKey = GetPropertySafely('deeds', []);

var firstRender = true;

const width = 1000;
const height = 1000;
var fader = function(color) { return interpolate.interpolateRgb(color, "#fff")(0.2); };
var color = scale.scaleOrdinal(scale.schemeCategory20.map(fader));
var format = d3Format.format(',d');

var board = d3.select('#garden-board');
var treemap = hierarchy.treemap()
    .tile(hierarchy.treemapResquarify)
    .size([width, height])
    .round(true)
    .paddingInner(1);

function renderGarden({projectData}) {
  var rootData = {
    name: 'root',
    deeds: projectData
  };
  var root = hierarchy.hierarchy(rootData, deedsKey)
      // .eachBefore(function(d) {
      //   d.data.id = (d.parent ? d.parent.data.id + '.' : '') + d.data.name; 
      // })
      .sum(sumBySize)
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

  if (firstRender) {
    hierarchy.treemap()
      .tile(hierarchy.treemapSquarify)
      .size([width, height])
      .round(true)
      .paddingInner(1)
      (root);
    firstRender = true;
  }
  else {
    treemap(root);
  }

  var cells = board.selectAll('g')
    .data(root.leaves())
    .enter().append('g')
      .attr('transform', function(d) { return 'translate(' + d.x0 + ',' + d.y0 + ')'; });

  cells.append('rect')
      .attr('id', function(d) { return d.data.id; })
      .attr('width', function(d) { return d.x1 - d.x0; })
      .attr('height', function(d) { return d.y1 - d.y0; })
      .attr('fill', function(d) { return color(d.parent.data.id); });

  cells.append('clipPath')
      .attr('id', function(d) { return 'clip-' + d.data.id; })
    .append('use')
      .attr('xlink:href', function(d) { return '#' + d.data.id; });

  cells.append('text')
      .attr('clip-path', function(d) { return 'url(#clip-' + d.data.id + ')'; })
    .selectAll('tspan')
      .data(function(d) {
        return (d.data.name || d.data.message).split(/(?=[A-Z][^A-Z])/g);
      })
    .enter().append('tspan')
      .attr('x', 4)
      .attr('y', function(d, i) { return 13 + i * 10; })
      .text(function(d) { return d; });

  cells.append('title')
      .text(function(d) { return d.data.id + '\n' + format(d.value); });

  // var projects = board.selectAll('.project').data(projectData, idKey);
  // // projects.exit().remove();
  // var newProjects = projects.enter().append('g').classed('project', true);
  // newProjects.append('div').classed('project-name', true);
  // newProjects.append('ul').classed('deeds-root', true);
  // var allProjects = newProjects.merge(projects);
  // allProjects.select('.project-name').text(nameKey);

  // var deedsRoot = allProjects.select('.deeds-root');
  // var deeds = deedsRoot.selectAll('.deed').data(deedsKey, idKey);
  // // deeds.exit().remove();
  // var newDeeds = deeds.enter().append('li').classed('deed', true);
  // newDeeds.append('div').classed('deed-name', true);
  // var allDeeds = newDeeds.merge(deeds);
  // allDeeds.select('.deed-name').text(messageKey);
}

// function sumByCount(d) {
//   return d.deeds ? 0 : 1;
// }

function sumBySize(d) {
  if (d.deeds) {
    return d.deeds.length * 10;
  }
  else {
    return 10;
  }
}

module.exports = renderGarden;
