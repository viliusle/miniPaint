import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Layer_differences_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	differences() {
		var _this = this;
		if (this.Base_layers.find_previous(config.layer.id) == null) {
			alertify.error('There are no layers behind.');
			return false;
		}

		var settings = {
			title: 'Differences',
			preview: true,
			params: [
				{name: "sensitivity", title: "Sensitivity:", value: "0", range: [0, 255]},
			],
			on_change: function (params, canvas_preview, w, h) {
				_this.calc_differences(params.sensitivity, canvas_preview, w, h);
			},
			on_finish: function (params) {
				_this.calc_differences(params.sensitivity);
			},
		};
		this.POP.show(settings);
	}

	calc_differences(sensitivity, canvas_preview, w, h) {
		//create tmp canvas
		var canvas = document.createElement('canvas');
		canvas.width = config.WIDTH;
		canvas.height = config.HEIGHT;
		var ctx = canvas.getContext("2d");

		//get source data
		this.Base_layers.render_object(ctx, config.layer);
		var imgData1 = ctx.getImageData(0, 0, config.WIDTH, config.HEIGHT).data;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		//get target data
		var next_layer = this.Base_layers.find_previous(config.layer.id);
		this.Base_layers.render_object(ctx, next_layer);
		var imgData2 = ctx.getImageData(0, 0, config.WIDTH, config.HEIGHT).data;

		//prepare background
		ctx.rect(0, 0, config.WIDTH, config.HEIGHT);
		ctx.fillStyle = "#ffffff";
		ctx.fill();

		//generate diff
		var img3 = ctx.getImageData(0, 0, config.WIDTH, config.HEIGHT);
		var imgData3 = img3.data;
		for (var xx = 0; xx < config.WIDTH; xx++) {
			for (var yy = 0; yy < config.HEIGHT; yy++) {
				var x = (xx + yy * config.WIDTH) * 4;

				if (Math.abs(imgData1[x] - imgData2[x]) > sensitivity
					|| Math.abs(imgData1[x + 1] - imgData2[x + 1]) > sensitivity
					|| Math.abs(imgData1[x + 2] - imgData2[x + 2]) > sensitivity
					|| Math.abs(imgData1[x + 3] - imgData2[x + 3]) > sensitivity) {
					imgData3[x] = 255;
					imgData3[x + 1] = 0;
					imgData3[x + 2] = 0;
					imgData3[x + 3] = 255;
				}
			}
		}
		ctx.putImageData(img3, 0, 0);

		//show
		if (canvas_preview == undefined) {
			//main
			window.State.save();
			var params = [];
			params.type = 'image';
			params.name = 'Differences';
			params.data = canvas.toDataURL("image/png");
			this.Base_layers.insert(params);
		}
		else {
			//preview
			canvas_preview.save();
			canvas_preview.scale(w / config.WIDTH, h / config.HEIGHT);
			canvas_preview.drawImage(canvas, 0, 0);
			canvas_preview.restore();
		}

		canvas.width = 1;
		canvas.height = 1;
	}

}

export default Layer_differences_class;