/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../../config.js';
import Base_layers_class from './../base-layers.js';
import Tools_settings_class from './../../modules/tools/settings.js';
import Helper_class from './../../libs/helpers.js';

var template = `
	<span class="trn label">Size:</span>
	<span id="mouse_info_size">-</span>
	<br />
	<span class="trn label">Mouse:</span>
	<span id="mouse_info_mouse">-</span>
`;

/**
 * GUI class responsible for rendering information block on right sidebar
 */
class GUI_information_class {

	constructor(ctx) {
		this.Base_layers = new Base_layers_class();
		this.Tools_settings = new Tools_settings_class();
		this.Helper = new Helper_class();

		this.last_width = null;
		this.last_height = null;
		this.units = this.Tools_settings.get_setting('default_units');
		this.resolution = this.Tools_settings.get_setting('resolution');
	}

	render_main_information() {
		document.getElementById('toggle_info').innerHTML = template;
		this.set_events();
		this.show_size();
	}

	set_events() {
		var _this = this;
		var target = document.getElementById('mouse_info_mouse');

		//show width and height
		//should use canvas resize API in future
		document.addEventListener('mousemove', function (e) {
			_this.show_size();
		}, false);

		//show current mouse position
		document.getElementById('canvas_minipaint').addEventListener('mousemove', function (e) {
			var global_pos = _this.Base_layers.get_world_coords(e.offsetX, e.offsetY);
			var mouse_x = Math.ceil(global_pos.x);
			var mouse_y = Math.ceil(global_pos.y);

			mouse_x = _this.Helper.get_user_unit(mouse_x, _this.units, _this.resolution);
			mouse_y = _this.Helper.get_user_unit(mouse_y, _this.units, _this.resolution);

			target.innerHTML = mouse_x + ', ' + mouse_y;
		}, false);
	}

	update_units(){
		this.units = this.Tools_settings.get_setting('default_units');
		this.resolution = this.Tools_settings.get_setting('resolution');
		this.show_size(true);
	}

	show_size(force) {
		if(force == undefined && this.last_width == config.WIDTH && this.last_height == config.HEIGHT) {
			return;
		}

		var width = this.Helper.get_user_unit(config.WIDTH, this.units, this.resolution);
		var height = this.Helper.get_user_unit(config.HEIGHT, this.units, this.resolution);

		document.getElementById('mouse_info_size').innerHTML = width + ' x ' + height;
		this.last_width = config.WIDTH;
		this.last_height = config.HEIGHT;
	}

}

export default GUI_information_class;
