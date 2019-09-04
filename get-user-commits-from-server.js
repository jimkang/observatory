var ndjson = require('ndjson');

function getUserCommitsFromServer(
  { request, onRepo, onCommit, commitSourceURL },
  done
) {
  var ndjsonParsingStream = ndjson.parse();
  ndjsonParsingStream.on('data', emitObject);
  ndjsonParsingStream.on('error', done);

  var reqOpts = {
    url: commitSourceURL,
    method: 'GET',
    onData: writeToStream
  };
  request(reqOpts, done);

  function writeToStream(text) {
    ndjsonParsingStream.write(text);
  }

  function emitObject(obj) {
    if (obj.abbreviatedOid) {
      onCommit(obj);
    } else {
      onRepo(obj);
    }
  }
}

module.exports = getUserCommitsFromServer;
