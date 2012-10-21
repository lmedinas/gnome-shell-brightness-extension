/*
 * Copyright/Copyleft (C) 2012
 * Luis Medinas <lmedinas@gmail.com>, Orest Tarasiuk <orest.tarasiuk@tum.de>
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

const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;
const DBus = imports.dbus;
const Shell = imports.gi.Shell;
const ExtensionUtils = imports.misc.extensionUtils;
const Convenience = ExtensionUtils.getCurrentExtension().imports.convenience;

const Name = "brightness_control";
const UUID = Name + "@lmedinas.org";
const Gettext = imports.gettext.domain(Name);
const _ = Gettext.gettext;

const BrightnessIface = {
    name: 'org.gnome.SettingsDaemon.Power.Screen',
    methods:
    [
    {
        name: 'GetPercentage',
        inSignature: '',
        outSignature: 'u'
    },
    {
        name: 'StepDown',
        inSignature: '',
        outSignature: 'u'
    },
    {
        name: 'SetPercentage',
        inSignature: 'u',
        outSignature: 'u'
    }
    ]
};

let BrightnessDbus = DBus.makeProxyClass(BrightnessIface);
let indicator, settings, step, persist, currentBrightness;

function ScreenBrightness() {
    this._init.apply(this, arguments);
}

ScreenBrightness.prototype = {
    __proto__: PanelMenu.SystemStatusButton.prototype,

    _init: function() {
        PanelMenu.SystemStatusButton.prototype._init.call(this,
            'display-brightness-symbolic');

        this._proxy = new BrightnessDbus(DBus.session,
            'org.gnome.SettingsDaemon', '/org/gnome/SettingsDaemon/Power');

        step = settings.get_string("step");
        let level = settings.get_string("level");
        persist = settings.get_boolean("persist");
        if (persist) {
            this._proxy.SetPercentageRemote(parseInt(level));
        }

        this._refresh();

        this.setIcon('display-brightness-symbolic');
        let label = new PopupMenu.PopupMenuItem(_("Brightness"), {
            reactive: false
        });

        this.menu.addMenuItem(label);
        this._slider = new PopupMenu.PopupSliderMenuItem(0);
        this._slider.connect('value-changed', Lang.bind(this, function(item) {
            this._changeBrightness(item._value * 100);
        }));

        this.menu.addMenuItem(this._slider);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addSettingsAction(_("Screen Settings"),
            'gnome-screen-panel.desktop');
        this.newMenuItem = new PopupMenu.PopupMenuItem(_("Extension Settings"));
        this.menu.addMenuItem(this.newMenuItem);
        this.newMenuItem.connect("activate", Lang.bind(this, this._launchPrefs));

        this.actor.connect('button-press-event',
            Lang.bind(this, this._refresh));
        this.actor.connect('scroll-event',
            Lang.bind(this, this._onScrollEvent));
    },

    _onScrollEvent: function(actor, event) {
        let direction = event.get_scroll_direction();
        if (direction == Clutter.ScrollDirection.DOWN) {
            currentBrightness = Math.max(0,
                currentBrightness - step);
        } else if (direction == Clutter.ScrollDirection.UP) {
            currentBrightness = Math.min(100,
                parseInt(currentBrightness) + parseInt(step));
        }
        this._changeBrightness(currentBrightness);
    },

    _changeBrightness: function(brightness) {
        brightness = parseInt(brightness);
        this._proxy.SetPercentageRemote(brightness);
        this._updateBrightness(brightness);
    },

    _updateBrightness: function(newValue) {
        settings.set_string("level", newValue.toString());
        currentBrightness = parseInt(newValue);
        this._slider.setValue(newValue / 100);
    },

    /* TODO: Execute this when the user uses hotkeys for brightness control */
    _refresh: function() {
        this._proxy.GetPercentageRemote(Lang.bind(this,
            function (result, error) {
                if (error) {
                    this._slider.setValue(1);
                } else {
                    this._updateBrightness(result);
                }
            }));
    },

    _launchPrefs: function() {
        let appSys = Shell.AppSystem.get_default();
        let app = appSys.lookup_app('gnome-shell-extension-prefs.desktop');
        app.launch(global.display.get_current_time_roundtrip(),
            ['extension:///' + UUID], -1, null);
        this.menu.close();
    }
}

function settings_connexion() {
    settings.connect("changed::" + "step", function() {
        step = settings.get_string("step");
    });
}

function init(metadata) {
    imports.gettext.bindtextdomain(Name,
        metadata.path + "/locale");
/* TODO: Translations */
}

function enable() {
    settings = Convenience.getSettings();
    indicator = new ScreenBrightness();
    Main.panel.addToStatusArea('brightness', indicator);
    settings_connexion();
}

function disable() {
    settings = null;
    if (indicator !== null) indicator.destroy();
    indicator = null;
}
