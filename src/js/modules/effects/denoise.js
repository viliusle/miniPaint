import app from './../../app.js';
import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Base_layers_class from './../../core/base-layers.js';
import glfx from './../../libs/glfx.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Effects_denoise_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.fx_filter = false;
	}

	denoise() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('This layer must contain an image. Please convert it to raster to apply this tool.');
			return;
		}

		var settings = {
			title: 'Denoise',
			preview: true,
			effects: true,
			params: [
				{name: "param1", title: "Exponent:", value: 20, range: [0, 50]},
			],
			on_change: function (params, canvas_preview, w, h, canvas_) {
				var data = _this.change(canvas_, params);
				canvas_preview.clearRect(0, 0, canvas_.width, canvas_.height);
				canvas_preview.drawImage(data, 0, 0);
			},
			on_finish: function (params) {
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
		return app.State.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	change(canvas, params) {
		if (this.fx_filter == false) {
			//init glfx lib
			this.fx_filter = glfx.canvas();
		}

		var param1 = parseFloat(params.param1);

		var texture = this.fx_filter.texture(canvas);
		this.fx_filter.draw(texture).denoise(param1).update();	//effect

		return this.fx_filter;
	}

	demo(canvas_id, canvas_thumb){
		var canvas = document.getElementById(canvas_id);
		var ctx = canvas.getContext("2d");

		//modify
		var params = {
			param1: 20,
		};
		var data = this.change(canvas_thumb, params);

		//draw
		ctx.drawImage(data, 0, 0);
	}

}

export default Effects_denoise_class;