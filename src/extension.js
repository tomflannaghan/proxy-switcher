const Main = imports.ui.main;
const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain(Me.metadata.uuid);
const _ = Gettext.gettext;

const PROXY_SCHEMA = "org.gnome.system.proxy"
const PROXY_MODE = "mode"

// possible proxy modes and their text representation.
const modeText = {'none': _("None"),
                  'manual': _("Manual"),
                  'auto': _("Automatic")};
const modeList = ['none', 'manual', 'auto'];

// These will store the objects we create on enable.
let settings = null;
let settingsConnectionId = null;
let switcherMenu = null;
let items = [];

class ModeMenuItem {
    // A class that wraps a menu item associated with a proxy mode.
    constructor(mode) {
        this.mode = mode;
        this.item = new PopupMenu.PopupMenuItem(modeText[mode]);
        this.connectionId = this.item.connect("activate", function() {
            settings.set_string(PROXY_MODE, mode);
        });
    }

    destroy() {
        this.item.disconnect(this.connectionId);
        this.item.destroy();
    }
}

function init() {
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}

function enable() {
    // connect to the gsettings proxy schema
    if (Gio.Settings.list_schemas().indexOf(PROXY_SCHEMA) == -1)
        throw _("Schema \"%s\" not found.").format(PROXY_SCHEMA);
    settings =  new Gio.Settings({ schema: PROXY_SCHEMA });    

    // make the menu
    switcherMenu = new PopupMenu.PopupSubMenuMenuItem(_("Proxy"), true);
    switcherMenu.icon.icon_name = "preferences-system-network-proxy-symbolic";

    // add menu item for each mode.
    items = [];
    for (const mode of modeList) {
        const item = new ModeMenuItem(mode);
        items.push(item);
        switcherMenu.menu.addMenuItem(item.item);
    }

    // Add a link to launch network settings.
    switcherMenu.menu.addSettingsAction(
        _("Network Settings"), 'gnome-network-panel.desktop');

    // Find the right place in the menu to insert our switcher.
    // If the network menu is defined, insert after this item (the
    // 4th position), else put it after the 3rd (which is the
    // first seperator).
    let network = Main.panel.statusArea.aggregateMenu._network;
    let index = (network) ? 4 : 3;
    Main.panel.statusArea.aggregateMenu.menu.addMenuItem(
        switcherMenu, index);

    // Register callback for changes to the settings
    settingsConnectionId = settings.connect(
        'changed::' + PROXY_MODE, reflectSettings,
    );

    reflectSettings();
}

function reflectSettings() {
    // Synchronises the menu indicator with the Gnome Settings,
    // allowing us to reflect changes made externally to the extension.
    const mode = settings.get_string(PROXY_MODE);
    switcherMenu.label.text = _("Proxy") + " " + modeText[mode];

    for (const item of items) {
        item.item.setOrnament(
            (mode == item.mode) ? PopupMenu.Ornament.DOT
                : PopupMenu.Ornament.NONE);
    }
}

function disable() {
    if (settings) {
        if (settingsConnectionId) {
            settings.disconnect(settingsConnectionId);
            settingsConnectionId = null;
        }
        settings = null;
    }

    for (const item of items) {
        item.destroy();
    }
    items = [];

    if (switcherMenu) {
        switcherMenu.destroy();
        switcherMenu = null
    }
}
