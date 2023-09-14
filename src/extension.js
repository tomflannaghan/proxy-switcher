import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

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


const ProxyMenuToggle = GObject.registerClass(
    class ProxyMenuToggle extends QuickSettings.QuickMenuToggle {
        _init(extensionObject) {
            super._init({
                title: _("Proxy"),
                iconName: "preferences-system-network-proxy-symbolic",
            });
    
            // Add a header with an icon, title and optional subtitle. This is
            // recommended for consistency with other quick settings menus.
            this.menu.setHeader("preferences-system-network-proxy-symbolic", _("Proxy"));
    
            // Add a section of items to the menu
            let itemsSection = new PopupMenu.PopupMenuSection();
            this._modeToItem = {};
            for (const mode of modeList) {
                this._modeToItem[mode] = itemsSection.addAction(_(modeText[mode]),
                    () => extensionObject.proxySettings.set_string(PROXY_MODE, mode));
            }
            this.menu.addMenuItem(itemsSection);
    
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            const settingsItem = this.menu.addSettingsAction(
                _("Network Settings"), 'gnome-network-panel.desktop');
    
            // Ensure the settings are unavailable when the screen is locked
            settingsItem.visible = Main.sessionMode.allowSettings;
            this.menu._settingsActions[extensionObject.uuid] = settingsItem;

            // Clean-up. Not really sure if this is necessary, but want to be safe.
            this.connect('destroy', () => (this._modeToItem = null));

            // Set the initial state.
            this._reflectSettings(extensionObject);
        }

        _reflectSettings(extensionObject) {
            // Synchronises the menu indicator with the Gnome Settings,
            // allowing us to reflect changes made externally to the extension.
            const mode = extensionObject.proxySettings.get_string(PROXY_MODE);
            if (mode == "none") {
                this.checked = false;
                this.subtitle = null;    
            } else {
                this.checked = true;
                this.subtitle = _(modeText[mode]);    
            }
            
            for (const itemMode of modeList) {
                this._modeToItem[itemMode].setOrnament(
                    (mode == itemMode) ? PopupMenu.Ornament.DOT
                        : PopupMenu.Ornament.NONE);
            }
        }
    }
);


export default class ProxySwitcherExtension extends Extension {

    enable() {
        // connect to the gsettings proxy schema
        if (Gio.Settings.list_schemas().indexOf(PROXY_SCHEMA) == -1)
            throw _("Schema \"%s\" not found.").format(PROXY_SCHEMA);
        this.proxySettings =  new Gio.Settings({ schema: PROXY_SCHEMA });    

        // make the menu
        let switcherMenu = new ProxyMenuToggle(this);
        
        // make an "indicator" (whatever that is) and add our menu to it. This is 
        // how we add it to the actual system menu.
        this._indicator = new QuickSettings.SystemIndicator(this);
        this._indicator.quickSettingsItems.push(switcherMenu);
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);

        // Register callback for changes to the settings
        this.settingsConnectionId = this.proxySettings.connect(
            'changed::' + PROXY_MODE, () => switcherMenu._reflectSettings(this),
        );
    }

    disable() {
        if (this.proxySettings) {
            if (this.settingsConnectionId) {
                this.proxySettings.disconnect(this.settingsConnectionId);
                this.settingsConnectionId = null;
            }
            this.proxySettings = null;
        }

        if (this._indicator) {
            this._indicator.quickSettingsItems.forEach(item => item.destroy());
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}