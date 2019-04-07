import config from './../../config.js';
import Base_gui_class from './../../core/base-gui.js';
import Base_layers_class from './../../core/base-layers.js';
import Helper_class from './../../libs/helpers.js';
import Dialog_class from './../../libs/popup.js';

/** 
 * manages files / new
 * 
 * @author ViliusL
 */
class File_new_class {

	constructor() {
		this.Base_gui = new Base_gui_class();
		this.Base_layers = new Base_layers_class();
		this.POP = new Dialog_class();
		this.Helper = new Helper_class();
	}

	new () {
		window.State.save();

		var _this = this;
		var w = config.WIDTH;
		var h = config.HEIGHT;
		var common_dimensions = this.Base_gui.common_dimensions;
		var resolutions = ['Custom'];

		for (var i in common_dimensions) {
			var value = common_dimensions[i];
			resolutions.push(value[0] + 'x' + value[1] + ' - ' + value[2]);
		}

		var save_resolution_cookie = this.Helper.getCookie('save_resolution');
		if (save_resolution_cookie) {
			var save_resolution = true;
			var last_resolution = this.Helper.getCookie('last_resolution');
			if (last_resolution) {
				last_resolution = JSON.parse(last_resolution);
				w = parseInt(last_resolution[0]);
				h = parseInt(last_resolution[1]);
			}
		}
		else {
			var save_resolution = false;
		}

		var transparency_cookie = this.Helper.getCookie('transparency');
		if (transparency_cookie === null) {
			//default
			transparency_cookie = false;
		}
		if (transparency_cookie) {
			var transparency = true;
		}
		else {
			var transparency = false;
		}

		var settings = {
			title: 'New file',
			params: [
				{name: "width", title: "Width:", value: w},
				{name: "height", title: "Height:", value: h},
				{name: "resolution", title: "Resolution:", values: resolutions},
				{name: "transparency", title: "Transparent:", value: transparency},
				{name: "save_resolution", title: "Save resolution:", value: save_resolution},
			],
			on_finish: function (params) {
				_this.new_handler(params);
			},
		};
		this.POP.show(settings);
	}

	new_handler(response) {
		var width = parseInt(response.width);
		var height = parseInt(response.height);
		var resolution = response.resolution;
		var save_resolution = response.save_resolution;
		var transparency = response.transparency;

		if (resolution != 'Custom') {
			var dim = resolution.split(" ");
			dim = dim[0].split("x");
			width = dim[0];
			height = dim[1];
		}
		if (transparency == true)
			config.TRANSPARENCY = true;
		else
			config.TRANSPARENCY = false;

		config.ZOOM = 1;
		config.WIDTH = parseInt(width);
		config.HEIGHT = parseInt(height);
		this.Base_gui.prepare_canvas();

		//prepare layers
		this.Base_layers.reset_layers();
		this.Base_layers.init_zoom_lib();
		this.Base_layers.insert({});
		config.need_render = true;

		//reset EXIF
		config.layer._exif = null;

		//last resolution
		var last_resolution = JSON.stringify([config.WIDTH, config.HEIGHT]);
		this.Helper.setCookie('last_resolution', last_resolution);

		//save_resolution
		if (save_resolution) {
			this.Helper.setCookie('save_resolution', 1);
		}
		else {
			this.Helper.setCookie('save_resolution', 0);
		}

		//transparency
		if (transparency) {
			this.Helper.setCookie('transparency', 1);
		}
		else {
			this.Helper.setCookie('transparency', 0);
		}
	}

}

export default File_new_class;