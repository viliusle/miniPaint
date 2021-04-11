import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Helper_class from './../../libs/helpers.js';
import Base_layers_class from './../../core/base-layers.js';
import Tools_settings_class from './../tools/settings.js';

var instance = null;

class Image_information_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Base_layers = new Base_layers_class();
		this.POP = new Dialog_class();
		this.Helper = new Helper_class();
		this.Tools_settings = new Tools_settings_class();

		this.set_events();
	}

	set_events() {
		document.addEventListener('keydown', (event) => {
			var code = event.key.toLowerCase();
			if (this.Helper.is_input(event.target))
				return;

			if (code == "i") {
				this.information();
				event.preventDefault();
			}
		}, false);
	}

	information() {
		var _this = this;
		var pixels = config.WIDTH * config.HEIGHT;
		pixels = this.Helper.number_format(pixels, 0);

		var units = this.Tools_settings.get_setting('default_units');
		var resolution = this.Tools_settings.get_setting('resolution');

		var width = this.Helper.get_user_unit(config.WIDTH, units, resolution);
		var height = this.Helper.get_user_unit(config.HEIGHT, units, resolution);

		var settings = {
			title: 'Information',
			params: [
				{title: "Width:", value: width + ' ' + units},
				{title: "Height:", value: height + ' ' + units},
				{title: "Pixels:", value: pixels},
				{title: "Layers:", value: config.layers.length},
				{title: "Unique colors:", value: '...'},
			],
		};
		if(units != 'pixels'){
			settings.params[0].value += " (" + config.WIDTH + " pixels)";
			settings.params[1].value += " (" + config.HEIGHT + " pixels)";
		}

		//exif data
		if (config.layer._exif != undefined) {
			//show exif and general data
			var exif_data = config.layer._exif;

			//show general data
			for (var i in exif_data.general) {
				settings.params.push({title: i + ":", value: exif_data.general[i]});
			}

			//show exif data
			var n = 0;
			for (var i in exif_data.exif) {
				if (i == 'undefined')
					continue;
				if (n == 0)
					settings.params.push({title: "==== EXIF ====", value: ''});
				settings.params.push({title: i + ":", value: exif_data.exif[i]});
				n++;
			}
		}

		this.POP.show(settings);

		//calc colors
		setTimeout(function () {
			var colors = _this.unique_colors_count();
			colors = _this.Helper.number_format(colors, 0);
			document.getElementById('pop_data_uniquecolo').innerHTML = colors;
		}, 50);
	}

	unique_colors_count() {
		var method = 'v2'; //v1 or v2

		if (config.WIDTH * config.HEIGHT > 20 * 1000 * 1000) {
			return '-';
		}

		var canvas = this.Base_layers.convert_layer_to_canvas();
		var ctx = canvas.getContext("2d");
		var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var imgData = img.data;

		//v1 - simple, slow
		if (method == 'v1') {
			var colors = [];
			var n = 0;
			for (var i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				var key = imgData[i] + "." + imgData[i + 1] + "." + imgData[i + 2];
				if (colors[key] == undefined) {
					colors[key] = 1;
					n++;
				}
			}
		}

		//v2 - 30% faster
		else if (method == 'v2') {
			var buffer32 = new Uint32Array(imgData.buffer);
			var len = buffer32.length;
			var stats = {};
			var n = 0;

			for (var i = 0; i < len; i++) {
				var key = "" + (buffer32[i] & 0xffffff);
				if (stats[key] == undefined) {
					stats[key] = 0;
					n++;
				}
			}
		}

		return n;
	}
}

export default Image_information_class;
