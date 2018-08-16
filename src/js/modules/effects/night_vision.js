import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Base_layers_class from './../../core/base-layers.js';
import glfx from './../../libs/glfx.js';
import ImageFilters_class from './../../libs/imagefilters.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Effects_nightVision_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.fx_filter = false;
		this.ImageFilters = ImageFilters_class;
	}

	night_vision() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		var settings = {
			title: 'Night Vision',
			preview: true,
			effects: true,
			params: [],
			on_change: function (params, canvas_preview, w, h, canvas_) {
				var data = _this.change(canvas_, canvas_.width, canvas_.height);
				canvas_preview.clearRect(0, 0, canvas_.width, canvas_.height);
				canvas_preview.drawImage(data, 0, 0);
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
		var data = this.change(canvas, canvas.width, canvas.height);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(data, 0, 0);

		//save
		this.Base_layers.update_layer_image(canvas);
	}

	change(canvas, width, height) {
		if (this.fx_filter == false) {
			//init glfx lib
			this.fx_filter = glfx.canvas();
		}
		
		//create second copy
		var canvas2 = document.createElement('canvas');
		var ctx2 = canvas2.getContext("2d");
		canvas2.width = width;
		canvas2.height = height;
		ctx2.drawImage(canvas, 0, 0);
		
		// green overlay
		var img = ctx2.getImageData(0, 0, width, height);
		//RGB corrections
		var img = this.ImageFilters.ColorTransformFilter(img, 1, 1, 1, 1, 0, 100, 0, 1);
		//hue/saturation/luminance
		var img = this.ImageFilters.HSLAdjustment(img, 0, 0, -50);
		ctx2.putImageData(img, 0, 0);
		
		//vignete
		var texture = this.fx_filter.texture(canvas2);
		this.fx_filter.draw(texture).vignette(0.2, 0.9).update();	//effect
		canvas2 = this.fx_filter;
		
		return canvas2;
	}

}

export default Effects_nightVision_class;