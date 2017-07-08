BROWSERIFY = ./node_modules/.bin/browserify
UGLIFY = ./node_modules/.bin/uglifyjs
TRANSFORM_SWITCH = -t [ babelify --presets [ es2015 ] ]

SMOKECHROME = node_modules/.bin/tap-closer | \
	node_modules/.bin/smokestack -b chrome

SMOKEFIREFOX = node_modules/.bin/tap-closer | \
	node_modules/.bin/smokestack -b firefox

run:
	wzrd app.js:index.js -- \
		-d \
		$(TRANSFORM_SWITCH)

# It needs to run at port 80 for the Github API auth token process to work.
run-on-80:
	sudo wzrd app.js:index.js \
	--port 80 \
	-- \
	-d \
	$(TRANSFORM_SWITCH)

build:
	$(BROWSERIFY) $(TRANSFORM_SWITCH) app.js | $(UGLIFY) -c -m -o index.js

test:
	node tests/get-commits-for-repos-tests.js
	node tests/get-repos-tests.js
	node tests/get-user-commits-bounded-by-date-tests.js

test-chrome:
	$(BROWSERIFY) tests/browser/storage-tests.js | $(SMOKECHROME)
	$(BROWSERIFY) tests/browser/api-storage-tests.js | $(SMOKECHROME)

test-firefox:
	$(BROWSERIFY) tests/browser/storage-tests.js | $(SMOKEFIREFOX)

test-long:
	node tests/long/get-user-commits-tests.js

test-long-sequential:
	node tests/long/get-user-commits-tests.js previous-run-repo-states.json
	node tests/long/get-user-commits-tests.js previous-run-repo-states-2.json

pushall:
	git push origin gh-pages

lint:
	eslint .
