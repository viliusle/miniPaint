import config from '../../../config.js';
import Dialog_class from '../../../libs/popup.js';
import Base_layers_class from '../../../core/base-layers.js';
import alertify from 'alertifyjs/build/alertify.min.js';

/*
https://github.com/una/CSSgram/blob/master/source/css/toaster.css
https://github.com/vigetlabs/canvas-instagram-filters
*/
class Effects_toaster_class {

	constructor() {
		this.POP = new Dialog_class();
		//this.Color_matrix = new Color_matrix_class();
		this.Base_layers = new Base_layers_class();
	}

	toaster() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		var settings = {
			title: 'Toaster',
			preview: true,
			effects: true,
			params: [],
			on_change: function (params, canvas_preview, w, h, canvas_) {
				var data = _this.change(canvas_, canvas_.width, canvas_.height);
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
		var data = this.change(canvas, canvas.width, canvas.height);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(data, 0, 0);

		//save
		this.Base_layers.update_layer_image(canvas);
	}

	change(canvas, width, height) {

		//create temp canvas
		var canvas2 = document.createElement('canvas');
		var ctx2 = canvas2.getContext("2d");
		canvas2.width = width;
		canvas2.height = height;
		ctx2.drawImage(canvas, 0, 0);

		//merge
		ctx2.globalCompositeOperation = "screen";
		var gradient = ctx2.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.6);
		gradient.addColorStop(0, "#804e0f");
		gradient.addColorStop(1, "#3b003b");
		ctx2.fillStyle = gradient;
		ctx2.fillRect(0, 0, width, height);
		ctx2.globalCompositeOperation = "source-over";

		//apply more effects
		ctx2.filter = 'contrast(1.5) brightness(0.9)';
		ctx2.drawImage(canvas2, 0, 0);
		ctx2.filter = 'none';

		return canvas2;
	}

	demo(canvas_id, canvas_thumb){
		var canvas = document.getElementById(canvas_id);
		var ctx = canvas.getContext("2d");

		//modify
		var data = this.change(canvas_thumb, canvas_thumb.width, canvas_thumb.height);

		//draw
		ctx.drawImage(data, 0, 0);
	}

}

export default Effects_toaster_class;