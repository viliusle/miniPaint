import app from './../../app.js';
import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';
import ImageFilters from './../../libs/imagefilters.js';
import Image_trim_class from './../image/trim.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

class Tools_contentFill_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Image_trim = new Image_trim_class();
	}

	content_fill() {
		var _this = this;

		if (config.layer.type != 'image') {
			alertify.error('This layer must contain an image. Please convert it to raster to apply this tool.');
			return;
		}
		if (config.layer.x == 0 && config.layer.y == 0 && config.layer.width == config.WIDTH
			&& config.layer.height == config.HEIGHT) {
			alertify.error('Can not use this tool on current layer: image already takes all area.');
			return;
		}

		var settings = {
			title: 'Content Fill',
			preview: true,
			on_change: function (params, canvas_preview, w, h, canvasElement) {
				canvas_preview.clearRect(0, 0, w, h);

				//create tmp canvas
				var canvas = document.createElement('canvas');
				canvas.width = config.WIDTH;
				canvas.height = config.HEIGHT;

				//change data
				_this.change(canvas, params);

				//add to preview
				canvas_preview.drawImage(canvas, 0, 0, w, h);
			},
			params: [
				{name: "mode", title: "Mode:", values: ['Expand edges', 'Cloned edges', 'Resized as background'], },
				{name: "blur_power", title: "Blur power:", value: 5, range: [1, 20]},
				{name: "blur_h", title: "Horizontal blur:", value: 5, range: [0, 30]},
				{name: "blur_v", title: "Vertical blur:", value: 5, range: [0, 30]},
				{name: "clone_count", title: "Clone count:", value: 15, range: [10, 50]},
			],
			on_finish: function (params) {
				_this.apply_affect(params);
			},
		};
		this.POP.show(settings);
	}

	apply_affect(params) {
		//create tmp canvas
		var canvas = document.createElement('canvas');
		canvas.width = config.WIDTH;
		canvas.height = config.HEIGHT;

		//change data
		this.change(canvas, params);

		//save
		return app.State.do_action(
			new app.Actions.Bundle_action('content_fill', 'Content Fill', [
				new app.Actions.Update_layer_action(config.layer.id, {
					x: 0,
					y: 0,
					width: config.WIDTH,
					height: config.HEIGHT
				}),
				new app.Actions.Update_layer_image_action(canvas)
			])
		);
	}

	change(canvas, params) {
		var ctx = canvas.getContext("2d");
		var mode = params.mode;

		//generate background
		if (mode == 'Expand edges')
			this.add_edge_background(canvas, params);
		else if (mode == 'Resized as background')
			this.add_resized_background(canvas, params);
		else if (mode == 'Cloned edges')
			this.add_cloned_background(canvas, params);

		//draw original image
		this.Base_layers.render_object(ctx, config.layer);
	}

	add_edge_background(canvas, params) {
		var ctx = canvas.getContext("2d");
		var trim_info = this.Image_trim.get_trim_info(config.layer.id);
		var original = this.Base_layers.convert_layer_to_canvas();

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(original, trim_info.left, trim_info.top);

		//draw top
		ctx.drawImage(original,
			0, 0, original.width, 1, //source
			trim_info.left, 0, original.width, trim_info.top); //target

		//bottom
		ctx.drawImage(original,
			0, original.height - 1, original.width, 1,
			trim_info.left, trim_info.top + original.height, original.width, canvas.height);

		//left
		ctx.drawImage(original,
			0, 0, 1, original.height,
			0, trim_info.top, trim_info.left, original.height);

		//right
		ctx.drawImage(original,
			original.width - 1, 0, 1, original.height,
			trim_info.left + original.width, trim_info.top, canvas.width, original.height);

		//fill corners

		//left top
		ctx.drawImage(original,
			0, 0, 1, 1,
			0, 0, trim_info.left, trim_info.top);

		//right top
		ctx.drawImage(original,
			original.width - 1, 0, 1, 1,
			trim_info.left + original.width, 0, canvas.width, trim_info.top);

		//left bottom
		ctx.drawImage(original,
			0, original.height - 1, 1, 1,
			0, trim_info.top + original.height, trim_info.left, trim_info.bottom);

		//right bottom
		ctx.drawImage(original,
			original.width - 1, original.height - 1, 1, 1,
			trim_info.left + original.width, trim_info.top + original.height, trim_info.right, trim_info.bottom);

		//add blur
		var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var blurred = ImageFilters.BoxBlur(img, params.blur_h, params.blur_v, params.blur_power);
		ctx.putImageData(blurred, 0, 0);
	}

	add_resized_background(canvas, params) {
		var ctx = canvas.getContext("2d");

		//draw original resized
		var original = this.Base_layers.convert_layer_to_canvas();
		ctx.drawImage(original, 0, 0, canvas.width, canvas.height);

		//add blur
		var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var blurred = ImageFilters.BoxBlur(img, params.blur_h, params.blur_v, params.blur_power);
		ctx.putImageData(blurred, 0, 0);
	}

	add_cloned_background(canvas, params) {
		var blocks = params.clone_count;
		var ctx = canvas.getContext("2d");
		var trim_info = this.Image_trim.get_trim_info(config.layer.id);
		var original = this.Base_layers.convert_layer_to_canvas();

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(original, trim_info.left, trim_info.top);

		//top
		var bsize = Math.ceil(original.width / blocks);
		for (var i = 0; i < original.width; i = i + bsize) {
			for (var j = 0; j < trim_info.top; j = j + bsize) {
				ctx.drawImage(original,
					i, 0, bsize, bsize,
					trim_info.left + i, 0 + j, bsize, bsize);
			}
		}

		//bottom
		var bsize = Math.ceil(original.width / blocks);
		for (var i = 0; i < original.width; i = i + bsize) {
			for (var j = 0; j < canvas.height; j = j + bsize) {
				ctx.drawImage(original,
					i, original.height - bsize, bsize, bsize,
					trim_info.left + i, trim_info.top + original.height + j, bsize, bsize);
			}
		}

		//left
		var bsize = Math.ceil(original.height / blocks);
		for (var i = 0; i < trim_info.left; i = i + bsize) {
			for (var j = trim_info.top; j < trim_info.top + original.height; j = j + bsize) {
				ctx.drawImage(original,
					0, j - trim_info.top, bsize, bsize,
					i, j, bsize, bsize);
			}
		}

		//right
		var bsize = Math.ceil(original.height / blocks);
		for (var i = trim_info.left + original.width; i < canvas.width; i = i + bsize) {
			for (var j = trim_info.top; j < trim_info.top + original.height; j = j + bsize) {
				ctx.drawImage(original,
					original.width - bsize, j - trim_info.top, bsize, bsize,
					i, j, bsize, bsize);
			}
		}

		//corners
		var bsize = Math.ceil(Math.min(original.width, original.height) / blocks);

		//top left
		for (var i = 0; i < trim_info.left; i = i + bsize) {
			for (var j = 0; j < trim_info.top; j = j + bsize) {
				ctx.drawImage(original,
					0, 0, bsize, bsize,
					i, j, bsize, bsize);
			}
		}

		//top right
		for (var i = trim_info.left + original.width; i < canvas.width; i = i + bsize) {
			for (var j = 0; j < trim_info.top; j = j + bsize) {
				ctx.drawImage(original,
					original.width - bsize, 0, bsize, bsize,
					i, j, bsize, bsize);
			}
		}

		//bottom left
		for (var i = 0; i < trim_info.left; i = i + bsize) {
			for (var j = trim_info.top + original.height; j < canvas.height; j = j + bsize) {
				ctx.drawImage(original,
					0, original.height - bsize, bsize, bsize,
					i, j, bsize, bsize);
			}
		}

		//bottom right
		for (var i = trim_info.left + original.width; i < canvas.width; i = i + bsize) {
			for (var j = trim_info.top + original.height; j < canvas.height; j = j + bsize) {
				ctx.drawImage(original,
					original.width - bsize, original.height - bsize, bsize, bsize,
					i, j, bsize, bsize);
			}
		}


		//add blur
		var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var blurred = ImageFilters.BoxBlur(img, params.blur_h, params.blur_v, params.blur_power);
		ctx.putImageData(blurred, 0, 0);
	}

}

export default Tools_contentFill_class;