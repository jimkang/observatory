var messageField = document.getElementById('progress-message');

function renderLoadProgress({ deedCount, projectCount, active }) {
  messageField.textContent = `Gathered ${projectCount} projects and ${deedCount} deeds.`;
  if (active) {
    messageField.classList.add('active');
  } else {
    messageField.classList.remove('active');
  }
}

module.exports = renderLoadProgress;
