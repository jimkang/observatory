var parse = require('no-throw-json-parse');

var lineWithEndRegex = /(.*\n)/;

function getUserCommitsFromServer(
  { request, onRepo, onCommit, commitSourceURL },
  done
) {
  var bufferString = '';

  var reqOpts = {
    url: commitSourceURL,
    method: 'GET',
    onData: writeToStream,
  };
  request(reqOpts, reqDone);

  function writeToStream(text) {
    bufferString += text;
    if (!bufferString.includes('\n')) {
      return;
    }
    let pieces = bufferString.split(lineWithEndRegex);
    for (let i = 0; i < pieces.length; ++i) {
      let piece = pieces[i];
      if (piece.length < 1) {
        continue;
      }

      if (piece.endsWith('\n')) {
        parseLine(piece);
      } else {
        bufferString = piece;
        break;
      }
    }
  }

  function emitObject(obj) {
    if (obj.abbreviatedOid) {
      onCommit(obj);
    } else {
      onRepo(obj);
    }
  }

  function parseLine(piece) {
    let parsed = parse(piece);
    if (parsed !== undefined) {
      emitObject(parsed);
    }
  }

  function reqDone(error) {
    if (error) {
      done(error);
      return;
    }

    if (bufferString.length > 0) {
      parseLine(bufferString);
    }

    done();
  }
}

module.exports = getUserCommitsFromServer;
