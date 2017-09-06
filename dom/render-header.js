var d3 = require('d3-selection');

function renderHeader({currentUsername, activeView, changeView}) {
  d3.select('#current-user-label').text(currentUsername + '\'s');
  d3.selectAll('.view-button').on('click', onViewButtonClick);
  d3.selectAll('.view-button').classed('active-view-button', viewButtonIsActive);

  function viewButtonIsActive() {
    return this.dataset.viewname === activeView;
  }

  function onViewButtonClick() {
    changeView(this.dataset.viewname);
  }
}

module.exports = renderHeader;
