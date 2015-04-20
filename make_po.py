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

    pattern = '\nmsgid "Proxy"\nmsgstr "([^"]*)"\n'
    mo = re.search(pattern, fdata, flags=re.MULTILINE)
    if mo is None:
        print("No translation for Proxy in `{}`".format(lang))
        translations["Proxy"] = "Proxy"
    else:
        translations["Proxy"] = mo.group(1)

    if lang in network_settings:
        translations['Network Settings'] = network_settings[lang]
    else:
        print("No translation for Network Settings in `%s`" % lang)
        #translations['Network Settings'] = 'Network Settings'
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

