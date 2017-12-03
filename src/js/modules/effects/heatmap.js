import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Base_layers_class from './../../core/base-layers.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Effects_heatmap_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	heatmap() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		var settings = {
			title: 'Heatmap',
			preview: true,
			effects: true,
			params: [],
			on_change: function (params, canvas_preview, w, h) {
				var img = canvas_preview.getImageData(0, 0, w, h);
				var data = _this.change(img, params);
				canvas_preview.putImageData(data, 0, 0);
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
		var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var data = this.change(img, params);
		ctx.putImageData(data, 0, 0);

		//save
		this.Base_layers.update_layer_image(canvas);
	}

	change(data, params) {
		var imgData = data.data;
		var grey, RGB;

		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent
			grey = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);
			RGB = this.color2heat(grey);
			imgData[i] = RGB.R;
			imgData[i + 1] = RGB.G;
			imgData[i + 2] = RGB.B;
		}

		return data;
	}

	color2heat(value) {
		var RGB = {R: 0, G: 0, B: 0};
		value = value / 255;
		if (0 <= value && value <= 1 / 8) {
			RGB.R = 0;
			RGB.G = 0;
			RGB.B = 4 * value + .5; // .5 - 1 // b = 1/2
		}
		else if (1 / 8 < value && value <= 3 / 8) {
			RGB.R = 0;
			RGB.G = 4 * value - .5; // 0 - 1 // b = - 1/2
			RGB.B = 1; // small fix
		}
		else if (3 / 8 < value && value <= 5 / 8) {
			RGB.R = 4 * value - 1.5; // 0 - 1 // b = - 3/2
			RGB.G = 1;
			RGB.B = -4 * value + 2.5; // 1 - 0 // b = 5/2
		}
		else if (5 / 8 < value && value <= 7 / 8) {
			RGB.R = 1;
			RGB.G = -4 * value + 3.5; // 1 - 0 // b = 7/2
			RGB.B = 0;
		}
		else if (7 / 8 < value && value <= 1) {
			RGB.R = -4 * value + 4.5; // 1 - .5 // b = 9/2
			RGB.G = 0;
			RGB.B = 0;
		}
		else {
			// should never happen - value > 1
			RGB.R = .5;
			RGB.G = 0;
			RGB.B = 0;
		}
		// scale for hex conversion
		RGB.R *= 255;
		RGB.G *= 255;
		RGB.B *= 255;

		RGB.R = Math.round(RGB.R);
		RGB.G = Math.round(RGB.G);
		RGB.B = Math.round(RGB.B);

		return RGB;
	}

}

export default Effects_heatmap_class;
