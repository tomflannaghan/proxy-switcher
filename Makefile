UUID=ProxySwitcher@flannaghan.com
BUILD=build
BUILD_LOC=$(BUILD)/$(UUID)
ZIP=$(UUID).zip

# if we are running as root, install system-wide.
ifeq ($(shell whoami),root)
INSTALL_LOC=/usr/share/gnome-shell/extensions
else
INSTALL_LOC=$(HOME)/.local/share/gnome-shell/extensions
endif

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

uninstall:
	rm -r $(INSTALL_LOC)/$(UUID)

clean:
	rm -rf po
	rm -rf locale
	rm -rf $(BUILD)
