import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';
import Helper_class from './../../libs/helpers.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Tools_colorToAlpha_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
	}

	color_to_alpha() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		var settings = {
			title: 'Color to alpha',
			preview: true,
			on_change: function (params, canvas_preview, w, h) {
				var img = canvas_preview.getImageData(0, 0, w, h);
				var data = _this.change(img, params.color);
				canvas_preview.putImageData(data, 0, 0);
			},
			params: [
				{name: "color", title: "Color:", value: config.COLOR, type: 'color'},
			],
			on_finish: function (params) {
				window.State.save();
				_this.apply_affect(params.color);
			},
		};
		this.POP.show(settings);
	}

	apply_affect(color) {
		//get canvas from layer
		var canvas = this.Base_layers.convert_layer_to_canvas(null, true);
		var ctx = canvas.getContext("2d");

		//change data
		var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var data = this.change(img, color);
		ctx.putImageData(data, 0, 0);

		//save
		this.Base_layers.update_layer_image(canvas);
	}

	change(data, color) {
		var imgData = data.data;
		var back_color = this.Helper.hex2rgb(color);

		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent

			//calculate difference from requested color, and change alpha
			var diff = Math.abs(imgData[i] - back_color.r) + Math.abs(imgData[i + 1] - back_color.g) + Math.abs(imgData[i + 2] - back_color.b) / 3;
			imgData[i + 3] = Math.round(diff);

			//combining 2 layers in future will change colors, so make changes to get same colors in final image
			//color_result = color_1 * (alpha_1 / 255) * (1 - A2 / 255) + color_2 * (alpha_2 / 255)
			//color_2 = (color_result - color_1 * (alpha_1 / 255) * (1 - A2 / 255)) / (alpha_2 / 255)
			imgData[i] = Math.ceil((imgData[i] - back_color.r * (1 - imgData[i + 3] / 255)) / (imgData[i + 3] / 255));
			imgData[i + 1] = Math.ceil((imgData[i + 1] - back_color.g * (1 - imgData[i + 3] / 255)) / (imgData[i + 3] / 255));
			imgData[i + 2] = Math.ceil((imgData[i + 2] - back_color.b * (1 - imgData[i + 3] / 255)) / (imgData[i + 3] / 255));
		}
		return data;
	}

}

export default Tools_colorToAlpha_class;