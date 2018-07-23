import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Helper_class from './../../libs/helpers.js';
import Base_gui_class from './../../core/base-gui.js';

class Tools_settings_class {

	constructor() {
		this.Base_gui = new Base_gui_class();
		this.POP = new Dialog_class();
		this.Helper = new Helper_class();
	}

	settings() {
		var _this = this;

		//transparency
		var transparency_cookie = this.Helper.getCookie('transparency');
		if (transparency_cookie === null) {
			//default
			transparency_cookie = false;
		}
		if (transparency_cookie) {
			var transparency = true;
		}
		else {
			var transparency = false;
		}

		//resolution
		var save_resolution_cookie = this.Helper.getCookie('save_resolution');
		if (save_resolution_cookie) {
			var save_resolution = true;
		}
		else {
			var save_resolution = false;
		}

		//theme
		var theme_cookie = this.Helper.getCookie('theme');
		if (theme_cookie) {
			var theme = theme_cookie;
		}
		else {
			var theme = config.themes[0];
		}	
		
		var t_values = ['squares', 'green', 'grey'];

		var settings = {
			title: 'Settings',
			params: [
				{name: "transparency", title: "Transparent:", value: transparency},
				{name: "transparency_type", title: "Transparency background:", 
					value: config.TRANSPARENCY_TYPE, values: t_values},
				{name: "theme", title: "Theme", values: config.themes, value: theme},
				{name: "save_resolution", title: "Save resolution:", value: save_resolution},
			],
			on_change: function (params) {
				this.Base_gui.change_theme(params.theme);
			},
			on_cancel: function (params) {
				this.Base_gui.change_theme(theme);
			},
			on_finish: function (params) {
				_this.save_values(params);
			},
		};
		this.POP.show(settings);
	}

	save_values(params) {
		var save_resolution = params.save_resolution;
		var transparency = params.transparency;
		var theme = params.theme;

		//save_resolution
		if (save_resolution) {
			this.Helper.setCookie('save_resolution', 1);
		}
		else {
			this.Helper.setCookie('save_resolution', 0);
		}

		//transparency
		if (transparency) {
			this.Helper.setCookie('transparency', 1);
			config.TRANSPARENCY = true;
		}
		else {
			this.Helper.setCookie('transparency', 0);
			config.TRANSPARENCY = false;
		}

		//save theme
		this.Helper.setCookie('theme', theme);
		this.Base_gui.change_theme(theme);
		
		//transparency_type
		config.TRANSPARENCY_TYPE = params.transparency_type;
		this.Helper.setCookie('transparency_type', config.TRANSPARENCY_TYPE);
		
		this.Base_gui.prepare_canvas();
		config.need_render = true;
	}

}

export default Tools_settings_class;