var d3 = require('d3-selection');
var accessor = require('accessor')();

var polyptychContainer = d3.select('#polyptych-container');
var polyptychRoot = d3.select('#polyptych-root');

function RenderPolyptych() {
  return renderPolyptych;

  function renderPolyptych({ projectData }) {
    d3.selectAll('.view-root:not(#polyptych-container)').classed(
      'hidden',
      true
    );
    polyptychContainer.classed('hidden', false);

    var tychs = polyptychRoot.selectAll('.tych').data(projectData, accessor());
    tychs.exit().remove();
    var newTychs = tychs
      .enter()
      .append('div')
      .classed('tych', true);
    var currentTychs = newTychs.merge(tychs);
    currentTychs.text(accessor('name'));
  }
}

module.exports = RenderPolyptych;
