''' This script constructs the language resources we need. '''
import re
import glob
import os

UUID = "ProxySwitcher@flannaghan.com"

def get_network_settings_translations():
    ''' Read the network settings translations for all languages. '''
    infile = "lang-resources/gnome-network-panel.desktop"
    with open(infile, 'r') as f:
        fdata = f.read()
        return dict(re.findall("^Comment\[(.*)\]=(.*)$", fdata,
                               flags=re.MULTILINE))

def get_control_center_translations(lang):
    ''' Read the control center translations for a given language. '''
    infile = "lang-resources/po-gnome-control-center/{}.po".format(lang)
    with open(infile, 'r') as f:
        fdata = f.read()

    pattern = 'msgctxt "proxy method"\nmsgid "([^"]*)"\nmsgstr "([^"]*)"\n'
    proxy_methods = re.findall(pattern, fdata, flags=re.MULTILINE)
    proxy_methods = dict(proxy_methods)
    translations = {}
    for k in ['None', 'Manual', 'Automatic']:
        if proxy_methods.setdefault(k, "") != "":
            translations[k] = proxy_methods[k]
        else:
            translations[k] = k

    pattern = '\nmsgid "Proxy"\nmsgstr "([^"]*)"\n'
    mo = re.search(pattern, fdata, flags=re.MULTILINE)
    if mo is None:
        print("No translation for Proxy in `{}`".format(lang))
        translations["Proxy"] = "Proxy"
    else:
        translations["Proxy"] = mo.group(1)
    return translations

def make_all_po_files():
    ''' Populates the directory po. '''
    # create the target if necessary.
    if not os.path.exists('po'):
        os.makedirs('po')

    # all po files are based on templates
    with open("po.template", 'r') as f:
        template = f.read()

    # load translations and fill in the template, saving to po files.
    network_settings = get_network_settings_translations()
    for f in glob.glob("lang-resources/po-gnome-control-center/*.po"):
        lang = os.path.basename(f).rsplit(".", 1)[0]
        translations = get_control_center_translations(lang)
        translations['Network Settings'] = network_settings.get(
            lang, 'Network Settings')

        filename = "po/{}.po".format(lang)
        print("writing {}".format(filename))
        with open(filename, 'w') as f:
            po = template
            for key, value in translations.iteritems():
                po = po.replace('{{' + key + '}}', value)
            f.write(po)

def make_locale():
    ''' Constructs the locale. '''
    make_all_po_files()
    for po in glob.glob("po/*.po"):
        lang = os.path.basename(po).rsplit('.', 1)[0]
        cmd = "mkdir -p locale/{0}/LC_MESSAGES; msgfmt {1} -o locale/{0}/LC_MESSAGES/{2}.mo".format(lang, po, UUID)
        print(cmd)
        os.system(cmd)

if __name__ == '__main__':
    make_locale()
