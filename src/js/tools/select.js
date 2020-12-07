import app from './../app.js';
import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import Base_selection_class from './../core/base-selection.js';
import Helper_class from './../libs/helpers.js';
import Dialog_class from './../libs/popup.js';

class Select_tool_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.POP = new Dialog_class();
		this.Helper = new Helper_class();
		this.ctx = ctx;
		this.name = 'select';
		this.saved = false;
		this.mousedown_dimensions = { x: null, y: null, width: null, height: null };
		this.keyboard_move_start_position = null;
		this.moving = false;
		this.resizing = false;
		var sel_config = {
			enable_background: false,
			enable_borders: true,
			enable_controls: true,
			keep_ratio: true,
			data_function: function () {
				return config.layer;
			},
		};
		this.Base_selection = new Base_selection_class(ctx, sel_config, this.name);
	}

	dragStart(event) {
		if (config.TOOL.name != this.name)
			return;
		this.mousedown(event);
	}

	dragMove(event) {
		if (config.TOOL.name != this.name)
			return;
		this.mousemove(event);
	}

	dragEnd(event) {
		if (config.TOOL.name != this.name)
			return;
		this.mouseup(event);
	}

	load() {
		var _this = this;

		//mouse events
		document.addEventListener('mousedown', function (event) {
			_this.dragStart(event);
		});
		document.addEventListener('mousemove', function (event) {
			_this.dragMove(event);
		});
		document.addEventListener('mouseup', function (event) {
			_this.dragEnd(event);
		});

		// collect touch events
		document.addEventListener('touchstart', function (event) {
			_this.dragStart(event);
		});
		document.addEventListener('touchmove', function (event) {
			_this.dragMove(event);
		});
		document.addEventListener('touchend', function (event) {
			_this.dragEnd(event);
		});

		//keyboard actions
		document.addEventListener('keydown', (e) => {
			if (config.TOOL.name != this.name)
				return;
			if (this.POP.active == true)
				return;
			if (this.Helper.is_input(e.target))
				return;
			var k = e.keyCode;

			//up
			if (k == 38) {
				this.move(0, -1, e);
			}
			//down
			else if (k == 40) {
				this.move(0, 1, e);
			}
			//right
			else if (k == 39) {
				this.move(1, 0, e);
			}
			//left
			else if (k == 37) {
				this.move(-1, 0, e);
			}
			if (k == 46) {
				//delete
				if (config.TOOL.name == this.name) {
					app.State.do_action(
						new app.Actions.Delete_layer_action(config.layer.id)
					);
				}
			}
		});
		document.addEventListener('keyup', (e) => {
			if (config.TOOL.name != this.name)
				return;
			if (this.POP.active == true)
				return;
			if (this.Helper.is_input(e.target))
				return;
			var k = e.keyCode;
			if ([37, 38, 39, 40].includes(k)) {
				if (this.keyboard_move_start_position) {
					let x = config.layer.x;
					let y = config.layer.y;
					config.layer.x = this.keyboard_move_start_position.x;
					config.layer.y = this.keyboard_move_start_position.y;
					app.State.do_action(
						new app.Actions.Update_layer_action(config.layer.id, { x, y })
					);
					this.keyboard_move_start_position = null;
				}
			}
		});
	}

	async mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false)
			return;

		this.mousedown_dimensions = {
			x: Math.round(config.layer.x),
			y: Math.round(config.layer.y),
			width: Math.round(config.layer.width),
			height: Math.round(config.layer.height)
		};

		if (this.Base_selection.mouse_lock != null) {
			this.resizing = true;
			this.Base_selection.find_settings().keep_ratio = config.layer.type === 'image';
			if (config.layer.type === 'text' && config.layer.params && config.layer.params.boundary === 'dynamic') {
				config.layer.params.boundary = 'box';
			}
		}
		else {
			this.moving = true;
			await this.auto_select_object(e);
			this.Base_selection.find_settings().keep_ratio = config.layer.type === 'image';
			this.saved = false;
		}
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.is_drag == false)
			return;
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}
		if (this.resizing) {
			return;
		}
		else if (this.moving) {
			//move object
			config.layer.x = Math.round(mouse.x - mouse.click_x + this.mousedown_dimensions.x);
			config.layer.y = Math.round(mouse.y - mouse.click_y + this.mousedown_dimensions.y);
			config.need_render = true;
		}
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}
		if (this.resizing) {
			let x = config.layer.x;
			let y = config.layer.y;
			let width = config.layer.width;
			let height = config.layer.height;
			config.layer.x = this.mousedown_dimensions.x;
			config.layer.y = this.mousedown_dimensions.y;
			config.layer.width = this.mousedown_dimensions.width;
			config.layer.height = this.mousedown_dimensions.height;
			if (
				this.mousedown_dimensions.x !== x || this.mousedown_dimensions.y !== y ||
				this.mousedown_dimensions.width !== width || this.mousedown_dimensions.height !== height
			) {
				app.State.do_action(
					new app.Actions.Bundle_action('resize_layer', 'Resize Layer', [
						new app.Actions.Update_layer_action(config.layer.id, {
							x, y, width, height
						})
					])
				);
			}
		}
		else if (this.moving) {
			config.layer.x = this.mousedown_dimensions.x;
			config.layer.y = this.mousedown_dimensions.y;
			const new_x = Math.round(mouse.x - mouse.click_x + this.mousedown_dimensions.x);
			const new_y = Math.round(mouse.y - mouse.click_y + this.mousedown_dimensions.y);
			if (this.mousedown_dimensions.x !== new_x || this.mousedown_dimensions.y !== new_y) {
				app.State.do_action(
					new app.Actions.Bundle_action('move_layer', 'Move Layer', [
						new app.Actions.Update_layer_action(config.layer.id, {
							x: new_x,
							y: new_y
						})
					])
				);
			}
		}
		this.moving = false;
		this.resizing = false;
	}

	move(direction_x, direction_y, event) {
		if (!this.keyboard_move_start_position) {
			this.keyboard_move_start_position = {
				x: config.layer.x,
				y: config.layer.y
			}
		}
		var power = 10;
		if (event.ctrlKey == true || event.metaKey)
			power = 50;
		if (event.shiftKey == true)
			power = 1;

		config.layer.x += direction_x * power;
		config.layer.y += direction_y * power;
		config.need_render = true;
	}

	async auto_select_object(e) {
		var params = this.getParams();
		if (params.auto_select == false)
			return;

		var layers_sorted = this.Base_layers.get_sorted_layers();

		//render main canvas
		for (var i = 0; i < layers_sorted.length; i++) {
			var value = layers_sorted[i];
			var canvas = this.Base_layers.convert_layer_to_canvas(value.id, null, false);

			if (this.check_hit_region(e, canvas.getContext("2d")) == true) {
				await app.State.do_action(
					new app.Actions.Select_layer_action(value.id)
				);
				break;
			}
		}
	}

	check_hit_region(e, ctx) {
		var mouse = this.get_mouse_info(e);
		var data = ctx.getImageData(mouse.x, mouse.y, 1, 1).data;

		var blank = [0, 0, 0, 0];
		if (config.TRANSPARENCY == false) {
			blank = [0, 0, 0, 0];
		}

		if (data[0] != blank[0] || data[1] != blank[1] || data[2] != blank[2]
			|| data[3] != blank[3]) {
			//hit
			return true;
		}

		return false;
	}

}
;
export default Select_tool_class;
