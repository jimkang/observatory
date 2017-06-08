var sb = require('standard-bail')();
var callNextTick = require('call-next-tick');
var findWhere = require('lodash.findwhere');
var pluck = require('lodash.pluck');
var defaults = require('lodash.defaults');
var splitArray = require('split-array');
var queue = require('d3-queue').queue;
var pathExists = require('object-path-exists');
var getCommitsForRepos = require('./get-commits-for-repos');
var isAGitHubRateLimitErrorMessage = require('./is-a-github-rate-limit-error-message');
var getGQLReqOpts = request('./get-gql-req-opts');

function getUserGitHubCommits(
  {
    token,
    username,
    userEmail,
    request,
    onRepo,
    onCommit,
    onNonFatalError,
    userAgent,
    shouldIncludeRepo
  },
  allDone) {

  var repos = [];

  getRepos(callGetCommits, passRepos);

  function callGetCommits() {
    var reposNewestToOldest = repos.sort(compareRepoDates);
    var repoNames = pluck(reposNewestToOldest, 'name');
    var repoGroups = splitArray(repoNames, 10);
    var q = queue(1);
    repoGroups.forEach(queueGet);

    q.awaitAll(passRepos);

    function queueGet(repoNameGroup) {
      q.defer(
        getCommitsForRepos,
        defaults({
          repoNames: repoNameGroup,
          onCommitsForRepo: collectCommits,
          token: token,
          userEmail: userEmail,
          request: request,
          onNonFatalError: onNonFatalError,
          userAgent: userAgent
        })
      );
    }
  }

  function passRepos(error) {
    callNextTick(allDone, error, repos);
  }

  function collectRepository(repo) {
    if (typeof shouldIncludeRepo !== 'function' || shouldIncludeRepo(repo)) {
      repo.lastCheckedDate = (new Date()).toISOString();
      repos.push(repo);
      if (onRepo) {
        onRepo(repo);
      }
    }
  }

  function collectCommits(repoName, edges) {
    var repo = findWhere(repos, {name: repoName});
    if (!repo.commits) {
      repo.commits = [];
    }

    edges.forEach(addCommit);

    function addCommit(edge) {
      edge.node.repoName = repoName;
      repo.commits.push(edge.node);
      if (onCommit) {
        onCommit(edge.node);
      }
    }
  }

  function getRepos(done) {
    var lastRepoCursor;
    postNextQuery();

    function postNextQuery() {
      request(
        getGQLReqOpts({
          apiURL: apiURL,
          token: token,
          userAgent: userAgent,
          query: query
        })
        sb(handleRepoResponse, done)
      );
    }

    function handleRepoResponse(res, body) {
      if (body.errors) {
        if (onNonFatalError) {
          onNonFatalError(new Error(JSON.stringify(body.errors, null, 2)));
        }
        if (body.errors.some(isAGitHubRateLimitErrorMessage)) {
          // No point in continuing
          done(new Error('Rate limit error'));
          return;
        }
      }
      else if (pathExists(body, ['data', 'user', 'repositories', 'nodes'])) {
        body.data.user.repositories.nodes.forEach(collectRepository);
      }

      if (pathExists(body, ['data', 'user', 'repositories', 'pageInfo']) &&
        body.data.user.repositories.pageInfo.hasNextPage) {

        lastRepoCursor = body.data.user.repositories.pageInfo.endCursor;
        callNextTick(postNextQuery);
      }
      else {
        callNextTick(done);
      }
    }
  }
}

function getRepoQuery(username, lastCursor) {
  var afterSegment = '';
  if (lastCursor) {
    afterSegment = `, after: "${lastCursor}"`;
  }
  return `{
    user(login: "${username}") {
      repositories(first: 100${afterSegment}) {
        nodes {
          name
          id
          pushedAt
          description
        },
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
      }
    }
  }`;
}

// Newer dates are to come earlier in the array.
function compareRepoDates(a, b) {
  return a.pushedAt > b.pushedAt ? -1 : 1;
}

module.exports = getUserGitHubCommits;
