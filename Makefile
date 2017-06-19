BROWSERIFY = ./node_modules/.bin/browserify
UGLIFY = ./node_modules/.bin/uglifyjs
TRANSFORM_SWITCH = -t [ babelify --presets [ es2015 ] ]

run:
	wzrd app.js:index.js -- \
		-d \
		$(TRANSFORM_SWITCH)

build:
	$(BROWSERIFY) $(TRANSFORM_SWITCH) app.js | $(UGLIFY) -c -m -o index.js

test:
	node tests/get-commits-for-repos-tests.js
	node tests/get-repos-tests.js
	node tests/get-user-commits-bounded-by-date-tests.js

test-long:
	node tests/long/get-user-commits-tests.js

test-long-sequential:
	node tests/long/get-user-commits-tests.js previous-run-repo-states.json
	node tests/long/get-user-commits-tests.js previous-run-repo-states-2.json

pushall:
	git push origin gh-pages

lint:
	eslint .
