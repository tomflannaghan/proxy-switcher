const St = imports.gi.St;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Util = imports.misc.util;

const PROXY_SCHEMA = "org.gnome.system.proxy"
const PROXY_MODE = "mode"
const PROXY_MANUAL_TEXT = "Manual"
const PROXY_AUTO_TEXT = "Automatic"
const ICON_NONE = "preferences-system-network-proxy-symbolic"
const ICON_MANUAL = ICON_NONE; //"emblem-default-symbolic"
const ICON_AUTO = ICON_NONE; //"emblem-default-symbolic"

function getSettings(schema) {
    if (Gio.Settings.list_schemas().indexOf(schema) == -1)
        throw _("Schema \"%s\" not found.").format(schema);
    return new Gio.Settings({ schema: schema });
}

function ProxyMenuButton() {
    this._init();
}

ProxyMenuButton.prototype = {
    __proto__: PanelMenu.Button.prototype,
    
    _init: function() {
        // connect to the gsettings proxy schema
        this._settings = getSettings(PROXY_SCHEMA);
        this._mode = this._settings.get_string(PROXY_MODE);
        let load_settings_refresh = Lang.bind(this, function() {
            this._mode = this._settings.get_string(PROXY_MODE);
            this.refresh();
        });
        this._settings_connection_id = 
            this._settings.connect('changed::' + PROXY_MODE, 
                                   load_settings_refresh);
        
        this._icon = new St.Icon({ 
            icon_name: ICON_NONE,
            style_class: 'system-status-icon' });
        this._modeInfo = new St.Label({ text: "", width: 16 });

        // Panel menu item - the current class
        let menuAlignment = 0.25;
        PanelMenu.Button.prototype._init.call(this, menuAlignment);
        
        // Putting the panel item together
        let topBox = new St.BoxLayout();
        topBox.add_actor(this._icon);
        topBox.add_actor(this._modeInfo);
        this.actor.add_actor(topBox);

        let children = null;
        children = Main.panel._rightBox.get_children();
        Main.panel._rightBox.insert_child_at_index(this.actor, 0);

        // putting the popup menu together
        this._manualSwitch = new PopupMenu.PopupSwitchMenuItem(
            PROXY_MANUAL_TEXT, false, {});
        this._autoSwitch = new PopupMenu.PopupSwitchMenuItem(
            PROXY_AUTO_TEXT, false, {});
        this.menu.addMenuItem(this._manualSwitch);
        this.menu.addMenuItem(this._autoSwitch);
        this._manualSwitch.connect(
            'toggled', Lang.bind(this, function() {
                this._settings.set_string(
                    PROXY_MODE, this._mode == 'manual' ? 'none' : 'manual');
            }));
        this._autoSwitch.connect(
            'toggled', Lang.bind(this, function() {
                this._settings.set_string(
                    PROXY_MODE, this._mode == 'auto' ? 'none' : 'auto');
            }));
        // Add a menu seperator and link to network settings to bottom of menu
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addSettingsAction(_("Network Settings"), 
                                    'gnome-network-panel.desktop');
        this.refresh();
    },
    
    refresh: function() {
        // run every time settings have changed.
        this._manualSwitch.setToggleState(this._mode == 'manual');
        this._autoSwitch.setToggleState(this._mode == 'auto');
        switch (this._mode) {
        case 'none':
            this._icon.icon_name = ICON_NONE;
            this._modeInfo.text = "-";
            break;
        case 'manual':
            this._icon.icon_name = ICON_MANUAL;
            this._modeInfo.text = "m";
            break;
        case 'auto':
            this._icon.icon_name = ICON_AUTO;
            this._modeInfo.text = "a";
            break;            
        default:
            break;
        }
    }
};

let proxyMenu;

function init() {

}

function enable() {
    proxyMenu = new ProxyMenuButton();
    Main.panel.addToStatusArea('proxyMenu', proxyMenu);
}

function disable() {
    proxyMenu._settings.disconnect(proxyMenu._settings_connection_id);
    proxyMenu.destroy();
}
