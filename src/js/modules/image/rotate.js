import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Base_layers_class from './../../core/base-layers.js';
import Base_gui_class from './../../core/base-gui.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

var instance = null;

class Image_rotate_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Base_layers = new Base_layers_class();
		this.Base_gui = new Base_gui_class();
		this.Dialog = new Dialog_class();

		this.set_events();
	}

	set_events() {
		var _this = this;

		document.addEventListener('keydown', function (event) {
			var code = event.keyCode;
			if (event.target.type == 'text' || event.target.tagName == 'INPUT' || event.target.type == 'textarea')
				return;

			if (code == 76) {
				//L - rotate left
				_this.left();
				event.preventDefault();
			}
		}, false);
	}

	rotate() {
		var _this = this;

		if (config.layer.rotate === null) {
			alertify.error('Rotate is not supported on this type of object. Convert to raster?');
			return;
		}

		var angles = ['Custom', '0', '90', '180', '270'];
		var initial_angle = config.layer.rotate;

		var settings = {
			title: 'Rotate',
			params: [
				{name: "rotate", title: "Rotate:", value: config.layer.rotate, range: [0, 360]},
				{name: "right_angle", title: "Right angle:", values: angles},
			],
			on_change: function (params, canvas_preview, w, h) {
				_this.rotate_handler(params, false);
			},
			on_finish: function (params) {
				config.layer.rotate = initial_angle;
				window.State.save();
				_this.rotate_handler(params);
			},
		};
		this.Dialog.show(settings);
	}

	rotate_handler(data, can_resize = true) {
		var value = parseInt(data.rotate);
		if (data.right_angle != 'Custom') {
			value = parseInt(data.right_angle);
		}

		if (value < 0)
			value = 360 + value;
		if (value >= 360)
			value = value - 360;
		config.layer.rotate = value;

		if (can_resize == true) {
			this.check_sizes();
		}
		config.need_render = true;
	}

	left() {
		config.layer.rotate -= 90;
		if (config.layer.rotate < 0)
			config.layer.rotate = 360 + config.layer.rotate;

		this.check_sizes();
		config.need_render = true;
	}

	right() {
		config.layer.rotate += 90;
		if (config.layer.rotate >= 360)
			config.layer.rotate = config.layer.rotate - 360;

		this.check_sizes();
		config.need_render = true;
	}

	/**
	 * makes sure image fits all after rotation
	 */
	check_sizes() {
		var w = config.layer.width;
		var h = config.layer.height;

		var o = config.layer.rotate * Math.PI / 180;
		var new_x = w * Math.abs(Math.cos(o)) + h * Math.abs(Math.sin(o));
		var new_y = w * Math.abs(Math.sin(o)) + h * Math.abs(Math.cos(o));

		//round values
		new_x = Math.ceil(Math.round(new_x * 1000) / 1000);
		new_y = Math.ceil(Math.round(new_y * 1000) / 1000);

		if (new_x > config.WIDTH || new_y > config.HEIGHT) {
			var dx = 0;
			var dy = 0;
			if (new_x > config.WIDTH) {
				dx = Math.ceil(new_x - config.WIDTH) / 2;
				config.WIDTH = new_x;
			}
			if (new_y > config.HEIGHT) {
				dy = Math.ceil(new_y - config.HEIGHT) / 2;
				config.HEIGHT = new_y;
			}
			config.layer.x += dx;
			config.layer.y += dy;

			this.Base_gui.prepare_canvas();
			config.need_render = true;
		}
	}
}

export default Image_rotate_class;