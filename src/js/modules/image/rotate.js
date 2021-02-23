import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Base_layers_class from './../../core/base-layers.js';
import Base_gui_class from './../../core/base-gui.js';
import Helper_class from './../../libs/helpers.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import app from '../../app.js';

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
		this.Helper = new Helper_class();
		this.Dialog = new Dialog_class();

		this.set_events();
	}

	set_events() {
		document.addEventListener('keydown', (event) => {
			var code = event.keyCode;
			if (this.Helper.is_input(event.target))
				return;

			if (code == 76) {
				//L - rotate left
				this.left();
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
				_this.rotate_handler(params);
			},
			on_cancel: function (params) {
				config.layer.rotate = initial_angle;
				config.need_render = true;
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
		let new_rotate = value;

		if (can_resize == true) {
			app.State.do_action(
				new app.Actions.Bundle_action('rotate_layer', 'Rotate Layer', [
					new app.Actions.Update_layer_action(config.layer.id, {
						rotate: new_rotate
					}),
					...this.check_sizes(new_rotate)
				])
			);
		} else {
			config.layer.rotate = new_rotate;
			config.need_render = true;
		}
	}

	left() {
		let new_rotate = config.layer.rotate;
		new_rotate -= 90;
		if (new_rotate < 0)
			new_rotate = 360 + new_rotate;

		app.State.do_action(
			new app.Actions.Bundle_action('rotate_layer', 'Rotate Layer', [
				new app.Actions.Update_layer_action(config.layer.id, {
					rotate: new_rotate
				}),
				...this.check_sizes(new_rotate)
			])
		);
	}

	right() {
		let new_rotate = config.layer.rotate;
		new_rotate += 90;
		if (new_rotate >= 360)
			new_rotate = new_rotate - 360;

		app.State.do_action(
			new app.Actions.Bundle_action('rotate_layer', 'Rotate Layer', [
				new app.Actions.Update_layer_action(config.layer.id, {
					rotate: new_rotate
				}),
				...this.check_sizes(new_rotate)
			])
		);
	}

	/**
	 * Makes sure image fits all after rotation
	 * @returns {array} actions to perform
	 */
	check_sizes(new_rotate) {
		let actions = [];
		var w = config.layer.width;
		var h = config.layer.height;

		var o = new_rotate * Math.PI / 180;
		var new_x = w * Math.abs(Math.cos(o)) + h * Math.abs(Math.sin(o));
		var new_y = w * Math.abs(Math.sin(o)) + h * Math.abs(Math.cos(o));

		//round values
		new_x = Math.ceil(Math.round(new_x * 1000) / 1000);
		new_y = Math.ceil(Math.round(new_y * 1000) / 1000);

		if (new_x > config.WIDTH || new_y > config.HEIGHT) {
			var dx = 0;
			var dy = 0;
			let new_width = config.WIDTH;
			let new_height = config.HEIGHT;
			if (new_x > config.WIDTH) {
				dx = Math.ceil(new_x - new_width) / 2;
				new_width = new_x;
			}
			if (new_y > config.HEIGHT) {
				dy = Math.ceil(new_y - new_height) / 2;
				new_height = new_y;
			}
			actions.push(
				new app.Actions.Prepare_canvas_action('undo'),
				new app.Actions.Update_layer_action(config.layer.id, {
					x: config.layer.x + dx,
					y: config.layer.y + dy
				}),
				new app.Actions.Update_config_action({
					WIDTH: new_width,
					HEIGHT: new_height
				}),
				new app.Actions.Prepare_canvas_action('do')
			);
		}
		return actions;
	}
}

export default Image_rotate_class;