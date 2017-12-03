import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Image_flip_class {

	constructor() {
		this.Base_layers = new Base_layers_class();
	}

	vertical() {
		this.flip('vertical');
	}

	horizontal() {
		this.flip('horizontal');
	}

	flip(mode) {
		window.State.save();

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}

		//get canvas from layer
		var canvas = this.Base_layers.convert_layer_to_canvas(null, true);
		var ctx = canvas.getContext("2d");

		//create destination canvas
		var canvas2 = document.createElement('canvas');
		canvas2.width = canvas.width;
		canvas2.height = canvas.height;
		var ctx2 = canvas2.getContext("2d");
		canvas2.dataset.x = canvas.dataset.x;
		canvas2.dataset.y = canvas.dataset.y;

		//flip
		if (mode == 'vertical') {
			ctx2.scale(1, -1);
			ctx2.drawImage(canvas, 0, canvas2.height * -1);
		}
		else if (mode == 'horizontal') {
			ctx2.scale(-1, 1);
			ctx2.drawImage(canvas, canvas2.width * -1, 0);
		}

		//save
		this.Base_layers.update_layer_image(canvas2);
	}

}

export default Image_flip_class;