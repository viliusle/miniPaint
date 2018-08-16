import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';
import Helper_class from './../../libs/helpers.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Tools_replaceColor_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
	}

	replace_color() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		var settings = {
			title: 'Replace color',
			preview: true,
			on_change: function (params, canvas_preview, w, h) {
				var img = canvas_preview.getImageData(0, 0, w, h);
				var data = _this.do_replace(img, params);
				canvas_preview.putImageData(data, 0, 0);
			},
			params: [
				{name: "target", title: "Target:", value: config.COLOR, type: 'color'},
				{name: "replacement", title: "Replacement:", value: '#ff0000', type: 'color'},
				{name: "power", title: "Power:", value: "20", range: [0, 255]},
				{name: "alpha", title: "Alpha:", value: "255", range: [0, 255]},
				{name: "mode", title: "Mode:", values: ['Advanced', 'Simple']},
			],
			on_finish: function (params) {
				window.State.save();
				_this.save_alpha(params);
			},
		};
		this.POP.show(settings);
	}

	save_alpha(params) {
		//get canvas from layer
		var canvas = this.Base_layers.convert_layer_to_canvas(null, true);
		var ctx = canvas.getContext("2d");

		//change data
		var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var data = this.do_replace(img, params);
		ctx.putImageData(data, 0, 0);

		//save
		this.Base_layers.update_layer_image(canvas);
	}

	do_replace(data, params) {
		var target = params.target;
		var replacement = params.replacement;
		var power = params.power;
		var alpha = params.alpha;
		var mode = params.mode;

		var imgData = data.data;
		var target_rgb = this.Helper.hex2rgb(target);
		var target_hsl = this.Helper.rgbToHsl(target_rgb.r, target_rgb.g, target_rgb.b);
		var target_normalized = this.Helper.hslToRgb(target_hsl.h, target_hsl.s, 0.5);

		var replacement_rgb = this.Helper.hex2rgb(replacement);
		var replacement_hsl = this.Helper.rgbToHsl(replacement_rgb.r, replacement_rgb.g, replacement_rgb.b);

		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent

			if (mode == 'Simple') {
				//simple replace

				//calculate difference from requested color, and change alpha
				var diff = (Math.abs(imgData[i] - target_rgb.r)
					+ Math.abs(imgData[i + 1] - target_rgb.g)
					+ Math.abs(imgData[i + 2] - target_rgb.b)) / 3;
				if (diff > power)
					continue;

				imgData[i] = replacement_rgb.r;
				imgData[i + 1] = replacement_rgb.g;
				imgData[i + 2] = replacement_rgb.b;
				if (alpha < 255)
					imgData[i + 3] = alpha;
			}
			else {
				//advanced replace using HSL
				
				var hsl = this.Helper.rgbToHsl(imgData[i], imgData[i + 1], imgData[i + 2]);
				var normalized = this.Helper.hslToRgb(hsl.h, hsl.s, 0.5);
				var diff = (Math.abs(normalized[0] - target_normalized[0])
					+ Math.abs(normalized[1] - target_normalized[1])
					+ Math.abs(normalized[2] - target_normalized[2])) / 3;
				if (diff > power)
					continue;

				//change to new color with existing luminance
				var normalized_final = this.Helper.hslToRgb(
					replacement_hsl.h,
					replacement_hsl.s,
					hsl.l * (replacement_hsl.l)
				);

				imgData[i] = normalized_final[0];
				imgData[i + 1] = normalized_final[1];
				imgData[i + 2] = normalized_final[2];
				if (alpha < 255)
					imgData[i + 3] = alpha;
			}
		}
		return data;
	}

}

export default Tools_replaceColor_class;