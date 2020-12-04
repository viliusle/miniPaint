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
		this.last_post = {x: null, y: null};

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
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousedown(event);
	}

	dragMove(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousemove(event);
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

		// collect touch events
		document.addEventListener('touchstart', function (event) {
			_this.dragStart(event);
		});
		document.addEventListener('touchmove', function (event) {
			_this.dragMove(event);
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
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false)
			return;
		if (this.Base_selection.mouse_lock != null) {
			this.Base_selection.find_settings().keep_ratio = config.layer.type === 'image';
			if (config.layer.type === 'text' && config.layer.params && config.layer.params.boundary === 'dynamic') {
				config.layer.params.boundary = 'box';
			}
			return;
		}

		this.auto_select_object(e);
		this.Base_selection.find_settings().keep_ratio = config.layer.type === 'image';
		this.saved = false;

		this.last_post = {
			x: config.layer.x,
			y: config.layer.y,
		};
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.is_drag == false)
			return;
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}
		if (this.Base_selection.mouse_lock != null)
			return;

		if (this.saved == false) {
			window.State.save();
			this.saved = true;
		}

		//move object
		config.layer.x = Math.round(mouse.x - mouse.click_x + this.last_post.x);
		config.layer.y = Math.round(mouse.y - mouse.click_y + this.last_post.y);

		this.Base_layers.render();
	}

	move(direction_x, direction_y, event) {
		var power = 10;
		if (event.ctrlKey == true || event.metaKey)
			power = 50;
		if (event.shiftKey == true)
			power = 1;

		config.layer.x += direction_x * power;
		config.layer.y += direction_y * power;
		config.need_render = true;
	}

	auto_select_object(e) {
		var params = this.getParams();
		if (params.auto_select == false)
			return;

		var layers_sorted = this.Base_layers.get_sorted_layers();

		//render main canvas
		for (var i = 0; i < layers_sorted.length; i++) {
			var value = layers_sorted[i];
			var canvas = this.Base_layers.convert_layer_to_canvas(value.id, null, false);

			if (this.check_hit_region(e, canvas.getContext("2d")) == true) {
				app.State.do_action(
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
