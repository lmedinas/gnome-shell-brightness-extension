/*
 * Copyright/Copyleft (C) 2012 Orest Tarasiuk <orest.tarasiuk@tum.de>
 *
 * This file is part of Gnome Shell Extension Brightness Control (GSEBC).
 *
 * GSEBC is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * GSEBC is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GSEBC. If not, see <http://www.gnu.org/licenses/>.
 *
 */

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Convenience = ExtensionUtils.getCurrentExtension().imports.convenience;
const Gettext = imports.gettext.domain("brightness_control");
const _ = Gettext.gettext;

let settings;
let boolSettings;
let stringSettings;

function init() {
    Convenience.initTranslations();
    settings = Convenience.getSettings();

    boolSettings = {
        persist: {
            label: _("Persist across reboots"),
            help: _("Remember or forget the brightness level across reboots."
                + " If you enable this, you have to click the icon before"
                + " rebooting in order to have the level saved!")
        }
    };

    stringSettings = {
        step: {
            label: _("Brightness adjustment step (hover-scroll) [% points]"),
            help: _("Brightness percentage points adjustment step when hover-scrolling")
        }
    /*
        level: {
            label: _("The current brightness level"),
            help: _("The current brightness level")
        }*/
    };
}

function buildPrefsWidget() {
    let frame = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        border_width: 10
    });
    let vbox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin: 20,
        margin_top: 10
    });

    for (setting in boolSettings) {
        let hbox = _createBoolSetting(setting);
        vbox.add(hbox);
    }
    for (setting in stringSettings) {
        let hbox = createStringSetting(setting);
        vbox.add(hbox);
    }

    frame.add(vbox);
    frame.show_all();

    return frame;
}

function _createBoolSetting(setting) {
    let hbox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL
    });

    let settingLabel = new Gtk.Label({
        label: boolSettings[setting].label,
        xalign: 0
    });

    let settingSwitch = new Gtk.Switch({
        active: settings.get_boolean(setting)
    });
    settingSwitch.connect("notify::active", function(button) {
        settings.set_boolean(setting, button.active);
    });

    if (boolSettings[setting].help) {
        settingLabel.set_tooltip_text(boolSettings[setting].help);
        settingSwitch.set_tooltip_text(boolSettings[setting].help);
    }

    hbox.pack_start(settingLabel, true, true, 0);
    hbox.add(settingSwitch);

    return hbox;
}

function createStringSetting(setting) {
    let hbox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        margin_top: 5
    });

    let setting_label = new Gtk.Label({
        label: stringSettings[setting].label,
        xalign: 0
    });

    let setting_string = new Gtk.Entry({
        text: settings.get_string(setting.replace("_", "-"))
    });
    setting_string.connect("notify::text", function(entry) {
        settings.set_string(setting.replace("_", "-"), entry.text);
    });

    if (stringSettings[setting].mode == "passwd") {
        setting_string.set_visibility(false);
    }

    if (stringSettings[setting].help) {
        setting_label.set_tooltip_text(stringSettings[setting].help)
        setting_string.set_tooltip_text(stringSettings[setting].help)
    }

    hbox.pack_start(setting_label, true, true, 0);
    hbox.add(setting_string);

    return hbox;
}
