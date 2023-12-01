import app from './../../app.js';
import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Base_gui_class from './../../core/base-gui.js';
import Dialog_class from './../../libs/popup.js';
import ImageFilters_class from './../../libs/imagefilters.js';
import Hermite_class from 'hermite-resize';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import Pica from './../../../../node_modules/pica/dist/pica.js';
import Helper_class from './../../libs/helpers.js';
import Tools_settings_class from './../tools/settings.js';
import { metaDefaults as textMetaDefaults } from '../../tools/text.js';

var instance = null;

class Image_resize_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Base_layers = new Base_layers_class();
		this.Base_gui = new Base_gui_class();
		this.POP = new Dialog_class();
		this.ImageFilters = ImageFilters_class;
		this.Hermite = new Hermite_class();
		this.Tools_settings = new Tools_settings_class();
		this.pica = Pica();
		this.Helper = new Helper_class();

		this.set_events();
	}

	set_events() {
		document.addEventListener('keydown', (event) => {
			var code = event.keyCode;
			if (this.Helper.is_input(event.target))
				return;

			if (code == 82 && event.ctrlKey != true && event.metaKey != true) {
				//R - resize
				this.resize();
				event.preventDefault();
			}
		}, false);
	}

	resize() {
		var _this = this;
		var units = this.Tools_settings.get_setting('default_units');
		var resolution = this.Tools_settings.get_setting('resolution');

		//convert units
		var width = this.Helper.get_user_unit(config.WIDTH, units, resolution);
		var height = this.Helper.get_user_unit(config.HEIGHT, units, resolution);

		var settings = {
			title: 'Resize',
			params: [
				{name: "width", title: "Width:", value: '', placeholder: width, comment: units},
				{name: "height", title: "Height:", value: '', placeholder: height, comment: units},
				{name: "width_percent", title: "Width (%):", value: '', placeholder: 100, comment: "%"},
				{name: "height_percent", title: "Height (%):", value: '', placeholder: 100, comment: "%"},
				{name: "mode", title: "Mode:", values: ["Lanczos", "Hermite", "Basic"]},

				{name: "sharpen", title: "Sharpen:", value: false},
				{name: "layers", title: "Layers:", values: ["All", "Active"], value: "All"},
			],
			on_finish: function (params) {
				_this.do_resize(params);
			},
		};
		this.POP.show(settings);

		document.getElementById("pop_data_width").select();
	}

	async do_resize(params) {
		//validate
		if (isNaN(params.width) && isNaN(params.height) && isNaN(params.width_percent) && isNaN(params.height_percent)) {
			alertify.error('Missing at least 1 size parameter.');
			return false;
		}
		
		// Build a list of actions to execute for resize
		let actions = [];
		
		if (params.layers == 'All') {
			//resize all layers
			var skips = 0;
			for (var i in config.layers) {
				try {
					actions = actions.concat(await this.resize_layer(config.layers[i], params));
				} catch (error) {
					skips++;
				}
			}
			if (skips > 0) {
				alertify.error(skips + ' layer(s) were skipped.');
			}
			actions = actions.concat(this.resize_gui(params));
		}
		else {
			//only active
			actions = actions.concat(await this.resize_layer(config.layer, params));
		}
		return app.State.do_action(
			new app.Actions.Bundle_action('resize_layers', 'Resize Layers', actions)
		);
	}

	/**
	 * Generates actions that will resize layer (image, text, vector), returns a promise that rejects on failure.
	 * 
	 * @param {object} layer
	 * @param {object} params
	 * @returns {Promise<object>} Returns array of actions to perform
	 */
	async resize_layer(layer, params) {
		var units = this.Tools_settings.get_setting('default_units');
		var resolution = this.Tools_settings.get_setting('resolution');
		var mode = params.mode;
		var width = parseFloat(params.width);
		var height = parseFloat(params.height);
		var width_100 = parseInt(params.width_percent);
		var height_100 = parseInt(params.height_percent);
		var canvas_width = layer.width;
		var canvas_height = layer.height;
		var sharpen = params.sharpen;
		var _this = this;

		//convert units
		if (isNaN(width) == false){
			width = this.Helper.get_internal_unit(width, units, resolution);
		}
		if (isNaN(height) == false){
			height = this.Helper.get_internal_unit(height, units, resolution);
		}

		//if dimension with percent provided
		if (isNaN(width) && isNaN(height)) {
			if (isNaN(width_100) == false) {
				width = Math.round(config.WIDTH * width_100 / 100);
				canvas_width = Math.round(config.WIDTH * width_100 / 100);
			}
			if (isNaN(height_100) == false) {
				height = Math.round(config.HEIGHT * height_100 / 100);
				canvas_height = Math.round(config.HEIGHT * height_100 / 100);
			}
		}

		//if only 1 dimension was provided
		if (isNaN(width) || isNaN(height)) {
			var ratio = layer.width / layer.height;
			var canvas_ratio = config.WIDTH / config.HEIGHT;
			if (isNaN(width))
				width = Math.round(height * ratio);
				canvas_width = Math.round(canvas_height * canvas_ratio);
			if (isNaN(height))
				height = Math.round(width / ratio);
				canvas_height = Math.round(canvas_width / canvas_ratio);
		}

		let new_x = params.layers == 'All' ? Math.round(layer.x * width / config.WIDTH) : layer.x;
		let new_y = params.layers == 'All' ? Math.round(layer.y * height / config.HEIGHT) : layer.y;
		let xratio = width / config.WIDTH;
		let yratio = height / config.HEIGHT;
		
		//is text
		if (layer.type == 'text') {
			let data = JSON.parse(JSON.stringify(layer.data));
			for (let line of data) {
				for (let span of line) {
					span.meta.size = Math.ceil((span.meta.size || textMetaDefaults.size) * xratio);
					span.meta.stroke_size = parseFloat((0.1 * Math.round((span.meta.stroke_size != null ? span.meta.stroke_size : textMetaDefaults.stroke_size) * xratio / 0.1)).toFixed(1));
					span.meta.kerning = Math.ceil((span.meta.kerning || textMetaDefaults.kerning) * xratio);
				}
			}

			// Return actions
			return [
				new app.Actions.Update_layer_action(layer.id, {
					x: new_x, 
					y: new_y,
					data,
					width: layer.width * xratio,
					height: layer.height * yratio
				})
			];
		}
		
		//is vector
		else if (layer.is_vector == true && layer.width != null && layer.height != null) {
			// Return actions
			return [
				new app.Actions.Update_layer_action(layer.id, {
					x: new_x, 
					y: new_y,
					width: layer.width * xratio,
					height: layer.height * yratio
				})
			];
		}
		
		//only images supported at this point
		else if (layer.type != 'image') {
			//error - no support
			alertify.error('Layer must be vector or image (convert it to raster).');
			throw new Error('Layer is not compatible with resize');
		}
		
		//get canvas from layer
		var canvas = this.Base_layers.convert_layer_to_canvas(layer.id, true, false);
		var ctx = canvas.getContext("2d");

		//validate
		if (mode == "Hermite" && (width > canvas.width || height > canvas.height)) {
			alertify.warning('Scaling up is not supported in Hermite, using Lanczos.');
			mode = "Lanczos";
		}
		
		//resize
		if (mode == "Lanczos") {
			//Pica resize with max quality
			
			var tmp_data = document.createElement("canvas");
			tmp_data.width = width;
			tmp_data.height = height;
			
			await this.pica.resize(canvas, tmp_data, {
				alpha: true,
			})
			.then((result) => {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				canvas.width = width;
				canvas.height = height;
				ctx.drawImage(tmp_data, 0, 0, width, height);
			});
		}
		else if (mode == "Hermite") {
			//Hermite resample
			this.Hermite.resample_single(canvas, width, height, true);
		}
		else {
			//simple resize
			var tmp_data = document.createElement("canvas");
			tmp_data.width = canvas.width;
			tmp_data.height = canvas.height;
			tmp_data.getContext("2d").drawImage(canvas, 0, 0);
			
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			canvas.width = width;
			canvas.height = height;
			
			ctx.drawImage(tmp_data, 0, 0, width, height);
		}

		if (sharpen == true) {
			var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			var filtered = _this.ImageFilters.Sharpen(imageData, 1);	//add effect
			ctx.putImageData(filtered, 0, 0);
		}

		// Return actions
		return [
			new app.Actions.Update_layer_image_action(canvas, layer.id),
			new app.Actions.Update_layer_action(layer.id, {
				x: new_x, 
				y: new_y,
				width: canvas.width,
				height: canvas.height,
				width_original: canvas.width,
				height_original: canvas.height
			})
		];
	}
	
	resize_gui(params) {
		var units = this.Tools_settings.get_setting('default_units');
		var resolution = this.Tools_settings.get_setting('resolution');

		var width = parseFloat(params.width);
		var height = parseFloat(params.height);
		var width_100 = parseInt(params.width_percent);
		var height_100 = parseInt(params.height_percent);

		//convert units
		if (isNaN(width) == false){
			width = this.Helper.get_internal_unit(width, units, resolution);
		}
		if (isNaN(height) == false){
			height = this.Helper.get_internal_unit(height, units, resolution);
		}

		//if dimension with percent provided
		if (isNaN(width) && isNaN(height)) {
			if (isNaN(width_100) == false) {
				width = Math.round(config.WIDTH * width_100 / 100);
			}
			if (isNaN(height_100) == false) {
				height = Math.round(config.HEIGHT * height_100 / 100);
			}
		}

		//if only 1 dimension was provided
		if (isNaN(width) || isNaN(height)) {
			var ratio = config.WIDTH / config.HEIGHT;
			if (isNaN(width))
				width = Math.round(height * ratio);
			if (isNaN(height))
				height = Math.round(width / ratio);
		}

		return [
			new app.Actions.Prepare_canvas_action('undo'),
			new app.Actions.Update_config_action({
				WIDTH: parseInt(width),
				HEIGHT: parseInt(height)
			}),
			new app.Actions.Prepare_canvas_action('do')
		];
	}

}

export default Image_resize_class;