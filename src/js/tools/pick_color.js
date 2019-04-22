import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import Helper_class from './../libs/helpers.js';
import Base_gui_class from './../core/base-gui.js';

class Pick_color_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.Base_gui = new Base_gui_class();
		this.ctx = ctx;
		this.name = 'pick_color';
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
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}

		this.pick_color(mouse);
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.is_drag == false || mouse.valid == false || mouse.click_valid == false) {
			return;
		}

		this.pick_color(mouse);
	}

	pick_color(mouse) {
		var params = this.getParams();

		//get canvas from layer
		if (params.global == false) {
			//active layer
			var canvas = this.Base_layers.convert_layer_to_canvas(config.layer.id, null, false);
			var ctx = canvas.getContext("2d");
		}
		else {
			//global
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext("2d");
			canvas.width = config.WIDTH;
			canvas.height = config.HEIGHT;
			this.Base_layers.convert_layers_to_canvas(ctx);
		}
		//find color
		var c = ctx.getImageData(mouse.x, mouse.y, 1, 1).data;
		var hex = this.Helper.rgbToHex(c[0], c[1], c[2]);
		this.Base_gui.GUI_colors.change_color(hex);

		if (c[3] > 0) {
			//set alpha
			this.Base_gui.GUI_colors.change_alpha(c[3]);
		}

		this.Base_gui.GUI_colors.render_colors();
	}

}
;
export default Pick_color_class;
