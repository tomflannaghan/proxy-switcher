import Gio from 'gi://Gio';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';


const PROXY_SCHEMA = "org.gnome.system.proxy"
const PROXY_MODE = "mode"

// possible proxy modes and their text representation.
const modeText = {'none': "Off",
                  'manual': "Manual",
                  'auto': "Automatic"};
const modeList = ['none', 'manual', 'auto'];


class ModeMenuItem {
    // A class that wraps a menu item associated with a proxy mode.
    constructor(mode, settings) {
        this.mode = mode;
        this.item = new PopupMenu.PopupMenuItem(_(modeText[mode]));
        this.connectionId = this.item.connect("activate", function() {
            settings.set_string(PROXY_MODE, mode);
        });
    }

    destroy() {
        this.item.disconnect(this.connectionId);
        this.item.destroy();
    }
}


export default class ProxySwitcherExtension extends Extension {

    enable() {
        // connect to the gsettings proxy schema
        if (Gio.Settings.list_schemas().indexOf(PROXY_SCHEMA) == -1)
            throw _("Schema \"%s\" not found.").format(PROXY_SCHEMA);
        this.settings =  new Gio.Settings({ schema: PROXY_SCHEMA });    

        // make the menu
        this.switcherMenu = new QuickSettings.QuickMenuToggle({
            title: _("Proxy"),
            iconName: "preferences-system-network-proxy-symbolic",
        });
        this.switcherMenu.menu.setHeader("preferences-system-network-proxy-symbolic", _("Proxy"));

        // make an "indicator" (whatever that is) and add our menu to it. This is how we add it
        // to the actual system menu.
        this.indicator = new QuickSettings.SystemIndicator(this);
        this.indicator.quickSettingsItems.push(this.switcherMenu);
        Main.panel.statusArea.quickSettings.addExternalIndicator(this.indicator);

        this.clickedConnectionId = this.switcherMenu.connect(
            'clicked', () => this.switcherMenu.menu.open(),
        );

        // add menu item for each mode.
        this.items = [];
        for (const mode of modeList) {
            const item = new ModeMenuItem(mode);
            this.items.push(item);
            this.switcherMenu.menu.addMenuItem(item.item);
        }

        // Add a link to launch network settings.
        this.switcherMenu.menu.addMenuItem(
            new PopupMenu.PopupSeparatorMenuItem());
        this.switcherMenu.menu.addSettingsAction(
            _("Network Settings"), 'gnome-network-panel.desktop');

        // Register callback for changes to the settings
        this.settingsConnectionId = this.settings.connect(
            'changed::' + PROXY_MODE, this.reflectSettings,
        );

        this.reflectSettings();
    }

    reflectSettings() {
        // Synchronises the menu indicator with the Gnome Settings,
        // allowing us to reflect changes made externally to the extension.
        const mode = this.settings.get_string(PROXY_MODE);
        if (mode == "none") {
            this.switcherMenu.checked = false;
            this.switcherMenu.subtitle = null;    
        } else {
            this.switcherMenu.checked = true;
            this.switcherMenu.subtitle = _(modeText[mode]);    
        }
        
        for (const item of this.items) {
            item.item.setOrnament(
                (mode == item.mode) ? PopupMenu.Ornament.DOT
                    : PopupMenu.Ornament.NONE);
        }
    }

    disable() {
        if (this.settings) {
            if (this.settingsConnectionId) {
                this.settings.disconnect(this.settingsConnectionId);
                this.settingsConnectionId = null;
            }
            this.settings = null;
        }

        for (const item of this.items) {
            item.destroy();
        }
        this.items = [];

        if (this.switcherMenu) {
            this.switcherMenu.disconnect(this.clickedConnectionId);
            this.clickedConnectionId = null;
            this.switcherMenu.destroy();
            this.switcherMenu = null
        }

        if (this.indicator) {
            this.indicator.destroy();
            this.indicator = null;
        }
    }

}