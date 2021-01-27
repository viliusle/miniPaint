import app from './../../app.js';
import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Tools_colorZoom_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	color_zoom() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('This layer must contain an image. Please convert it to raster to apply this tool.');
			return;
		}

		var settings = {
			title: 'Color zoom',
			preview: true,
			params: [
				{name: "zoom", title: "Zoom:", value: "2", range: [2, 20], },
				{name: "center", title: "Center:", value: "128", range: [0, 255]},
			],
			on_change: function (params, canvas_preview, w, h) {
				var img = canvas_preview.getImageData(0, 0, w, h);
				var data = _this.change(img, params.zoom, params.center);
				canvas_preview.putImageData(data, 0, 0);
			},
			on_finish: function (params) {
				_this.save_zoom(params.zoom, params.center);
			},
		};
		this.POP.show(settings);
	}

	save_zoom(zoom, center) {
		//get canvas from layer
		var canvas = this.Base_layers.convert_layer_to_canvas(null, true);
		var ctx = canvas.getContext("2d");

		//change data
		var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var data = this.change(img, zoom, center);
		ctx.putImageData(data, 0, 0);

		//save
		return app.State.do_action(
			new app.Actions.Update_layer_image_action(canvas)
		);
	}

	change(data, zoom, center) {
		var imgData = data.data;
		var grey;
		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent

			grey = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);

			for (var j = 0; j < 3; j++) {
				var k = i + j;
				if (grey > center)
					imgData[k] += (imgData[k] - center) * zoom;
				else if (grey < center)
					imgData[k] -= (center - imgData[k]) * zoom;
				if (imgData[k] < 0)
					imgData[k] = 0;
				if (imgData[k] > 255)
					imgData[k] = 255;
			}
		}
		return data;
	}

}

export default Tools_colorZoom_class;