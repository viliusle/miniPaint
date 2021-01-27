import app from './../../app.js';
import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Tools_restoreAlpha_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	restore_alpha() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('This layer must contain an image. Please convert it to raster to apply this tool.');
			return;
		}

		var settings = {
			title: 'Restore Alpha',
			preview: true,
			on_change: function (params, canvas_preview, w, h) {
				var img = canvas_preview.getImageData(0, 0, w, h);
				var data = _this.recover_alpha(img, params.level);
				canvas_preview.putImageData(data, 0, 0);
			},
			params: [
				{name: "level", title: "Level:", value: "128", range: [0, 255]},
			],
			on_finish: function (params) {
				_this.save_alpha(params.level);
			},
		};
		this.POP.show(settings);
	}

	save_alpha(level) {
		//get canvas from layer
		var canvas = this.Base_layers.convert_layer_to_canvas(null, true);
		var ctx = canvas.getContext("2d");

		//change data
		var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var data = this.recover_alpha(img, level);
		ctx.putImageData(data, 0, 0);

		//save
		return app.State.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	recover_alpha(data, level) {
		var imgData = data.data;
		var tmp;
		level = parseInt(level);
		for (var i = 0; i < imgData.length; i += 4) {
			tmp = imgData[i + 3] + level;
			if (tmp > 255) {
				tmp = 255;
			}
			imgData[i + 3] = tmp;
		}
		return data;
	}

}

export default Tools_restoreAlpha_class;