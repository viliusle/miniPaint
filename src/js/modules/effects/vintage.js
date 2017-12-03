import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Base_layers_class from './../../core/base-layers.js';
import Vintage_class from './../../libs/vintage.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Effects_vintage_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Vintage = new Vintage_class(config.WIDTH, config.HEIGHT);
	}

	vintage() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		this.Vintage.reset_random_values(config.WIDTH, config.HEIGHT);

		var settings = {
			title: 'Vintage',
			preview: true,
			effects: true,
			params: [
				{name: "level", title: "Level:", value: 50, range: [0, 100]},
			],
			on_change: function (params, canvas_preview, w, h, canvas_) {
				_this.change(canvas_, params);
			},
			on_finish: function (params) {
				window.State.save();
				_this.save(params);
			},
		};
		this.POP.show(settings);
	}

	save(params) {
		//get canvas from layer
		var canvas = this.Base_layers.convert_layer_to_canvas(null, true);
		var ctx = canvas.getContext("2d");

		//change data
		this.change(canvas, params);

		//save
		this.Base_layers.update_layer_image(canvas);
	}

	change(canvas, params) {
		var level = parseInt(params.level);

		this.Vintage.apply_all(canvas, level);
	}

}

export default Effects_vintage_class;