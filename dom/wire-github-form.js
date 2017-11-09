var d3 = require('d3-selection');

var statusMessage = d3.select('#form-status-message');

function wireGitHubForm({ onFormSubmitted, username, userEmail }) {
  d3.select('#github-form-submit').on('click', onGithubFormSubmit);
  var usernameField = document.getElementById('github-username');
  var userEmailField = document.getElementById('github-user-email');

  if (username) {
    usernameField.value = username;
  }
  if (userEmail) {
    userEmailField.value = userEmail;
  }

  function onGithubFormSubmit() {
    if (!usernameField.checkValidity()) {
      statusMessage.text('Please enter a username.');
      statusMessage.classed('hidden', false);
      return;
    }

    if (!userEmailField.checkValidity()) {
      statusMessage.text('Please enter a proper email.');
      statusMessage.classed('hidden', false);
      return;
    }

    statusMessage.classed('hidden', true);

    onFormSubmitted({
      username: usernameField.value,
      userEmail: userEmailField.value
    });
  }
}

module.exports = wireGitHubForm;
