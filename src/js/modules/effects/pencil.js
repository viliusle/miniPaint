import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Base_layers_class from './../../core/base-layers.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Effects_pencil_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	pencil() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		var settings = {
			title: 'Pencil',
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
		var offset = Math.min(width, height) / 1000;
		offset = Math.ceil(offset);
		
		//create second copy
		var canvas2 = document.createElement('canvas');
		var ctx2 = canvas2.getContext("2d");
		canvas2.width = width;
		canvas2.height = height;
		ctx2.drawImage(canvas, -offset, -offset);
		
		//merge
		ctx2.globalCompositeOperation = "difference";
		ctx2.drawImage(canvas, 0, 0);
		ctx2.globalCompositeOperation = "source-over";
		
		//apply more effects
		ctx2.filter = 'brightness(2) invert(1) grayscale(1)';
		ctx2.drawImage(canvas2, 0, 0);
		ctx2.filter = 'none';
		
		return canvas2;
	}

}

export default Effects_pencil_class;