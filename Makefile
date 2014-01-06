INSTALL_LOC=$(HOME)/.local/share/gnome-shell/extensions
EXTENSION=ProxySwitcher@flannaghan.com

all: zip install

zip:
	zip -j $(EXTENSION).zip $(EXTENSION)/metadata.json $(EXTENSION)/extension.js

install:
	rm -rf $(INSTALL_LOC)/$(EXTENSION)
	cp -r $(EXTENSION) $(INSTALL_LOC)/.

