var accessor = require('accessor')();
const groupLabelMaxScale = 4;

function renderGroupRulers({
  activityGroupData,
  graphWidth,
  ctx,
  currentTransform,
  baseGroupSpacing,
  fixedXRoot
}) {
  var groupSpacing = baseGroupSpacing * currentTransform.k;
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  activityGroupData.forEach(drawGroupRuler);
  ctx.stroke();

  var groupLabels = fixedXRoot
    .selectAll('text')
    .data(activityGroupData, accessor());
  groupLabels.exit().remove();
  groupLabels
    .enter()
    .append('text')
    .merge(groupLabels)
    .text(accessor('name'))
    .attr('transform', getGroupLabelTransform);

  function drawGroupRuler(g, i) {
    var y = getGroupStartY(g, i);
    ctx.moveTo(0, y);
    ctx.lineTo(graphWidth, y);
  }

  function getGroupStartY(g, i) {
    return currentTransform.applyY((i + 1) * groupSpacing);
  }

  function getGroupLabelTransform(g, i) {
    var scale = currentTransform.k;
    if (scale > groupLabelMaxScale) {
      scale = groupLabelMaxScale;
    }
    return `translate(0, ${getGroupStartY(g, i)}) scale(${scale})`;
  }
}

module.exports = renderGroupRulers;
