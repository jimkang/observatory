var getCommitQuery = require('./get-commit-query');
var sb = require('standard-bail')();
var isAGitHubRateLimitErrorMessage = require('./is-a-github-rate-limit-error-message');
var callNextTick = require('call-next-tick');
var pathExists = require('object-path-exists');
var getGQLReqOpts = require('./get-gql-req-opts');
var pluck = require('lodash.pluck');
var curry = require('lodash.curry');

function GetCommitsForRepos({
    baseURL = 'https://api.github.com',
    token,
    userEmail,
    request,
    userAgent
  }) {

  const apiURL = baseURL + '/graphql';
  return getCommitsForRepos;

  function getCommitsForRepos(
    {
      repoNames,
      onCommitsForRepo,
      onNonFatalError
      // TODO: start and end dates.
    },
    done) {

    var reposThatHaveCommitsToGet = repoNames.slice();
    var lastCursorsForRepos = {};
    postNextQuery();

    function postNextQuery() {
      var query = getCommitQuery(
        reposThatHaveCommitsToGet, lastCursorsForRepos, userEmail
      );
      // console.log('query', query);
      request(
        getGQLReqOpts({apiURL: apiURL, token: token, userAgent: userAgent, query: query}),
        sb(handleCommitResponse, done)
      );
    }

    function handleCommitResponse(res, body, done) {
      if (!body) {
        passNonFatalError(new Error('Empty body received from commit reqeust.'));
      }
      else if (body.errors) {
        if (body.errors.some(isAGitHubRateLimitErrorMessage)) {
          // No point in continuing.
          callNextTick(done, new Error('Rate limit error'));
          return;
        }
        passNonFatalError(new Error(JSON.stringify(body.errors, null, 2)));
      }
      else if (!pathExists(body, ['data', 'viewer'])) {
        passNonFatalError(
          new Error('Could not get data/viewer from commit query response body.')
        );
      }
      else {
        extractCommitsFromQueryResult(
          body.data.viewer, lastCursorsForRepos, onCommitsForRepo
        );
      }
      
      if (Object.keys(lastCursorsForRepos).length > 0) {
        callNextTick(postNextQuery);
      }
      else {
        callNextTick(done);
      }
    }

    function passNonFatalError(error) {
      if (onNonFatalError) {
        onNonFatalError(error);
      }
    }
  }
}

function extractCommitsFromQueryResult(
  viewer, lastCursorsForRepos, onCommitsForRepo) {

  for (var queryId in viewer) {
    let queryResult = viewer[queryId];
    if (queryResult) {
      let repoName = queryResult.defaultBranchRef.repository.name;
      let pageInfo = queryResult.defaultBranchRef.target.history.pageInfo;
      if (pageInfo.hasNextPage) {
        lastCursorsForRepos[repoName] = pageInfo.endCursor;
      }
      else {
        delete lastCursorsForRepos[repoName];
      }

      let commits = pluck(queryResult.defaultBranchRef.target.history.edges, 'node')
      commits.forEach(curry(appendRepoNameToCommit)(repoName));
      onCommitsForRepo(repoName, commits);
    }
  }
}

function appendRepoNameToCommit(name, commit) {
  commit.repoName = name;
}

module.exports = GetCommitsForRepos;
