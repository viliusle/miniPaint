import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Base_layers_class from './../../core/base-layers.js';
import glfx from './../../libs/glfx.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Effects_zoomBlur_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.fx_filter = false;
	}

	zoom_blur() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		//get layer size
		var canvas = this.Base_layers.convert_layer_to_canvas(null, true);

		var settings = {
			title: 'Zoom blur',
			preview: true,
			effects: true,
			params: [
				{name: "param1", title: "Strength:", value: "0.3", range: [0, 1], step: 0.01},
				{name: "param2", title: "Center x:", value: Math.round(canvas.width / 2), range: [0, canvas.width]},
				{name: "param3", title: "Center y:", value: Math.round(canvas.height / 2), range: [0, canvas.height]},
			],
			on_change: function (params, canvas_preview, w, h, canvas_) {
				//recalc param by size
				params.param2 = params.param2 / canvas.width * w;
				params.param3 = params.param3 / canvas.height * h;

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

		var param1 = parseFloat(params.param1);
		var param2 = parseInt(params.param2);
		var param3 = parseInt(params.param3);

		var texture = this.fx_filter.texture(canvas);
		this.fx_filter.draw(texture).zoomBlur(param2, param3, param1).update();	//effect

		return this.fx_filter;
	}

}

export default Effects_zoomBlur_class;