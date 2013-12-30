INSTALL_LOC=$(HOME)/.local/share/gnome-shell/extensions
EXTENSION=ProxySwitcher@flannaghan.com

install:
	rm -rf $(INSTALL_LOC)/$(EXTENSION)
	cp -r $(EXTENSION) $(INSTALL_LOC)/.

