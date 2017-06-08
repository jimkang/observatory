var randomId = require('idmaker').randomId;

const nonAlphanumericRegex = /[^\w]/g;

// repos are objects with a `name` and optional `since` , `until`, and `lastCursor` properties.
function getCommitQuery(repos, userEmail) {
  return `{
    viewer {
      ${repos.map(getRepoCommitSubquery).join('\n')}
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

  function getRepoCommitSubquery(repo) {
    var afterSegment = '';
    if (repo.lastCursor) {
      afterSegment = `, after: "${repo.lastCursor}"`;
    }
    var sinceClause = '';
    var untilClause = '';

    if (repo.since) {
      sinceClause = ` since: "${repo.since}"`;
    }
    if (repo.until) {
      untilClause = ` until: "${repo.until}"`;
    }

    return `${randomId(4)}_${sanitizeAsGQLId(repo.name)}: repository(name: "${repo.name}") {
      defaultBranchRef {
        id
        repository {
          name
        }
        target {
          ... on Commit {
            id
            history(author: {emails: "${userEmail}"}, first: 20${afterSegment}${sinceClause}${untilClause}) {
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
