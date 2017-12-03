import config from './../../config.js';
import Base_gui_class from './../../core/base-gui.js';
import Dialog_class from './../../libs/popup.js';

class Image_size_class {

	constructor() {
		this.Base_gui = new Base_gui_class();
		this.POP = new Dialog_class();
	}

	size() {
		var _this = this;
		var common_dimensions = this.Base_gui.common_dimensions;

		var resolutions = ['Custom'];
		for (var i in common_dimensions) {
			var value = common_dimensions[i];
			resolutions.push(value[0] + 'x' + value[1] + ' - ' + value[2]);
		}

		var settings = {
			title: 'Size',
			params: [
				{name: "w", title: "Width:", value: config.WIDTH},
				{name: "h", title: "Height:", value: config.HEIGHT},
				{name: "resolution", title: "Resolution:", values: resolutions},
			],
			on_finish: function (params) {
				window.State.save();
				_this.size_handler(params);
			},
		};
		this.POP.show(settings);
	}

	size_handler(data) {
		var width = parseInt(data.w);
		var height = parseInt(data.h);

		if (width < 1)
			width = 1;
		if (height < 1)
			height = 1;

		if (data.resolution != 'Custom') {
			var dim = data.resolution.split(" ");
			dim = dim[0].split("x");
			width = dim[0];
			height = dim[1];
		}

		config.WIDTH = parseInt(width);
		config.HEIGHT = parseInt(height);
		this.Base_gui.prepare_canvas();
		config.need_render = true;
	}
}

export default Image_size_class;
