/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../../config.js';
import Base_layers_class from './../base-layers.js';

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
	}

	render_main_information() {
		document.getElementById('toggle_info').innerHTML = template;
		this.set_events();
		this.show_size();
	}

	set_events() {
		var _this = this;
		var target = document.getElementById('mouse_info_mouse');

		//colors
		document.getElementById('canvas_minipaint').addEventListener('mousemove', function (e) {
			var global_pos = _this.Base_layers.get_world_coords(e.offsetX, e.offsetY);
			var mouse_x = Math.ceil(global_pos.x);
			var mouse_y = Math.ceil(global_pos.y);

			target.innerHTML = mouse_x + ', ' + mouse_y;

			_this.show_size();
		}, false);
	}

	show_size() {
		document.getElementById('mouse_info_size').innerHTML = config.WIDTH + ' x ' + config.HEIGHT;
	}

}

export default GUI_information_class;
