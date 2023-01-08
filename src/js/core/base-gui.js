/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../config.js';
import Base_layers_class from './base-layers.js';
import GUI_tools_class from './gui/gui-tools.js';
import GUI_preview_class from './gui/gui-preview.js';
import GUI_colors_class from './gui/gui-colors.js';
import GUI_layers_class from './gui/gui-layers.js';
import GUI_information_class from './gui/gui-information.js';
import GUI_details_class from './gui/gui-details.js';
import GUI_menu_class from './gui/gui-menu.js';
import Tools_translate_class from './../modules/tools/translate.js';
import Tools_settings_class from './../modules/tools/settings.js';
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
		this.Base_layers = new Base_layers_class();

		//last used menu id
		this.last_menu = '';

		//grid dimensions config
		this.grid_size = [50, 50];

		//if grid is visible
		this.grid = false;

		this.canvas_offset = {x: 0, y: 0};

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
		this.Tools_translate = new Tools_translate_class();
		this.Tools_settings = new Tools_settings_class();
		this.modules = {};
	}

	init() {
		this.load_modules();
		this.load_default_values();
		this.render_main_gui();
		this.init_service_worker();
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

		//snap
		var snap_cookie = this.Helper.getCookie('snap');
		if (snap_cookie === null) {
			//default
			config.SNAP = true;
		}
		else{
			config.SNAP = Boolean(snap_cookie);
		}

		//guides
		var guides_cookie = this.Helper.getCookie('guides');
		if (guides_cookie === null) {
			//default
			config.guides_enabled = true;
		}
		else{
			config.guides_enabled = Boolean(guides_cookie);
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

	init_service_worker() {
		/*if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('./service-worker.js').then(function(reg) {
				//Successfully registered service worker
			}).catch(function(err) {
				console.warn('Error registering service worker', err);
			});
		}*/
	}

	set_events() {
		var _this = this;

		//menu events
		this.GUI_menu.on('select_target', (target, object) => {
			var parts = target.split('.');
			var module = parts[0];
			var function_name = parts[1];
			var param = object.parameter ??= null;

			//call module
			if (this.modules[module] == undefined) {
				alertify.error('Modules class not found: ' + module);
				return;
			}
			if (this.modules[module][function_name] == undefined) {
				alertify.error('Module function not found. ' + module + '.' + function_name);
				return;
			}
			this.modules[module][function_name](param);
		});

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
				if (target.classList.contains('hidden') == false)
					_this.Helper.setCookie(this.dataset.target, 1);
				else
					_this.Helper.setCookie(this.dataset.target, 0);
			});
		}

		document.getElementById('left_mobile_menu_button').addEventListener('click', function (event) {
			document.querySelector('.sidebar_left').classList.toggle('active');
		});
		document.getElementById('mobile_menu_button').addEventListener('click', function (event) {
			document.querySelector('.sidebar_right').classList.toggle('active');
		});
		window.addEventListener('resize', function (event) {
			//resize
			_this.prepare_canvas();
			config.need_render = true;
		}, false);
		this.check_canvas_offset();

		//confirmation on exit
		var exit_confirm = this.Tools_settings.get_setting('exit_confirm');
		window.addEventListener('beforeunload', function (e) {
			if(exit_confirm && (config.layers.length > 1 || _this.Base_layers.is_layer_empty(config.layer.id) == false)){
				e.preventDefault();
				e.returnValue = '';
			}
			return undefined;
		});

		document.getElementById('canvas_minipaint').addEventListener('contextmenu', function (e) {
			e.preventDefault();
		}, false);
	}

	check_canvas_offset() {
		//calc canvas position offset
		var bodyRect = document.body.getBoundingClientRect();
		var canvas_el = document.getElementById('canvas_minipaint').getBoundingClientRect();
		this.canvas_offset.x = canvas_el.left - bodyRect.left;
		this.canvas_offset.y = canvas_el.top - bodyRect.top;
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

		if(config.ZOOM >= 1) {
			ctx.imageSmoothingEnabled = false;
		}
		else{
			ctx.imageSmoothingEnabled = true;
		}

		this.render_canvas_background('canvas_minipaint');

		//change wrapper dimensions
		document.getElementById('canvas_wrapper').style.width = w + 'px';
		document.getElementById('canvas_wrapper').style.height = h + 'px';

		this.check_canvas_offset();
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
			this.Tools_translate.translate(config.LANG);
		}
	}

	autodetect_dimensions() {
		var wrapper = document.getElementById('main_wrapper');
		var page_w = wrapper.clientWidth;
		var page_h = wrapper.clientHeight;
		var auto_size = false;

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
			config.WIDTH = parseInt(page_w) - 15;
			config.HEIGHT = parseInt(page_h) - 10;
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

	draw_guides(ctx){
		if(config.guides_enabled == false){
			return;
		}
		var thick_guides = this.Tools_settings.get_setting('thick_guides');

		for(var i in config.guides) {
			var guide = config.guides[i];

			if (guide.x === 0 || guide.y === 0) {
				continue;
			}

			//set styles
			ctx.strokeStyle = '#00b8b8';
			if(thick_guides == false)
				ctx.lineWidth = 1;
			else
				ctx.lineWidth = 3;

			ctx.beginPath();
			if (guide.y === null) {
				//vertical
				ctx.moveTo(guide.x, 0);
				ctx.lineTo(guide.x, config.HEIGHT);
			}
			if (guide.x === null) {
				//horizontal
				ctx.moveTo(0, guide.y);
				ctx.lineTo(config.WIDTH, guide.y);
			}
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
	change_theme(theme_name = null){
		if(theme_name == null){
			//auto detect
			var theme_cookie = this.Helper.getCookie('theme');
			if (theme_cookie) {
				theme_name = theme_cookie;
			}
			else {
				theme_name = this.Tools_settings.get_setting('theme');
			}
		}

		for(var i in config.themes){
			document.querySelector('body').classList.remove('theme-' + config.themes[i]);
		}
		document.querySelector('body').classList.add('theme-' + theme_name);
	}

	get_language() {
		return config.LANG;
	}

	get_color() {
		return config.COLOR;
	}

	get_alpha() {
		return config.ALPHA;
	}

	get_zoom() {
		return config.ZOOM;
	}

	get_transparency_support() {
		return config.TRANSPARENCY;
	}

	get_active_tool() {
		return config.TOOL;
	}

}

export default Base_gui_class;
