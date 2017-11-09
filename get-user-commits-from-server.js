var ndjson = require('ndjson');

function getUserCommitsFromServer(
  { request, onRepo, onCommit, onNonFatalError },
  done
) {
  var ndjsonParsingStream = ndjson.parse();
  ndjsonParsingStream.on('data', emitObject);

  var reqOpts = {
    url: 'http://107.170.58.24/observatory-cache/jimkang-cache.json',
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
