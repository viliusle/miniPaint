/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../config.js';
import Base_layers_class from './base-layers.js';
import Base_gui_class from './base-gui.js';
import app from "../app";
import Helper_class from "../libs/helpers";

/**
 * Base tools class, can be used for extending on tools like brush, provides various helping methods.
 */
class Base_tools_class {

	constructor(save_mouse) {
		this.Base_layers = new Base_layers_class();
		this.Base_gui = new Base_gui_class();
		this.Helper = new Helper_class();
		this.is_drag = false;
		this.mouse_last_click_pos = [false, false];
		this.mouse_click_pos = [false, false];
		this.mouse_move_last = [false, false];
		this.mouse_valid = false;
		this.mouse_click_valid = false;
		this.speed_average = 0;
		this.save_mouse = save_mouse;
		this.is_touch = false;

		this.prepare();

		if (this.save_mouse == true) {
			this.events();
		}
	}

	dragStart(event) {
		var _this = this;

		var mouse = _this.get_mouse_info(event, true);
		_this.mouse_click_pos[0] = mouse.x;
		_this.mouse_click_pos[1] = mouse.y;

		//update
		_this.set_mouse_info(event);

		_this.is_drag = true;
		_this.speed_average = 0;

		var mouse = _this.get_mouse_info(event, true);
		_this.mouse_last_click_pos[0] = mouse.x;
		_this.mouse_last_click_pos[1] = mouse.y;
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
			if(_this.is_touch == true)
				return;

			_this.dragStart(event);
		});
		document.addEventListener('mousemove', function (event) {
			if(_this.is_touch == true)
				return;

			_this.dragMove(event);
		});
		document.addEventListener('mouseup', function (event) {
			if(_this.is_touch == true)
				return;

			_this.dragEnd(event);
		});

		// collect touch info
		document.addEventListener('touchstart', function (event) {
			_this.is_touch = true;
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

		if (event.changedTouches) {
			//using touch events
			event = event.changedTouches[0];
		}

		var mouse_coords = this.get_mouse_coordinates_from_event(event);
		var mouse_x = mouse_coords.x;
		var mouse_y = mouse_coords.y;

		var start_pos = this.Base_layers.get_world_coords(0, 0);
		var x_rel = mouse_x - start_pos.x;
		var y_rel = mouse_y - start_pos.y;

		//save
		config.mouse = {
			x: mouse_x,
			y: mouse_y,
			x_rel: x_rel,
			y_rel: y_rel,
			last_click_x: this.mouse_last_click_pos[0], //last click
			last_click_y: this.mouse_last_click_pos[1], //last click
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

	get_mouse_coordinates_from_event(event){
		var mouse_x = event.pageX - this.Base_gui.canvas_offset.x;
		var mouse_y = event.pageY - this.Base_gui.canvas_offset.y;

		//adapt coords to ZOOM
		var global_pos = this.Base_layers.get_world_coords(mouse_x, mouse_y);
		mouse_x = global_pos.x;
		mouse_y = global_pos.y;

		return {
			x: mouse_x,
			y: mouse_y,
		};
	}

	get_mouse_info(event) {
		if(typeof event != "undefined" && typeof mouse.x == "undefined"){
			//mouse not set yet - set it now...
			this.set_mouse_info(event);
		}
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
		const params = {};
		// Number inputs return the .value if defined as objects.
		for (let attributeName in config.TOOL.attributes) {
			const attribute = config.TOOL.attributes[attributeName];
			if (!isNaN(attribute.value) && attribute.value != null) {
				if (typeof attribute.value === 'string') {
					params[attributeName] = attribute;
				} else {
					params[attributeName] = attribute.value;
				}
			} else {
				params[attributeName] = attribute;
			}
		}
		return params;
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

	draw_shape(ctx, x, y, width, height, coords, is_demo) {
		if(is_demo !== false) {
			ctx.fillStyle = '#aaa';
			ctx.strokeStyle = '#555';
			ctx.lineWidth = 2;
		}
		ctx.lineJoin = "round";

		ctx.beginPath();
		for(var i in coords){
			if(coords[i] === null){
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
				ctx.beginPath();
				continue;
			}

			//coords in 100x100 box
			var pos_x = x + coords[i][0] * width / 100;
			var pos_y = y + coords[i][1] * height / 100;

			if(i == '0')
				ctx.moveTo(pos_x, pos_y);
			else
				ctx.lineTo(pos_x, pos_y);
		}
		ctx.closePath();

		ctx.fill();
		ctx.stroke();
	}

	default_events(){
		var _this = this;

		//mouse events
		document.addEventListener('mousedown', function (event) {
			_this.default_dragStart(event);
		});
		document.addEventListener('mousemove', function (event) {
			_this.default_dragMove(event);
		});
		document.addEventListener('mouseup', function (event) {
			_this.default_dragEnd(event);
		});

		// collect touch events
		document.addEventListener('touchstart', function (event) {
			_this.default_dragStart(event);
		});
		document.addEventListener('touchmove', function (event) {
			_this.default_dragMove(event);
		});
		document.addEventListener('touchend', function (event) {
			_this.default_dragEnd(event);
		});
	}

	default_dragStart(event) {
		if (config.TOOL.name != this.name)
			return;
		this.mousedown(event);
	}

	default_dragMove(event) {
		if (config.TOOL.name != this.name)
			return;
		this.mousemove(event);
	}

	default_dragEnd(event) {
		if (config.TOOL.name != this.name)
			return;
		this.mouseup(event);
	}

	shape_mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false)
			return;

		//register new object - current layer is not ours or params changed
		this.layer = {
			type: this.name,
			params: this.clone(this.getParams()),
			status: 'draft',
			render_function: [this.name, 'render'],
			x: Math.round(mouse.x),
			y: Math.round(mouse.y),
			color: null,
			is_vector: true
		};
		app.State.do_action(
			new app.Actions.Bundle_action('new_'+this.name+'_layer', 'New '+this.Helper.ucfirst(this.name)+' Layer', [
				new app.Actions.Insert_layer_action(this.layer)
			])
		);
	}

	shape_mousemove(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();

		if (mouse.is_drag == false)
			return;
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}

		var mouse_x = Math.round(mouse.x);
		var mouse_y = Math.round(mouse.y);
		var click_x = Math.round(mouse.click_x);
		var click_y = Math.round(mouse.click_y);
		var x = Math.min(mouse_x, click_x);
		var y = Math.min(mouse_y, click_y);
		var width = Math.abs(mouse_x - click_x);
		var height = Math.abs(mouse_y - click_y);

		if (e.ctrlKey == true || e.metaKey) {
			if (width  < height * this.best_ratio) {
				width = height * this.best_ratio;
			}
			else {
				height = width / this.best_ratio;
			}
			if (mouse_x < click_x) {
				x = click_x - width;
			}
			if (mouse_y < click_y) {
				y = click_y - height;
			}
		}

		//more data
		config.layer.x = x;
		config.layer.y = y;
		config.layer.width = width;
		config.layer.height = height;
		this.Base_layers.render();
	}

	shape_mouseup(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();

		if (mouse.valid == false || mouse.click_valid == false) {
			config.layer.status = null;
			return;
		}

		var mouse_x = Math.round(mouse.x);
		var mouse_y = Math.round(mouse.y);
		var click_x = Math.round(mouse.click_x);
		var click_y = Math.round(mouse.click_y);
		var x = Math.min(mouse_x, click_x);
		var y = Math.min(mouse_y, click_y);
		var width = Math.abs(mouse_x - click_x);
		var height = Math.abs(mouse_y - click_y);

		if (e.ctrlKey == true || e.metaKey) {
			if (width  < height * this.best_ratio) {
				width = height * this.best_ratio;
			}
			else {
				height = width / this.best_ratio;
			}
			if (mouse_x < click_x) {
				x = click_x - width;
			}
			if (mouse_y < click_y) {
				y = click_y - height;
			}
		}

		if (width == 0 && height == 0) {
			//same coordinates - cancel
			app.State.scrap_last_action();
			return;
		}

		//more data
		app.State.do_action(
			new app.Actions.Update_layer_action(config.layer.id, {
				x,
				y,
				width,
				height,
				status: null
			}),
			{ merge_with_history: 'new_'+this.name+'_layer' }
		);
	}

}
export default Base_tools_class;
