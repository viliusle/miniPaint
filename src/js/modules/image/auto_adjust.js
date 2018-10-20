import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

var instance = null;

class Image_autoAdjust_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();

		this.set_events();
	}

	set_events() {
		var _this = this;

		document.addEventListener('keydown', function (event) {
			var code = event.keyCode;
			if (event.target.type == 'text' || event.target.tagName == 'INPUT' || event.target.type == 'textarea')
				return;

			if (code == 70 && event.ctrlKey != true && event.metaKey != true) {
				//F - adjust
				_this.auto_adjust();
				event.preventDefault();
			}
		}, false);
	}

	auto_adjust() {
		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		window.State.save();

		//get canvas from layer
		var canvas = this.Base_layers.convert_layer_to_canvas(null, true);
		var ctx = canvas.getContext("2d");

		//change data
		var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var data = this.get_adjust_data(img);
		ctx.putImageData(data, 0, 0);

		//save
		this.Base_layers.update_layer_image(canvas);
	}

	get_adjust_data(data) {
		//settings
		var white = 240;	//white color min
		var black = 30;		//black color max
		var target_white = 1; 	//how much % white colors should take
		var target_black = 0.5;	//how much % black colors should take
		var modify = 1.1;	//color modify strength
		var cycles_count = 10; //how much iteration to change colors

		var imgData = data.data;
		var W = data.width;
		var H = data.height;

		var n = 0;	//pixels count without transparent

		//make sure we have white
		var n_valid = 0;
		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent
			if ((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3 > white)
				n_valid++;
			n++;
		}
		var target = target_white;
		var n_fix_white = 0;
		var done = false;
		for (var j = 0; j < cycles_count; j++) {
			if (n_valid * 100 / n >= target)
				done = true;
			if (done == true)
				break;
			n_fix_white++;

			//adjust
			for (var i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				for (var c = 0; c < 3; c++) {
					var x = i + c;
					if (imgData[x] < 10)
						continue;
					//increase white
					imgData[x] *= modify;
					imgData[x] = Math.round(imgData[x]);
					if (imgData[x] > 255)
						imgData[x] = 255;
				}
			}

			//recheck
			n_valid = 0;
			for (var i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				if ((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3 > white)
					n_valid++;
			}
		}

		//make sure we have black
		n_valid = 0;
		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent
			if ((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3 < black)
				n_valid++;
		}
		target = target_black;
		var n_fix_black = 0;
		var done = false;
		for (var j = 0; j < cycles_count; j++) {
			if (n_valid * 100 / n >= target)
				done = true;
			if (done == true)
				break;
			n_fix_black++;

			//adjust
			for (var i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				for (var c = 0; c < 3; c++) {
					var x = i + c;
					if (imgData[x] > 240)
						continue;
					//increase black
					imgData[x] -= (255 - imgData[x]) * modify - (255 - imgData[x]);
					imgData[x] = Math.round(imgData[x]);
				}
			}

			//recheck
			n_valid = 0;
			for (var i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				if ((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3 < black)
					n_valid++;
			}
		}
		//log('Iterations: brighten='+n_fix_white+", darken="+n_fix_black);

		return data;
	}
}

export default Image_autoAdjust_class;