import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';

class Image_opacity_class {

	constructor() {
		this.POP = new Dialog_class();
	}

	opacity() {
		var _this = this;
		var initial_opacity = config.layer.opacity;

		var settings = {
			title: 'Opacity',
			params: [
				{name: "opacity", title: "Alpha:", value: config.layer.opacity, range: [0, 100]},
			],
			on_change: function (params, canvas_preview, w, h) {
				_this.opacity_handler(params);
			},
			on_finish: function (params) {
				config.layer.opacity = initial_opacity;
				window.State.save();
				_this.opacity_handler(params);
			},
		};
		this.POP.show(settings);
	}

	opacity_handler(data) {
		var value = parseInt(data.opacity);
		if (value < 0)
			value = 0;
		if (value > 100)
			value = 100;
		config.layer.opacity = value;
		config.need_render = true;
	}
}

export default Image_opacity_class;
