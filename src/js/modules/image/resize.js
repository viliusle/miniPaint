import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Base_gui_class from './../../core/base-gui.js';
import Dialog_class from './../../libs/popup.js';
import ImageFilters_class from './../../libs/imagefilters.js';
import Hermite_class from 'hermite-resize';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import Pica from './../../../../node_modules/pica/dist/pica.js';
import Helper_class from './../../libs/helpers.js';

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
		this.pica = Pica();
		this.Helper = new Helper_class();

		this.set_events();
	}

	set_events() {
		var _this = this;

		document.addEventListener('keydown', function (event) {
			var code = event.keyCode;
			if (event.target.type == 'text' || event.target.tagName == 'INPUT' || event.target.type == 'textarea')
				return;

			if (code == 82 && event.ctrlKey != true && event.metaKey != true) {
				//R - resize
				_this.resize();
				event.preventDefault();
			}
		}, false);
	}

	resize() {
		var _this = this;

		var settings = {
			title: 'Resize',
			params: [
				{name: "width", title: "Width:", value: '', placeholder: config.WIDTH},
				{name: "height", title: "Height:", value: '', placeholder: config.HEIGHT},
				{name: "width_percent", title: "Width (%):", value: '', placeholder: 100},
				{name: "height_percent", title: "Height (%):", value: '', placeholder: 100},
				{name: "mode", title: "Mode:", values: ["Lanczos", "Hermite", "Basic"]},

				{name: "sharpen", title: "Sharpen:", value: false},
				{name: "layers", title: "Layers:", values: ["Active", "All"], value: "Active"},
			],
			on_finish: function (params) {
				_this.do_resize(params);
			},
		};
		this.POP.show(settings);
	}

	do_resize(params) {
		//validate
		if (isNaN(params.width) && isNaN(params.height) && isNaN(params.width_percent) && isNaN(params.height_percent)){
			alertify.error('Missing at least 1 size parameter.');
			return false;
		}
		if (params.width == config.WIDTH && params.height == config.HEIGHT){
			return false;
		}
		
		window.State.save();
		
		if (params.layers == 'All') {
			//resize all layers
			var skips = 0;
			for (var i in config.layers) {
				var response = this.resize_layer(config.layers[i], params);
				if(response === false){
					skips++;
				}
			}
			if (skips > 0) {
				alertify.error(skips + ' layer(s) were skipped.');
			}
		}
		else {
			//only active
			this.resize_layer(config.layer, params);
		}
	}

	/**
	 * it will try to resize layer (image, text, vector), returns false on failure.
	 * 
	 * @param {object} layer
	 * @param {object} params
	 * @returns {undefined|Boolean}
	 */
	resize_layer(layer, params) {
		var mode = params.mode;
		var width = parseInt(params.width);
		var height = parseInt(params.height);
		var width_100 = parseInt(params.width_percent);
		var height_100 = parseInt(params.height_percent);
		var sharpen = params.sharpen;
		var _this = this;

		//if dimension with percent provided
		if (isNaN(width) && isNaN(height)) {
			if (isNaN(width_100) == false) {
				width = Math.round(layer.width * width_100 / 100);
			}
			if (isNaN(height_100) == false) {
				height = Math.round(layer.height * height_100 / 100);
			}
		}

		//if only 1 dimension was provided
		if (isNaN(width) || isNaN(height)) {
			var ratio = layer.width / layer.height;
			if (isNaN(width))
				width = Math.round(height * ratio);
			if (isNaN(height))
				height = Math.round(width / ratio);
		}
		
		//is text
		if(layer.type == 'text'){
			var ratio = width / layer.width;
			layer.width = width;
			layer.height = height;
			layer.params.size = Math.ceil(layer.params.size * ratio);
			this.resize_gui();
			config.need_render = true;
			return true;
		}
		
		//is vector
		if(layer.is_vector == true && layer.width != null && layer.height != null){
			layer.width = width;
			layer.height = height;
			this.resize_gui();
			config.need_render = true;
			return true;
		}
		
		//only images supported at this point
		if (layer.type != 'image') {
			//error - no support
			alertify.error('Layer must be vector or image (convert it to raster).');
			return false;
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
			
			this.pica.resize(canvas, tmp_data, {
				alpha: true,
			})
			.then(function(result) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				canvas.width = width;
				canvas.height = height;
			
				ctx.drawImage(tmp_data, 0, 0, width, height);
				
				finish_resize();
			});
			return;
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

		finish_resize();
	
		//private finish action
		function finish_resize(){
			if (sharpen == true) {
				var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				var filtered = _this.ImageFilters.Sharpen(imageData, 1);	//add effect
				ctx.putImageData(filtered, 0, 0);
			}

			//save
			_this.Base_layers.update_layer_image(canvas, layer.id);
			layer.width = canvas.width;
			layer.height = canvas.height;
			layer.width_original = canvas.width;
			layer.height_original = canvas.height;
			config.need_render = true;
			
			_this.resize_gui();
		}
	}
	
	resize_gui() {
		var max_x = 0;
		var max_y = 0;
		
		for (var i = 0; i < config.layers.length; i++) {
			var layer = config.layers[i];
			
			if(layer.width == null || layer.height == null || layer.x == null || layer.y == null){
				//layer without dimensions
				continue;
			}

			max_x = Math.max(max_x, layer.x + layer.width);
			max_y = Math.max(max_y, layer.y + layer.height);
		}
		
		config.WIDTH = parseInt(max_x);
		config.HEIGHT = parseInt(max_y);
		this.Base_gui.prepare_canvas();
		config.need_render = true;
	}

}

export default Image_resize_class;