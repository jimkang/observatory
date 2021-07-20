include config.mk

HOMEDIR = $(shell pwd)
APPDIR = $(HTMLDIR)/observatory
rollup = ./node_modules/.bin/rollup

run:
	$(rollup) -c -w

build:
	$(rollup) -c

pushall: sync
	git push origin master

prettier:
	prettier --single-quote --write "**/*.js"

test:
	node tests/decorate-project-tests.js

sync:
	rsync -a $(HOMEDIR)/ $(USER)@$(SERVER):/$(APPDIR) --exclude node_modules/ \
		--omit-dir-times --no-perms
