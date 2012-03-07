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

const St = imports.gi.St;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;
const DBus = imports.dbus;

const BrightnessIface = {
    name: 'org.gnome.SettingsDaemon.Power.Screen',
    methods: 
    [
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

    _init: function(){
        PanelMenu.SystemStatusButton.prototype._init.call(this, 'display-brightness-symbolic');

	this.setIcon('display-brightness-symbolic');

	_proxy = new BrightnessDbus(DBus.session, 'org.gnome.SettingsDaemon', '/org/gnome/SettingsDaemon/Power');

	let item100 = new PopupMenu.PopupMenuItem("100%");
        item100.connect('activate',function() {
	    this._proxy.SetPercentageRemote(100);
        });
	this.menu.addMenuItem(item100);

	let item75 = new PopupMenu.PopupMenuItem("75%");
	item75.connect('activate',function() {
	    this._proxy.SetPercentageRemote(75);
	});
	this.menu.addMenuItem(item75);
       	
	let item50 = new PopupMenu.PopupMenuItem("50%");
	item50.connect('activate',function() {
	    this._proxy.SetPercentageRemote(50);
	});
	this.menu.addMenuItem(item50);

	let item25 = new PopupMenu.PopupMenuItem("25%");
	item25.connect('activate',function() {
	    this._proxy.SetPercentageRemote(25);
	});
	this.menu.addMenuItem(item25);

	let item10 = new PopupMenu.PopupMenuItem("10%");
	item10.connect('activate',function() {
	    this._proxy.SetPercentageRemote(10);
	});
	this.menu.addMenuItem(item10);

	this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
	this.menu.addAction(_("Configure Screen settings..."), function() {
            GLib.spawn_command_line_async('gnome-control-center screen');
        });
    }
}


function init() {
//do nothing
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
