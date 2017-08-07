BROWSERIFY = ./node_modules/.bin/browserify
UGLIFY = ./node_modules/uglify-es/bin/uglifyjs

SMOKECHROME = node_modules/.bin/tap-closer | \
	node_modules/.bin/smokestack -b chrome

SMOKEFIREFOX = node_modules/.bin/tap-closer | \
	node_modules/.bin/smokestack -b firefox

run:
	wzrd app.js:index.js -- \
		-d

# It needs to run at port 80 for the Github API auth token process to work.
run-on-80:
	sudo wzrd app.js:index.js \
	--port 80 \
	-- \
	-d

build:
	$(BROWSERIFY) app.js | $(UGLIFY) -c -m -o index.js

test-chrome:
	$(BROWSERIFY) tests/browser/storage-tests.js | $(SMOKECHROME)
	$(BROWSERIFY) tests/browser/api-storage-tests.js | $(SMOKECHROME)

test-firefox:
	$(BROWSERIFY) tests/browser/storage-tests.js | $(SMOKEFIREFOX)
	$(BROWSERIFY) tests/browser/api-storage-tests.js | $(SMOKEFIREFOX)

pushall:
	git push origin gh-pages
