import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Base_layers_class from './../../core/base-layers.js';
import glfx from './../../libs/glfx.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Effects_vibrance_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.fx_filter = false;
	}

	vibrance() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		var settings = {
			title: 'Vibrance',
			preview: true,
			effects: true,
			params: [
				{name: "level", title: "Level:", value: "0.5", range: [-1, 1], step: 0.01},
			],
			on_change: function (params, canvas_preview, w, h, canvas_) {
				var data = _this.change(canvas_, params);
				canvas_preview.clearRect(0, 0, canvas_.width, canvas_.height);
				canvas_preview.drawImage(data, 0, 0);
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
		var data = this.change(canvas, params);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(data, 0, 0);

		//save
		this.Base_layers.update_layer_image(canvas);
	}

	change(canvas, params) {
		if (this.fx_filter == false) {
			//init glfx lib
			this.fx_filter = glfx.canvas();
		}

		var param1 = parseFloat(params.level);

		var texture = this.fx_filter.texture(canvas);
		this.fx_filter.draw(texture).vibrance(param1).update();	//effect

		return this.fx_filter;
	}

}

export default Effects_vibrance_class;