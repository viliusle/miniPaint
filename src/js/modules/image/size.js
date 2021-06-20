import app from './../../app.js';
import config from './../../config.js';
import Base_gui_class from './../../core/base-gui.js';
import Dialog_class from './../../libs/popup.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import Tools_settings_class from './../tools/settings.js';
import Helper_class from './../../libs/helpers.js';

class Image_size_class {

	constructor() {
		this.Base_gui = new Base_gui_class();
		this.POP = new Dialog_class();
		this.Tools_settings = new Tools_settings_class();
		this.Helper = new Helper_class();
	}

	size() {
		var _this = this;
		var common_dimensions = this.Base_gui.common_dimensions;
		var units = this.Tools_settings.get_setting('default_units');
		var resolution = this.Tools_settings.get_setting('resolution');

		var resolutions = ['Custom'];
		for (var i in common_dimensions) {
			var value = common_dimensions[i];
			resolutions.push(value[0] + 'x' + value[1] + ' - ' + value[2]);
		}

		//convert units
		var width = this.Helper.get_user_unit(config.WIDTH, units, resolution);
		var height = this.Helper.get_user_unit(config.HEIGHT, units, resolution);

		var settings = {
			title: 'Canvas size',
			params: [
				{name: "w", title: "Width:", value: width, placeholder: width, comment: units},
				{name: "h", title: "Height:", value: height, placeholder: height, comment: units},
				{name: "resolution", title: "Resolution:", values: resolutions},
				{name: "layout", title: "Layout:", value: "Custom", values: ["Custom", "Landscape", "Portrait"]},
			],
			on_finish: function (params) {
				_this.size_handler(params);
			},
		};
		this.POP.show(settings);
	}

	size_handler(data) {
		var width = parseFloat(data.w);
		var height = parseFloat(data.h);
		var ratio = config.WIDTH / config.HEIGHT;
		var units = this.Tools_settings.get_setting('default_units');
		var resolution = this.Tools_settings.get_setting('resolution');

		if (width < 1){
			width = 1;
		}
		if (height < 1){
			height = 1;
		}
		
		//aspect ratio
		if (isNaN(width) && isNaN(height)){
			alertify.error('Wrong dimensions');
			return;
		}
		if (isNaN(width)){
			width = height * ratio;
		}
		if (isNaN(height)){
			height = width / ratio;
		}
		
		if (data.resolution != 'Custom') {
			var dim = data.resolution.split(" ");
			dim = dim[0].split("x");
			width = parseInt(dim[0]);
			height = parseInt(dim[1]);

			if(data.layout == 'Portrait'){
				var tmp = width;
				width = height;
				height = tmp;
			}
		}
		else{
			//convert units
			width = this.Helper.get_internal_unit(width, units, resolution);
			height = this.Helper.get_internal_unit(height, units, resolution);
		}

		app.State.do_action(
			new app.Actions.Bundle_action('set_image_size', 'Set Image Size', [
				new app.Actions.Prepare_canvas_action('undo'),
				new app.Actions.Update_config_action({
					WIDTH: parseInt(width),
					HEIGHT: parseInt(height)
				}),
				new app.Actions.Prepare_canvas_action('do')
			])
		);
	}
}

export default Image_size_class;
