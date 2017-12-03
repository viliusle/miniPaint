import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';
import Helper_class from './../../libs/helpers.js';
import ImageFilters_class from './../../libs/imagefilters.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Image_decreaseColors_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.ImageFilters = ImageFilters_class;
	}

	decrease_colors() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		var settings = {
			title: 'Decrease color depth',
			preview: true,
			on_change: function (params, canvas_preview, w, h) {
				var img = canvas_preview.getImageData(0, 0, w, h);
				var data = _this.get_decreased_data(img, params.colors, params.greyscale);
				canvas_preview.putImageData(data, 0, 0);
			},
			params: [
				{name: "colors", title: "Colors:", value: 10, range: [1, 256]},
				{name: "greyscale", title: "Greyscale:", value: false},
			],
			on_finish: function (params) {
				window.State.save();
				_this.execute(params);
			},
		};
		this.POP.show(settings);
	}

	execute(params) {
		//get canvas from layer
		var canvas = this.Base_layers.convert_layer_to_canvas(null, true);
		var ctx = canvas.getContext("2d");

		//change data
		var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var data = this.get_decreased_data(img, params.colors, params.greyscale);
		ctx.putImageData(data, 0, 0);

		//save
		this.Base_layers.update_layer_image(canvas);
	}

	get_decreased_data(data, colors, greyscale) {
		var img = data.data;
		var imgData = data.data;
		var W = data.width;
		var H = data.height;
		var palette = [];
		var block_size = 10;

		//create tmp canvas
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext("2d");
		canvas.width = W;
		canvas.height = H;

		//collect top colors
		ctx.drawImage(config.layer.link, 0, 0, Math.ceil(W / block_size), Math.ceil(H / block_size));
		var img_p = ctx.getImageData(0, 0, Math.ceil(W / block_size), Math.ceil(H / block_size));
		var imgData_p = img_p.data;
		ctx.clearRect(0, 0, W, H);

		for (var i = 0; i < imgData_p.length; i += 4) {
			if (imgData_p[i + 3] == 0)
				continue;	//transparent
			var grey = Math.round(0.2126 * imgData_p[i] + 0.7152 * imgData_p[i + 1]
				+ 0.0722 * imgData_p[i + 2]);
			palette.push([imgData_p[i], imgData_p[i + 1], imgData_p[i + 2], grey]);
		}

		//calculate weights
		var grey_palette = [];
		for (var i = 0; i < 256; i++)
			grey_palette[i] = 0;
		for (var i = 0; i < palette.length; i++)
			grey_palette[palette[i][3]]++;

		//remove similar colors
		for (var max = 10 * 3; max < 100 * 3; max = max + 10 * 3) {
			if (palette.length <= colors)
				break;
			for (var i = 0; i < palette.length; i++) {
				if (palette.length <= colors)
					break;
				var valid = true;
				for (var j = 0; j < palette.length; j++) {
					if (palette.length <= colors)
						break;
					if (i == j)
						continue;
					if (Math.abs(palette[i][0] - palette[j][0])
						+ Math.abs(palette[i][1] - palette[j][1])
						+ Math.abs(palette[i][2] - palette[j][2]) < max) {
						if (grey_palette[palette[i][3]] > grey_palette[palette[j][3]]) {
							//remove color
							palette.splice(j, 1);
							j--;
						}
						else {
							valid = false;
							break;
						}
					}
				}
				//remove color
				if (valid == false) {
					palette.splice(i, 1);
					i--;
				}
			}
		}
		palette = palette.slice(0, colors);

		//change
		var p_n = palette.length;
		for (var j = 0; j < H; j++) {
			for (var i = 0; i < W; i++) {
				var k = ((j * (W * 4)) + (i * 4));
				if (imgData[k + 3] == 0)
					continue;	//transparent

				//find closest color
				var index1 = 0;
				var min = 999999;
				var diff1;
				for (var m = 0; m < p_n; m++) {
					var diff = Math.abs(palette[m][0] - imgData[k])
						+ Math.abs(palette[m][1] - imgData[k + 1])
						+ Math.abs(palette[m][2] - imgData[k + 2]);
					if (diff < min) {
						min = diff;
						index1 = m;
						diff1 = diff;
					}
				}

				imgData[k] = palette[index1][0];
				imgData[k + 1] = palette[index1][1];
				imgData[k + 2] = palette[index1][2];

				if (greyscale == true) {
					var mid = Math.round(0.2126 * imgData[k] + 0.7152 * imgData[k + 1]
						+ 0.0722 * imgData[k + 2]);
					imgData[k] = mid;
					imgData[k + 1] = mid;
					imgData[k + 2] = mid;
				}
			}
		}

		return data;
	}

}

export default Image_decreaseColors_class;