/*
 * gnome-shell-brightness-extension
 * Copyright (C) Luis Medinas 2012 <lmedinas@gmail.com>
 *
 * This extension is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this extension.  If not, write to:
 * The Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor
 * Boston, MA  02110-1301, USA.
 */

const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;
const DBus = imports.dbus;
const Gettext = imports.gettext;
const _ = Gettext.gettext;

const BrightnessIface = {
    name: 'org.gnome.SettingsDaemon.Power.Screen',
    methods: 
    [
	{ name: 'GetPercentage', inSignature: '',  outSignature: 'u'},
	{ name: 'StepDown', inSignature: '', outSignature: 'u' },
	{ name: 'SetPercentage', inSignature: 'u', outSignature: 'u' }
    ]
};

let BrightnessDbus = DBus.makeProxyClass(BrightnessIface);

function ScreenBrightness() {
    this._init.apply(this, arguments);
}

ScreenBrightness.prototype = {
    __proto__: PanelMenu.SystemStatusButton.prototype,

    _init: function() {
        PanelMenu.SystemStatusButton.prototype._init.call(this, 'display-brightness-symbolic');

	this.setIcon('display-brightness-symbolic');

	let _proxy = new BrightnessDbus(DBus.session, 'org.gnome.SettingsDaemon', '/org/gnome/SettingsDaemon/Power');

        let label = new PopupMenu.PopupMenuItem(_("Brightness"), { reactive: false });
        this.menu.addMenuItem(label);
	this._Slider = new PopupMenu.PopupSliderMenuItem(0);
	this._Slider.connect('value-changed', function(item) {
	    let val = item._value * 100;
	    _proxy.SetPercentageRemote(val);
	});

	this.menu.addMenuItem(this._Slider);

	this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

	this.menu.addSettingsAction(_("Screen Settings"), 'gnome-screen-panel.desktop');
	
	_proxy.GetPercentageRemote(Lang.bind(this, function (result, error) {
	    if (error) {
                this._Slider.setValue(1);
	    } else {
		let value = result / 100;
		this._Slider.setValue(value);
	    }
	}));
    }
}

function init(metadata) {
    Gettext.bindtextdomain("gnome-shell-brightness-extension", metadata.path + "/locale");
    Gettext.textdomain("gnome-shell-brightness-extension");
}

let indicator;
let event=null;

function enable() {
    indicator = new ScreenBrightness();
    Main.panel.addToStatusArea('brightness', indicator);
}

function disable() {
    indicator.destroy();
    Mainloop.source_remove(event);
    indicator = null;
}
