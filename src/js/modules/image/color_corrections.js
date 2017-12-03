import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';
import Helper_class from './../../libs/helpers.js';
import ImageFilters_class from './../../libs/imagefilters.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Image_colorCorrections_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.ImageFilters = ImageFilters_class;
	}

	color_corrections() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		var settings = {
			title: 'Color corrections',
			preview: true,
			on_change: function (params, canvas_preview, w, h) {
				var img = canvas_preview.getImageData(0, 0, w, h);
				var data = _this.do_corrections(img, params);
				canvas_preview.putImageData(data, 0, 0);
			},
			params: [
				{name: "param1", title: "Brightness:", value: "0", range: [-100, 100]},
				{name: "param2", title: "Contrast:", value: "0", range: [-100, 100]},
				{},
				{name: "param_red", title: "Red channel:", value: "0", range: [-255, 255]},
				{name: "param_green", title: "Green channel:", value: "0", range: [-255, 255]},
				{name: "param_blue", title: "Blue channel:", value: "0", range: [-255, 255]},
				{},
				{name: "param_h", title: "Hue:", value: "0", range: [-180, 180]},
				{name: "param_s", title: "Saturation:", value: "0", range: [-100, 100]},
				{name: "param_l", title: "Luminance:", value: "0", range: [-100, 100]},
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
		var data = this.do_corrections(img, params);
		ctx.putImageData(data, 0, 0);

		//save
		this.Base_layers.update_layer_image(canvas);
	}

	do_corrections(data, params) {
		var param1 = params.param1;
		var param2 = params.param2;
		var param_red = params.param_red;
		var param_green = params.param_green;
		var param_blue = params.param_blue;
		var param_h = params.param_h;
		var param_s = params.param_s;
		var param_l = params.param_l;

		//Brightness/Contrast
		var filtered = this.ImageFilters.BrightnessContrastPhotoshop(data, param1, param2);
		//RGB corrections
		var filtered = this.ImageFilters.ColorTransformFilter(filtered, 1, 1, 1, 1, param_red, param_green, param_blue, 1);
		//hue/saturation/luminance
		var filtered = this.ImageFilters.HSLAdjustment(filtered, param_h, param_s, param_l);

		return filtered;
	}

}

export default Image_colorCorrections_class;