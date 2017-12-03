import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Base_layers_class from './../../core/base-layers.js';
import Helper_class from './../../libs/helpers.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Effects_backAndWhite_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
	}

	black_and_white() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		//create tmp canvas
		var canvas = this.Base_layers.convert_layer_to_canvas(null, true);
		var ctx = canvas.getContext("2d");

		//calc default level
		var default_level = this.thresholding(ctx, canvas.width, canvas.height, true);

		var settings = {
			title: 'Black and White',
			preview: true,
			effects: true,
			params: [
				{name: "level", title: "Level:", value: default_level, range: [0, 255]},
				{name: "dithering", title: "Dithering:", value: false},
			],
			on_change: function (params, canvas_preview, w, h) {
				//check params
				var level = document.getElementById("pop_data_level");
				if (params.dithering == false)
					level.disabled = false;
				else
					level.disabled = true;

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
		var W = data.width;
		var H = data.height;

		//create tmp canvas
		var canvas = document.createElement('canvas');
		canvas.width = W;
		canvas.height = H;

		var imgData = data.data;
		var grey, c, quant_error, m;
		if (params.dithering !== true) {
			//no differing
			for (var i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				grey = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);
				if (grey <= params.level)
					c = 0;
				else
					c = 255;
				imgData[i] = c;
				imgData[i + 1] = c;
				imgData[i + 2] = c;
			}
		}
		else {
			//Floyd–Steinberg dithering
			var img2 = canvas.getContext("2d").getImageData(0, 0, W, H);
			var imgData2 = img2.data;
			for (var j = 0; j < H; j++) {
				for (var i = 0; i < W; i++) {
					var k = ((j * (W * 4)) + (i * 4));
					if (imgData[k + 3] == 0)
						continue;	//transparent

					grey = Math.round(0.2126 * imgData[k] + 0.7152 * imgData[k + 1] + 0.0722 * imgData[k + 2]);
					grey = grey + imgData2[k]; //add data shft from previous iterations
					c = Math.floor(grey / 256);
					if (c == 1)
						c = 255;
					imgData[k] = c;
					imgData[k + 1] = c;
					imgData[k + 2] = c;
					quant_error = grey - c;
					if (i + 1 < W) {
						m = k + 4;
						imgData2[m] += Math.round(quant_error * 7 / 16);
					}
					if (i - 1 > 0 && j + 1 < H) {
						m = k - 4 + W * 4;
						imgData2[m] += Math.round(quant_error * 3 / 16);
					}
					if (j + 1 < H) {
						m = k + W * 4;
						imgData2[m] += Math.round(quant_error * 5 / 16);
					}
					if (i + 1 < W && j + 1 < H) {
						m = k + 4 + W * 4;
						imgData2[m] += Math.round(quant_error * 1 / 16);
					}
				}
			}
		}
		return data;
	}

	thresholding(ctx, W, H, only_level) {
		var img = ctx.getImageData(0, 0, W, H);
		var imgData = img.data;
		var hist_data = [];
		var grey;
		for (var i = 0; i <= 255; i++)
			hist_data[i] = 0;
		for (var i = 0; i < imgData.length; i += 4) {
			grey = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);
			hist_data[grey]++;
		}
		var level = this.otsu(hist_data, W * H);
		if (only_level === true)
			return level;
		var c;
		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent
			grey = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);
			if (grey < level)
				c = 0;
			else
				c = 255;
			imgData[i] = c;
			imgData[i + 1] = c;
			imgData[i + 2] = c;
		}
		ctx.putImageData(img, 0, 0);
	}

	//http://en.wikipedia.org/wiki/Otsu%27s_Method
	otsu(histogram, total) {
		var sum = 0;
		for (var i = 1; i < 256; ++i)
			sum += i * histogram[i];
		var mB, mF, between;
		var sumB = 0;
		var wB = 0;
		var wF = 0;
		var max = 0;
		var threshold = 0;
		for (var i = 0; i < 256; ++i) {
			wB += histogram[i];
			if (wB == 0)
				continue;
			wF = total - wB;
			if (wF == 0)
				break;
			sumB += i * histogram[i];
			mB = sumB / wB;
			mF = (sum - sumB) / wF;
			between = wB * wF * Math.pow(mB - mF, 2);
			if (between > max) {
				max = between;
				threshold = i;
			}
		}
		return threshold;
	}

}

export default Effects_backAndWhite_class;