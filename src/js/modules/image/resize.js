import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Base_gui_class from './../../core/base-gui.js';
import Dialog_class from './../../libs/popup.js';
import ImageFilters_class from './../../libs/imagefilters.js';
import Hermite_class from './../../../../node_modules/hermite-resize/dist/hermite.npm.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

var instance = null;

class Image_resize_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Base_layers = new Base_layers_class();
		this.Base_gui = new Base_gui_class();
		this.POP = new Dialog_class();
		this.ImageFilters = ImageFilters_class;
		this.Hermite = new Hermite_class();

		this.set_events();
	}

	set_events() {
		var _this = this;

		document.addEventListener('keydown', function (event) {
			var code = event.keyCode;
			if (event.target.type == 'text' || event.target.tagName == 'INPUT' || event.target.type == 'textarea')
				return;

			if (code == 82) {
				//R - resize
				_this.resize();
				event.preventDefault();
			}
		}, false);
	}

	resize() {
		var _this = this;

		if (config.layer.type != 'image') {
			//error - no support
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return false;
		}

		var settings = {
			title: 'Resize',
			params: [
				{name: "width", title: "Width:", value: '', placeholder: config.WIDTH},
				{name: "height", title: "Height:", value: '', placeholder: config.HEIGHT},
				{name: "width_percent", title: "Width (%):", value: '', placeholder: 100},
				{name: "height_percent", title: "Height (%):", value: '', placeholder: 100},
				{name: "mode", title: "Mode:", values: ["Resample - Hermite", "Basic"]},
				{name: "preblur", title: "Pre-Blur:", value: false},
				{name: "sharpen", title: "Sharpen:", value: false},
				{name: "layers", title: "Layers:", values: ["Active", "All"], value: "Active"},
			],
			on_finish: function (params) {
				_this.do_resize(params);
			},
		};
		this.POP.show(settings);
	}

	do_resize(params) {
		if (params.layers == 'All') {
			//resize all layers
			var skips = 0;
			for (var i in config.layers) {
				if (config.layers[i].type != 'image') {
					skips++;
					continue;
				}

				this.resize_layer(config.layers[i], params);
			}
			if (skips > 0) {
				alertify.error(skips + ' layer(s) were skipped, because they are not image.');
			}
		}
		else {
			//only active
			this.resize_layer(config.layer, params);
		}
	}

	resize_layer(layer, params) {
		var mode = params.mode;
		var width = parseInt(params.width);
		var height = parseInt(params.height);
		var width_100 = parseInt(params.width_percent);
		var height_100 = parseInt(params.height_percent);
		var preblur = params.preblur;
		var sharpen = params.sharpen;

		if (isNaN(width) && isNaN(height) && isNaN(width_100) && isNaN(height_100))
			return false;
		if (width == config.WIDTH && height == config.HEIGHT)
			return false;

		window.State.save();

		//get canvas from layer
		var canvas = this.Base_layers.convert_layer_to_canvas(layer.id, true);
		var ctx = canvas.getContext("2d");

		var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		var layer_x = parseInt(canvas.dataset.x);
		var layer_y = parseInt(canvas.dataset.y);

		//if dimension with percent provided
		if (isNaN(width) && isNaN(height)) {
			if (isNaN(width_100) == false) {
				width = Math.round(canvas.width * width_100 / 100);
			}
			if (isNaN(height_100) == false) {
				height = Math.round(canvas.height * height_100 / 100);
			}
		}

		//if only 1 dimension was provided
		if (isNaN(width) || isNaN(height)) {
			var ratio = canvas.width / canvas.height;
			if (isNaN(width))
				width = Math.round(height * ratio);
			if (isNaN(height))
				height = Math.round(width / ratio);
		}

		//anti-artifacting?
		if (preblur == true) {
			var ratio_w = canvas.width / width;
			var ratio_h = canvas.height / height;
			var ratio_avg = Math.max(ratio_w, ratio_h);
			var power = ratio_avg * 0.3;
			if (power > 0.6) {
				var filtered = this.ImageFilters.GaussianBlur(imageData, power);
				ctx.putImageData(filtered, 0, 0);
			}
		}

		//validate
		if (mode == "Resample - Hermite" && (width > canvas.width || height > canvas.height)) {
			//scalling up - Hermite not supported
			mode = "Basic";
		}

		var resize_type;
		if (mode == "Resample - Hermite") {
			//Hermite resample - nice quality
			resize_type = 'Hermite';

			this.Hermite.resample_single(canvas, width, height);

			this.maybe_resize_up(canvas, width, height, layer_x, layer_y);
		}
		else {
			//simple resize - max speed
			resize_type = 'Default';
			var tmp_data = document.createElement("canvas");
			tmp_data.width = canvas.width;
			tmp_data.height = canvas.height;
			tmp_data.getContext("2d").drawImage(canvas, 0, 0);

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			this.maybe_resize_up(canvas, width, height, layer_x, layer_y);

			ctx.drawImage(tmp_data, 0, 0, width, height);
		}

		//sharpen after?
		if (sharpen == true) {
			var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			var filtered = this.ImageFilters.Sharpen(imageData, 1);	//add effect
			ctx.putImageData(filtered, 0, 0);
		}

		this.trim_canvas(canvas, width, height);

		//save
		this.Base_layers.update_layer_image(canvas, layer.id);
		layer.width = canvas.width;
		layer.height = canvas.height;
		layer.width_original = canvas.width;
		layer.height_original = canvas.height;
		config.need_render = true;
	}

	maybe_resize_up(canvas, width, height, layer_x, layer_y) {
		if (width > config.WIDTH || height > config.HEIGHT) {
			config.WIDTH = Math.max(parseInt(width), config.WIDTH);
			config.HEIGHT = Math.max(parseInt(height), config.HEIGHT);
			canvas.width = width;
			canvas.height = height;

			this.Base_gui.prepare_canvas();
		}

		if (config.layers.length == 1 && layer_x == 0 && layer_y == 0) {
			config.WIDTH = width;
			config.HEIGHT = height;
			this.Base_gui.prepare_canvas();
		}
	}

	trim_canvas(canvas, width, height) {
		if (width >= canvas.width && height >= canvas.height)
			return;

		var tmp_data = document.createElement("canvas");
		tmp_data.width = width;
		tmp_data.height = height;
		tmp_data.getContext("2d").drawImage(canvas, 0, 0);

		canvas.width = width;
		canvas.height = height;

		canvas.getContext("2d").drawImage(tmp_data, 0, 0);
	}

}

export default Image_resize_class;