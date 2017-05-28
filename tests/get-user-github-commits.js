var test = require('tape');
var assertNoError = require('assert-no-error');
var request = require('request');
var config = require('../config');

var getUserGitHubCommits = require('../get-user-github-commits');

test('Get repos and commits', getUserGitHubCommitsTest);

function getUserGitHubCommitsTest(t) {
  var repoCount = 0;
  var commitCount = 0;

  var opts = {
    token: config.githubTestToken,
    username: 'jimkang',
    userEmail: 'jimkang@gmail.com',
    request: request,
    onRepo: checkRepo,
    onCommit: checkCommit,
    userAgent: 'observatory-tests'
  };

  getUserGitHubCommits(opts, checkFinalResults);

  function checkRepo(repo) {
    repoCount += 1;
    t.ok(repo.name, 'Repo has a name.');
    t.ok(repo.description, 'Repo has a description.');
    t.ok(repo.lastCheckedDate, 'Repo has a lastCheckedDate.');
  }

  function checkCommit(commit) {
    commitCount += 1;
    t.ok(commit.message, 'Commit has a message.');
    t.ok(commit.abbreviatedOid, 'Commit has an abbreviatedOid.');
    t.ok(commit.committedDate, 'Commit has a date.');
    t.ok(commit.repoName, 'Commit has a repoName');
  }

  function checkFinalResults(error, repos) {
    assertNoError(t.ok, error, 'No error while getting commits.');
    t.equal(
      repos.length,
      repoCount,
      'Final repo count same as the emitted repo count.'
    );
    t.equal(
      repos.reduce((count, repo) => count + repo.commits.length, 0),
      commitCount,
      'Final commit count is the same as the emitted commit count.'
    );
    console.log(JSON.stringify(repos, null, '  '));
    t.end();
  }
}
