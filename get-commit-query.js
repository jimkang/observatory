var randomId = require('idmaker').randomId;

const nonAlphanumericRegex = /[^\w]/g;

function getCommitQuery(repoNames, lastCursorsForRepos, userEmail) {
  return `{
    viewer {
      ${repoNames.map(getRepoCommitSubquery).join('\n')}
    }
  }

  fragment CommitHistoryFields on CommitHistoryConnection {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        abbreviatedOid
        message
        committedDate
      }
    }
  }`;

  function getRepoCommitSubquery(repoName) {
    var afterSegment = '';
    if (lastCursorsForRepos[repoName]) {
      afterSegment = `, after: "${lastCursorsForRepos[repoName]}"`;
    }

    return `${randomId(4)}_${sanitizeAsGQLId(repoName)}: repository(name: "${repoName}") {
      defaultBranchRef {
        id
        repository {
          name
        }
        target {
          ... on Commit {
            id
            history(author: {emails: "${userEmail}"}, first: 20${afterSegment}) {
              ...CommitHistoryFields
            }
          }
        }
      }
    }`;
  }
}

function sanitizeAsGQLId(s) {
  return s.replace(nonAlphanumericRegex, '');
}

module.exports = getCommitQuery;
