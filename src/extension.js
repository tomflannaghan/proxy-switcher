const Main = imports.ui.main;
const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const UUID = "ProxySwitcher@flannaghan.com";
const Gettext = imports.gettext.domain(UUID);
const _ = Gettext.gettext;

const Lang = imports.lang;

const PROXY_SCHEMA = "org.gnome.system.proxy"
const PROXY_MODE = "mode"

function getSettings(schema) {
    if (Gio.Settings.list_schemas().indexOf(schema) == -1)
        throw _("Schema \"%s\" not found.").format(schema);
    return new Gio.Settings({ schema: schema });
}


const ProxySwitcher = new Lang.Class({
    Name: 'ProxySwitcher',

    _init: function() {
        // connect to the gsettings proxy schema
        this._settings = getSettings(PROXY_SCHEMA);
        
        // possible states and their text representation.
        this._stateText = {'none': _("None"),
                           'manual': _("Manual"),
                           'auto': _("Automatic")};
        this._stateList = ['none', 'manual', 'auto'];

        // make the menu
        this._switcherMenu = new PopupMenu.PopupSubMenuMenuItem(
            _("Proxy"), true);
        this._switcherMenu.icon.icon_name = 
            "preferences-system-network-proxy-symbolic";

        // add items for each state.
        for (var i = 0; i < this._stateList.length; i++) {
            let state = this._stateList[i];
            let item = new PopupMenu.PopupMenuItem(this._stateText[state]);
            this._switcherMenu.menu.addMenuItem(item);
            item.connect("activate", Lang.bind(this, function() {
                this._settings.set_string(PROXY_MODE, state);
            }));
        }

        // Add a link to launch network settings.
        this._switcherMenu.menu.addSettingsAction(
            _("Network Settings"), 'gnome-network-panel.desktop');


        // Find the right place in the menu to insert our switcher.
        // If the network menu is defined, insert after this item (the
        // 4th position), else put it after the 3rd (which is the
        // first seperator).
        let network = Main.panel.statusArea.aggregateMenu._network;
        let index = (network) ? 4 : 3;
        Main.panel.statusArea.aggregateMenu.menu.addMenuItem(
            this._switcherMenu, index);

        // Register callback for changes to the settings
        let load_settings_refresh = Lang.bind(this, function() {
            this._mode = this._settings.get_string(PROXY_MODE);
            this.refresh();
        });
        this._settings_connection_id = 
            this._settings.connect('changed::' + PROXY_MODE, 
                                   load_settings_refresh);

        load_settings_refresh();
    },

    refresh: function() {
        // run every time settings have changed. Keeps the menu status in sync.
        this._switcherMenu.status.text = this._stateText[this._mode];
    },

    destroy: function() {
        this._settings.disconnect(this._settings_connection_id);
        this._switcherMenu.destroy();
    }

});


let proxySwitcher;

function init() {
    let extension = imports.misc.extensionUtils.getCurrentExtension();
    
    // If the locale dir exists (it should always exist if installed
    // correctly) then set it up as the source for translations.
    let localeDir = extension.dir.get_child('locale');
    if (localeDir.query_exists(null)) {
        imports.gettext.bindtextdomain(UUID, localeDir.get_path());
    }
}

function enable() {
    proxySwitcher = new ProxySwitcher();
}

function disable() {
    if(proxySwitcher != null) {
        proxySwitcher.destroy();
        proxySwitcher = null;
    }
}
