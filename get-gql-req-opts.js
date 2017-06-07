function getGQLReqOpts({apiURL, token, userAgent, query}) {
  return {
    method: 'POST',
    url: apiURL,
    headers: {
      Authorization: 'Bearer ' + token,
      'User-Agent': userAgent
    },
    body: {
      query: query
    },
    json: true
  };
}

module.exports = getGQLReqOpts;
