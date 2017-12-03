import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Base_layers_class from './../../core/base-layers.js';
import ImageFilters from './../../libs/imagefilters.js';
import glfx from './../../libs/glfx.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Effects_tiltShift_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.fx_filter = false;
	}

	tilt_shift() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		var settings = {
			title: 'Tilt Shift',
			preview: true,
			effects: true,
			params: [
				//extra
				{name: "param7", title: "Saturation:", value: "3", range: [0, 20]},
				{name: "param8", title: "Sharpen:", value: "1", range: [0, 5]},
				//main
				{name: "param1", title: "Blur Radius:", value: 10, range: [0, 30]},
				{name: "param2", title: "Gradient Radius:", value: 70, range: [40, 100]},
				//startX, startY, endX, endY
				{name: "param3", title: "X start:", value: 0, range: [0, 100]},
				{name: "param4", title: "Y start:", value: 50, range: [0, 100]},
				{name: "param5", title: "X end:", value: 100, range: [0, 100]},
				{name: "param6", title: "Y end:", value: 50, range: [0, 100]},
			],
			on_change: function (params, canvas_preview, w, h, canvas_) {
				//recalc param by size
				_this.change(canvas_, params);

				//convert % to px for line
				params.param3 = canvas_.width * params.param3 / 100;
				params.param4 = canvas_.height * params.param4 / 100;
				params.param5 = canvas_.width * params.param5 / 100;
				params.param6 = canvas_.height * params.param6 / 100;

				//draw line
				canvas_preview.beginPath();
				canvas_preview.strokeStyle = "#ff0000";
				canvas_preview.lineWidth = 1;
				canvas_preview.moveTo(params.param3 + 0.5, params.param4 + 0.5);
				canvas_preview.lineTo(params.param5 + 0.5, params.param6 + 0.5);
				canvas_preview.stroke();
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
		if (this.fx_filter == false) {
			//init glfx lib
			this.fx_filter = glfx.canvas();
		}

		var param1 = parseInt(params.param1);
		var param2 = parseInt(params.param2);
		var param3 = parseInt(params.param3);
		var param4 = parseInt(params.param4);
		var param5 = parseInt(params.param5);
		var param6 = parseInt(params.param6);
		var param7 = parseInt(params.param7);
		var param8 = parseInt(params.param8);

		//convert % to px
		param1 = canvas.height * param1 / 100;
		param2 = canvas.height * param2 / 100;
		param3 = canvas.width * param3 / 100;
		param4 = canvas.height * param4 / 100;
		param5 = canvas.width * param5 / 100;
		param6 = canvas.height * param6 / 100;

		var ctx = canvas.getContext("2d");

		//main effect
		var texture = this.fx_filter.texture(canvas);
		this.fx_filter.draw(texture).tiltShift(param3, param4, param5, param6, param1, param2).update();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(this.fx_filter, 0, 0);

		//saturation
		var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var data = ImageFilters.HSLAdjustment(data, 0, param7, 0);
		ctx.putImageData(data, 0, 0);

		//sharpen
		var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var data = ImageFilters.Sharpen(data, param8);
		ctx.putImageData(data, 0, 0);
	}

}

export default Effects_tiltShift_class;