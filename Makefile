INSTALL_LOC=$(HOME)/.local/share/gnome-shell/extensions
UUID=ProxySwitcher@flannaghan.com
BUILD=build
BUILD_LOC=$(BUILD)/$(UUID)
ZIP=$(UUID).zip

.PHONY: build
build:
	rm -rf $(BUILD_LOC)
	mkdir -p $(BUILD_LOC)
	python make_locale.py
	cp -r src/extension.js src/metadata.json locale $(BUILD_LOC)
	cd $(BUILD_LOC); zip -r $(ZIP) *
	mv $(BUILD_LOC)/$(ZIP) $(ZIP)

install:
	rm -rf $(INSTALL_LOC)/$(UUID)
	cp -r $(BUILD_LOC) $(INSTALL_LOC)/.

clean:
	rm -rf po
	rm -rf locale
	rm -rf $(BUILD)
