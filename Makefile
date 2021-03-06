node_modules/@financial-times/n-gage/index.mk:
	npm install --no-save --no-package-lock @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

link-views:
	@echo "Creating symlink to mimic bower_component setup /views -> public/n-swg"
	mkdir -p "$(CURDIR)/public/n-swg"
	ln -sf "$(CURDIR)/views" "$(CURDIR)/public/n-swg/"

demo-build: link-views
	webpack --config demos/webpack.config.js
	@$(DONE)

demo-build-watch: link-views
	webpack --watch --config demos/webpack.config.js &
	@$(DONE)

demo: demo-build-watch
	@DEMO_MODE=true nodemon --ext html,css --watch public --watch views demos/start.js

run:
	@DEMO_MODE=true HTTP_MODE=true node demos/app

a11y: demo-build
	@PA11Y=true DEMO_MODE=true node demos/app
	@$(DONE)

test: verify
	make unit-test

unit-test:
	mocha test/client --recursive --require test/client/setup

smoke:
	export TEST_URL=http://localhost:5050; \
	make a11y
