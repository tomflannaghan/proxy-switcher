# Compiles the po file. should be run with python3.
import re
import glob
import os

def get_network_settings():
    infile = "lang-resources/gnome-network-panel.desktop"
    with open(infile, 'r') as f:
        fdata = f.read()
        return dict(re.findall("^Comment\[(.*)\]=(.*)$", fdata,
                               flags=re.MULTILINE))

network_settings = get_network_settings()

def get_translations(lang):
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

    if lang in network_settings:
        translations['Network Settings'] = network_settings[lang]
    else:
        print("No translation for Network Settings in `%s`" % lang)
        #translations['Network Settings'] = 'Network Settings'
        return None
    
    # Now handle "m" and "a"
    translations['m'] = translations['Manual'][0].lower()
    translations['a'] = translations['Automatic'][0].lower()
    if translations['m'] == translations['a']:
        print("Repeated first letter in `%s`" % lang)
        return None
    return translations

def make_po_file(lang, template):
    translations = get_translations(lang)
    if translations is None: return None
    result = template
    for key, tran in translations.items():
        result = result.replace("{{%s}}" % key, tran)
    return result

with open("po.template", 'r') as f:
    template = f.read()

for f in glob.glob("lang-resources/po-gnome-control-center/*.po"):
    lang = os.path.basename(f).rsplit(".", 1)[0]
    po = make_po_file(lang, template)
    if po is None: continue
    with open("po/%s.po" % lang, 'w') as f:
        f.write(po)

