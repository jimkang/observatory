BROWSERIFY = ./node_modules/.bin/browserify
UGLIFY = ./node_modules/uglify-es/bin/uglifyjs

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

pushall:
	git push origin gh-pages

prettier:
	prettier --single-quote --write "**/*.js"

test:
	node tests/decorate-project-tests.js
