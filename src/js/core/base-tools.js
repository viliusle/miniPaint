/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../config.js';
import Base_layers_class from './base-layers.js';

/**
 * Base tools class, can be used for extending on tools like brush, provides various helping methods.
 */
class Base_tools_class {

	constructor(save_mouse) {
		this.Base_layers = new Base_layers_class();
		this.is_drag = false;
		this.mouse_click_pos = [false, false];
		this.mouse_move_last = [false, false];
		this.canvas_offset = {x: null, y: null};
		this.mouse_valid = false;
		this.mouse_click_valid = false;
		this.speed_average = 0;
		this.save_mouse = save_mouse;

		this.prepare();

		if (this.save_mouse == true) {
			this.events();
		}
	}

	dragStart(event) {
		var _this = this;
		_this.set_mouse_info(event);

		_this.is_drag = true;
		_this.speed_average = 0;
		var mouse = _this.get_mouse_info(event, true);
		_this.mouse_click_pos[0] = mouse.x;
		_this.mouse_click_pos[1] = mouse.y;
	}

	dragMove(event) {
		var _this = this;
		_this.set_mouse_info(event);

		_this.speed_average = _this.calc_average_mouse_speed(event);
	}

	dragEnd(event) {
		var _this = this;
		_this.is_drag = false;
		_this.set_mouse_info(event);
	}

	events() {
		var _this = this;
		
		//collect mouse info
		document.addEventListener('mousedown', function (event) {
			_this.dragStart(event);
		});
		document.addEventListener('mousemove', function (event) {
			_this.dragMove(event);
		});
		document.addEventListener('mouseup', function (event) {
			_this.dragEnd(event);
		});

		// collect touch info
		document.addEventListener('touchstart', function (event) {
			_this.dragStart(event);
		});
		document.addEventListener('touchmove', function (event) {
			_this.dragMove(event);
			if (event.target.id === "canvas_minipaint" && !$('.scroll').has($(event.target)).length)
				event.preventDefault();
		}, {passive: false});
		document.addEventListener('touchend', function (event) {
			_this.dragEnd(event);
		});
		
		//on resize
		window.addEventListener('resize', function (event) {
			_this.prepare();
		});
	}

	/**
	 * do preparation
	 */
	prepare() {
		//calc canvas position offset
		var bodyRect = document.body.getBoundingClientRect();
		var canvas_el = document.getElementById('canvas_minipaint').getBoundingClientRect();
		this.canvas_offset.x = canvas_el.left - bodyRect.left;
		this.canvas_offset.y = canvas_el.top - bodyRect.top;

		this.is_drag = config.mouse.is_drag;
	}

	set_mouse_info(event) {
		if (this.save_mouse !== true) {
			//not main
			return false;
		}

		var eventType = event.type;

		if (event.target.id != "canvas_minipaint") {
			//outside canvas
			this.mouse_valid = false;
		}
		else {
			this.mouse_valid = true;
		}

		if (eventType === 'mousedown' || eventType === 'touchstart') {
			if (event.target.id != "canvas_minipaint" || (event.which != 1 && eventType !== 'touchstart'))
				this.mouse_click_valid = false;
			else
				this.mouse_click_valid = true;
			this.mouse_valid = true;
		}

		if (event != undefined && event.changedTouches) {
			//using touch events
			event = event.changedTouches[0];
		}

		var mouse_x = event.pageX - this.canvas_offset.x;
		var mouse_y = event.pageY - this.canvas_offset.y;

		//adapt coords to ZOOM
		var global_pos = this.Base_layers.get_world_coords(mouse_x, mouse_y);
		mouse_x = global_pos.x;
		mouse_y = global_pos.y;

		var start_pos = this.Base_layers.get_world_coords(0, 0);
		var x_rel = mouse_x - start_pos.x;
		var y_rel = mouse_y - start_pos.y;

		//save
		config.mouse = {
			x: mouse_x,
			y: mouse_y,
			x_rel: x_rel,
			y_rel: y_rel,
			click_x: this.mouse_click_pos[0],
			click_y: this.mouse_click_pos[1],
			last_x: this.mouse_move_last[0],
			last_y: this.mouse_move_last[1],
			valid: this.mouse_valid,
			click_valid: this.mouse_click_valid,
			is_drag: this.is_drag,
			speed_average: this.speed_average,
		};

		if (eventType === 'mousemove' || eventType === 'touchmove') {
			//save last pos
			this.mouse_move_last[0] = mouse_x;
			this.mouse_move_last[1] = mouse_y;
		}
	}

	get_mouse_info() {
		return config.mouse;
	}

	calc_average_mouse_speed(event) {
		if (this.is_drag == false)
			return null;

		//calc average speed
		var avg_speed_max = 30;
		var avg_speed_changing_power = 2;
		var mouse = this.get_mouse_info(event, true);

		var dx = Math.abs(mouse.x - mouse.last_x);
		var dy = Math.abs(mouse.y - mouse.last_y);
		var delta = Math.sqrt(dx * dx + dy * dy);
		var mouse_average_speed = this.speed_average;
		if (delta > avg_speed_max / 2) {
			mouse_average_speed += avg_speed_changing_power;
		}
		else {
			mouse_average_speed -= avg_speed_changing_power;
		}
		mouse_average_speed = Math.max(0, mouse_average_speed); //min
		mouse_average_speed = Math.min(avg_speed_max, mouse_average_speed); //max

		return mouse_average_speed;
	}

	get_params_hash() {
		var data = [
			this.getParams(),
			config.COLOR,
			config.ALPHA,
		];
		return JSON.stringify(data);
	}

	clone(object) {
		return JSON.parse(JSON.stringify(object));
	}

	/**
	 * customized mouse cursor
	 *
	 * @param {int} x
	 * @param {int} y
	 * @param {int} size
	 * @param {string} type circle, rect
	 */
	show_mouse_cursor(x, y, size, type) {

		//fix coordinates, because of scroll
		var start_pos = this.Base_layers.get_world_coords(0, 0);
		x = x - start_pos.x;
		y = y - start_pos.y;

		var element = document.getElementById('mouse');
		size = size * config.ZOOM;
		x = x * config.ZOOM;
		y = y * config.ZOOM;

		if (size < 5) {
			//too small
			element.className = '';
			return;
		}

		element.style.width = size + 'px';
		element.style.height = size + 'px';

		element.style.left = x - Math.ceil(size / 2) + 'px';
		element.style.top = y - Math.ceil(size / 2) + 'px';

		//add style
		element.className = '';
		element.classList.add(type);
	}

	getParams() {
		return config.TOOL.attributes;
	}

	adaptSize(value, type = "width") {
		var response;
		if (config.layer.width_original == null) {
			return value;
		}

		if (type === "width") {
			response = value / (config.layer.width / config.layer.width_original);
		}
		else {
			response = value / (config.layer.height / config.layer.height_original);
		}

		return response;
	}

}
export default Base_tools_class;
