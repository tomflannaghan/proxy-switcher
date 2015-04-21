import glob
import os

UUID = "ProxySwitcher@flannaghan.com"

for po in glob.glob("po/*.po"):
    lang = os.path.basename(po).rsplit('.', 1)[0]
    cmd = "mkdir -p locale/{0}/LC_MESSAGES; msgfmt {1} -o locale/{0}/LC_MESSAGES/{2}.mo".format(lang, po, UUID)
    os.system(cmd)
