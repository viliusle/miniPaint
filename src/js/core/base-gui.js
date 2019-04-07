/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../config.js';
import GUI_tools_class from './gui/gui-tools.js';
import GUI_preview_class from './gui/gui-preview.js';
import GUI_colors_class from './gui/gui-colors.js';
import GUI_layers_class from './gui/gui-layers.js';
import GUI_information_class from './gui/gui-information.js';
import GUI_details_class from './gui/gui-details.js';
import GUI_menu_class from './gui/gui-menu.js';
import Help_translate_class from './../modules/help/translate.js';
import Helper_class from './../libs/helpers.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';

var instance = null;

/**
 * Main GUI class
 */
class Base_gui_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Helper = new Helper_class();

		//last used menu id
		this.last_menu = '';

		//grid dimensions config
		this.grid_size = [50, 50];

		//if grid is visible
		this.grid = false;

		//common image dimensions
		this.common_dimensions = [
			[640, 480, '480p'],
			[800, 600, 'SVGA'],
			[1024, 768, 'XGA'],
			[1280, 720, 'hdtv, 720p'],
			[1600, 1200, 'UXGA'],
			[1920, 1080, 'Full HD, 1080p'],
			[3840, 2160, '4K UHD'],
			//[7680,4320, '8K UHD'],
		];

		this.GUI_tools = new GUI_tools_class(this);
		this.GUI_preview = new GUI_preview_class(this);
		this.GUI_colors = new GUI_colors_class(this);
		this.GUI_layers = new GUI_layers_class(this);
		this.GUI_information = new GUI_information_class(this);
		this.GUI_details = new GUI_details_class(this);
		this.GUI_menu = new GUI_menu_class();
		this.Help_translate = new Help_translate_class();
		this.modules = {};
	}

	load_modules() {
		var _this = this;
		var modules_context = require.context("./../modules/", true, /\.js$/);
		modules_context.keys().forEach(function (key) {
			if (key.indexOf('Base' + '/') < 0) {
				var moduleKey = key.replace('./', '').replace('.js', '');
				var classObj = modules_context(key);
				_this.modules[moduleKey] = new classObj.default();
			}
		});
	}

	load_default_values() {
		//transparency
		var transparency_cookie = this.Helper.getCookie('transparency');
		if (transparency_cookie === null) {
			//default
			config.TRANSPARENCY = false;
		}
		if (transparency_cookie) {
			config.TRANSPARENCY = true;
		}
		else {
			config.TRANSPARENCY = false;
		}
		
		//transparency_type
		var transparency_type = this.Helper.getCookie('transparency_type');
		if (transparency_type === null) {
			//default
			config.TRANSPARENCY_TYPE = 'squares';
		}
		if (transparency_type) {
			config.TRANSPARENCY_TYPE = transparency_type;
		}
	}

	render_main_gui() {
		this.autodetect_dimensions();

		this.change_theme();
		this.prepare_canvas();
		this.GUI_tools.render_main_tools();
		this.GUI_preview.render_main_preview();
		this.GUI_colors.render_main_colors();
		this.GUI_layers.render_main_layers();
		this.GUI_information.render_main_information();
		this.GUI_details.render_main_details();
		this.GUI_menu.render_main();
		this.load_saved_changes();

		this.set_events();
		this.load_translations();
	}

	set_events() {
		var _this = this;
		//menu events
		var targets = document.querySelectorAll('#main_menu a');
		for (var i = 0; i < targets.length; i++) {
			if (targets[i].dataset.target == undefined)
				continue;
			targets[i].addEventListener('click', function (event) {
				var parts = this.dataset.target.split('.');
				var module = parts[0];
				var function_name = parts[1];
				var param = parts[2];

				//close menu
				var menu = document.querySelector('#main_menu .selected');
				if (menu != undefined) {
					menu.click();
				}

				//call module
				if (_this.modules[module] == undefined) {
					alertify.error('Modules class not found: ' + module);
					return;
				}
				if (_this.modules[module][function_name] == undefined) {
					alertify.error('Module function not found. ' + module + '.' + function_name);
					return;
				}
				_this.modules[module][function_name](param);
			});
		}

		//registerToggleAbility
		var targets = document.querySelectorAll('.toggle');
		for (var i = 0; i < targets.length; i++) {
			if (targets[i].dataset.target == undefined)
				continue;
			targets[i].addEventListener('click', function (event) {
				this.classList.toggle('toggled');
				var target = document.getElementById(this.dataset.target);
				target.classList.toggle('hidden');
				//save
				if (_this.Helper.strpos(target.classList, 'hidden') === false)
					_this.Helper.setCookie(this.dataset.target, 1);
				else
					_this.Helper.setCookie(this.dataset.target, 0);
			});
		}

		document.getElementById('mobile_menu_button').addEventListener('click', function (event) {
			document.querySelector('.sidebar_right').classList.toggle('active');
		});
		window.addEventListener('resize', function (event) {
			//resize
			_this.prepare_canvas();
			config.need_render = true;
		}, false);
	}

	prepare_canvas() {
		var canvas = document.getElementById('canvas_minipaint');
		var ctx = canvas.getContext("2d");

		var wrapper = document.getElementById('main_wrapper');
		var page_w = wrapper.clientWidth;
		var page_h = wrapper.clientHeight;

		var w = Math.min(Math.ceil(config.WIDTH * config.ZOOM), page_w);
		var h = Math.min(Math.ceil(config.HEIGHT * config.ZOOM), page_h);

		canvas.width = w;
		canvas.height = h;

		config.visible_width = w;
		config.visible_height = h;

		ctx.webkitImageSmoothingEnabled = false;
		ctx.oImageSmoothingEnabled = false;
		ctx.msImageSmoothingEnabled = false;
		ctx.imageSmoothingEnabled = false;

		this.render_canvas_background('canvas_minipaint');

		//change wrapper dimensions
		document.getElementById('canvas_wrapper').style.width = w + 'px';
		document.getElementById('canvas_wrapper').style.height = h + 'px';
	}

	load_saved_changes() {
		var targets = document.querySelectorAll('.toggle');
		for (var i = 0; i < targets.length; i++) {
			if (targets[i].dataset.target == undefined)
				continue;

			var target = document.getElementById(targets[i].dataset.target);
			var saved = this.Helper.getCookie(targets[i].dataset.target);
			if (saved === 0) {
				targets[i].classList.toggle('toggled');
				target.classList.add('hidden');
			}
		}
	}

	load_translations() {
		var lang = this.Helper.getCookie('language');
		
		//load from params
		var params = this.Helper.get_url_parameters();
		if(params.lang != undefined){
			lang = params.lang.replace(/([^a-z]+)/gi, '');
		}
		
		if (lang != null && lang != config.LANG) {
			config.LANG = lang.replace(/([^a-z]+)/gi, '');
			this.Help_translate.translate(config.LANG);
		}
	}

	autodetect_dimensions() {
		var wrapper = document.getElementById('main_wrapper');
		var page_w = wrapper.clientWidth;
		var page_h = wrapper.clientHeight;
		var auto_size = false;

		var save_resolution_cookie = this.Helper.getCookie('save_resolution');
		var last_resolution = this.Helper.getCookie('last_resolution');
		if (save_resolution_cookie != null && save_resolution_cookie != ''
			&& last_resolution != null && last_resolution != '') {
			//load last saved resolution
			last_resolution = JSON.parse(last_resolution);
			config.WIDTH = parseInt(last_resolution[0]);
			config.HEIGHT = parseInt(last_resolution[1]);
		}
		else {
			//use largest possible
			for (var i = this.common_dimensions.length - 1; i >= 0; i--) {
				if (this.common_dimensions[i][0] > page_w
					|| this.common_dimensions[i][1] > page_h) {
					//browser size is too small
					continue;
				}
				config.WIDTH = parseInt(this.common_dimensions[i][0]);
				config.HEIGHT = parseInt(this.common_dimensions[i][1]);
				auto_size = true;
				break;
			}

			if (auto_size == false) {
				//screen size is smaller then 400x300
				config.WIDTH = parseInt(page_w) - 5;
				config.HEIGHT = parseInt(page_h) - 10;
				if (page_w < 585) {
					config.HEIGHT = config.HEIGHT - 15;
				}
			}
		}
	}

	render_canvas_background(canvas_id, gap) {
		if (gap == undefined)
			gap = 10;

		var target = document.getElementById(canvas_id + '_background');

		if (config.TRANSPARENCY == false) {
			target.className = 'transparent-grid white';
			return false;
		}
		else{
			target.className = 'transparent-grid ' + config.TRANSPARENCY_TYPE;
		}
		target.style.backgroundSize = (gap * 2) + 'px auto';
	}

	draw_grid(ctx) {
		if (this.grid == false)
			return;

		var gap_x = this.grid_size[0];
		var gap_y = this.grid_size[1];

		var width = config.WIDTH;
		var height = config.HEIGHT;

		//size
		if (gap_x != undefined && gap_y != undefined)
			this.grid_size = [gap_x, gap_y];
		else {
			gap_x = this.grid_size[0];
			gap_y = this.grid_size[1];
		}
		gap_x = parseInt(gap_x);
		gap_y = parseInt(gap_y);
		ctx.lineWidth = 1;
		ctx.beginPath();
		if (gap_x < 2)
			gap_x = 2;
		if (gap_y < 2)
			gap_y = 2;
		for (var i = gap_x; i < width; i = i + gap_x) {
			if (gap_x == 0)
				break;
			if (i % (gap_x * 5) == 0) {
				//main lines
				ctx.strokeStyle = '#222222';
			}
			else {
				//small lines
				ctx.strokeStyle = '#bbbbbb';
			}
			ctx.beginPath();
			ctx.moveTo(0.5 + i, 0);
			ctx.lineTo(0.5 + i, height);
			ctx.stroke();
		}
		for (var i = gap_y; i < height; i = i + gap_y) {
			if (gap_y == 0)
				break;
			if (i % (gap_y * 5) == 0) {
				//main lines
				ctx.strokeStyle = '#222222';
			}
			else {
				//small lines
				ctx.strokeStyle = '#bbbbbb';
			}
			ctx.beginPath();
			ctx.moveTo(0, 0.5 + i);
			ctx.lineTo(width, 0.5 + i);
			ctx.stroke();
		}
	}
	
	/**
	 * change draw area size
	 * 
	 * @param {int} width
	 * @param {int} height
	 */
	set_size(width, height) {
		config.WIDTH = parseInt(width);
		config.HEIGHT = parseInt(height);
		this.prepare_canvas();
	}
	
	/**
	 * 
	 * @returns {object} keys: width, height
	 */
	get_visible_area_size() {
		var wrapper = document.getElementById('main_wrapper');
		var page_w = wrapper.clientWidth;
		var page_h = wrapper.clientHeight;
		
		//find visible size in pixels, but make sure its correct even if image smaller then screen
		var w = Math.min(Math.ceil(config.WIDTH * config.ZOOM), Math.ceil(page_w / config.ZOOM));
		var h = Math.min(Math.ceil(config.HEIGHT * config.ZOOM), Math.ceil(page_h / config.ZOOM));
		
		return {
			width: w,
			height: h,
		};
	}

	/**
	 * change theme or set automatically from cookie if possible
	 * 
	 * @param {string} theme_name
	 */
	change_theme(theme_name){
		if(theme_name == undefined){
			//auto detect
			var theme_cookie = this.Helper.getCookie('theme');
			if (theme_cookie) {
				theme_name = theme_cookie;
			}
			else {
				theme_name = config.themes[0];
			}
		}

		for(var i in config.themes){
			document.querySelector('body').classList.remove('theme-' +  config.themes[i]);
		}
		document.querySelector('body').classList.add('theme-' + theme_name);
	}

}

export default Base_gui_class;
