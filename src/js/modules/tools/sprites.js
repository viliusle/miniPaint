import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import Image_trim_class from './../image/trim.js';
import Base_gui_class from './../../core/base-gui.js';

class Tools_sprites_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Image_trim = new Image_trim_class();
		this.Base_gui = new Base_gui_class();
	}

	sprites() {
		var _this = this;

		var settings = {
			title: 'Sprites',
			params: [
				{name: "gap", title: "Gap:", value: "50", values: ["0", "10", "50", "100"]},
				{name: "width", title: "Width:", value: config.WIDTH},
			],
			on_finish: function (params) {
				window.State.save();
				_this.generate_sprites(params.gap, params.width);
			},
		};
		this.POP.show(settings);
	}

	generate_sprites(gap, sprite_width) {
		gap = parseInt(gap);
		sprite_width = parseInt(sprite_width);

		if (config.layers.length == 1) {
			alertify.error('There is only 1 layer.');
			return false;
		}
		if (sprite_width < config.WIDTH) {
			alertify.error('New width can not be smaller then current width');
			return false;
		}

		var xx = 0;
		var yy = 0;
		var max_height = 0;
		var W = sprite_width;
		var H = config.HEIGHT;

		//prepare width
		config.WIDTH = parseInt(sprite_width);
		this.Base_gui.prepare_canvas();

		//collect trim info
		var trim_details_array = [];
		for (var i = 0; i < config.layers.length; i++) {
			var layer = config.layers[i];
			if (layer.visible == false)
				continue;

			trim_details_array[layer.id] = this.Image_trim.get_trim_info(layer.id);
		}

		//move layers
		for (var i = 0; i < config.layers.length; i++) {
			var layer = config.layers[i];
			if (layer.visible == false)
				continue;

			var trim_details = trim_details_array[layer.id];
			if (config.WIDTH == trim_details.left) {
				//empty layer
				continue;
			}
			var width = W - trim_details.left - trim_details.right;
			var height = H - trim_details.top - trim_details.bottom;

			if (xx + width > sprite_width) {
				xx = 0;
				yy += max_height;
				max_height = 0;
			}
			if (yy % gap > 0 && gap > 0) {
				yy = yy - yy % gap + gap;
			}
			if (yy + height > config.HEIGHT) {
				config.HEIGHT = parseInt(yy + height);
				this.Base_gui.prepare_canvas();
			}

			layer.x = layer.x + xx - trim_details.left;
			layer.y = layer.y + yy - trim_details.top;

			xx += width;
			if (gap > 0) {
				xx = xx - xx % gap + gap;
			}

			if (height > max_height) {
				max_height = height;
			}
			if (xx > sprite_width) {
				xx = 0;
				yy += max_height;
				max_height = 0;
			}
		}

		config.need_render = true;
	}

}

export default Tools_sprites_class;