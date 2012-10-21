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
 * Special thanks to dsboger.
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
const _ = imports.gettext.domain(UUID).gettext;
const GCC_ = imports.gettext.domain('gnome-control-center-2.0').gettext;

const BrightnessIface = {
    name: 'org.gnome.SettingsDaemon.Power.Screen',
    methods: [
    {
        name: 'GetPercentage',
        inSignature: '',
        outSignature: 'u'
    },
    {
        name: 'SetPercentage',
        inSignature: 'u',
        outSignature: 'u'
    },
    {
        name: 'StepUp',
        inSignature: '',
        outSignature: 'u'
    },
    {
        name: 'StepDown',
        inSignature: '',
        outSignature: 'u'
    }
    ],
    signals: [
    {
        name: 'Changed',
        inSignature: ''
    }
    ]
};

const BrightnessDbus = DBus.makeProxyClass(BrightnessIface);
let indicator, settings, step, persist;

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

        /* TODO: This doesn't seem to work on 3.4.2 */
        this._onChangedId = this._proxy.connect('Changed',
            Lang.bind(this, this._refresh));

        step = settings.get_string("step");
        let level = settings.get_string("level");
        persist = settings.get_boolean("persist");
        if (persist) {
            this._proxy.SetPercentageRemote(parseInt(level));
        }

        this._refresh();

        this.setIcon('display-brightness-symbolic');
        let label = new PopupMenu.PopupMenuItem(GCC_("Brightness"), {
            reactive: false
        });

        this.menu.addMenuItem(label);
        this._slider = new PopupMenu.PopupSliderMenuItem(0);
        this._slider.connect('value-changed', Lang.bind(this, function(item) {
            this._changeBrightness(item._value * 100);
        }));

        this.menu.addMenuItem(this._slider);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addSettingsAction(GCC_("Brightness and Lock"),
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
        switch (event.get_scroll_direction()) {
            case Clutter.ScrollDirection.DOWN:
            case Clutter.ScrollDirection.LEFT:
                this._stepDown();
                break;
            case Clutter.ScrollDirection.UP:
            case Clutter.ScrollDirection.RIGHT:
            default:
                this._stepUp();
                break;
        }
    },

    _stepUp: function() {
        this._proxy.GetPercentageRemote(Lang.bind(this,
            function (result, error) {
                if (!error) {
                    this._changeBrightness(Math.min(100,
                        parseInt(result) + parseInt(step)));
                }
            }));

    },

    _stepDown: function() {
        this._proxy.GetPercentageRemote(Lang.bind(this,
            function (result, error) {
                if (!error) {
                    this._changeBrightness(Math.max(0,
                        parseInt(result) - parseInt(step)));
                }
            }));

    },

    _changeBrightness: function(brightness) {
        brightness = parseInt(brightness);
        this._proxy.SetPercentageRemote(brightness);
        this._updateBrightness(brightness);
    },

    _updateBrightness: function(newValue) {
        settings.set_string("level", newValue.toString());
        this._slider.setValue(newValue / 100);
    },

    _refresh: function() {
        // Main.notify("_refresh() called");
        this._proxy.GetPercentageRemote(Lang.bind(this,
            function (result, error) {
                if (error) {
                    this._slider.setValue(1);
                } else {
                    if (!this._dragging) this._updateBrightness(result);
                // else Main.notify("Dragging, so not refreshing");
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
}

function enable() {
    settings = Convenience.getSettings();
    indicator = new ScreenBrightness();
    Main.panel.addToStatusArea('brightness', indicator, 2);
    settings_connexion();
}

function disable() {
    //    indicator._proxy.disconnect(indicator._onChangedId);
    settings = null;
    if (indicator !== null) indicator.destroy();
    indicator = null;
}
