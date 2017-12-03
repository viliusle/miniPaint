import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';

class Image_translate_class {

	constructor() {
		this.POP = new Dialog_class();
	}

	translate() {
		var settings = {
			title: 'Translate',
			params: [
				{name: "x", title: "X position:", value: config.layer.x},
				{name: "y", title: "Y position:", value: config.layer.x},
			],
			on_finish: function (params) {
				window.State.save();
				config.layer.x = parseInt(params.x);
				config.layer.y = parseInt(params.y);
				config.need_render = true;
			},
		};
		this.POP.show(settings);
	}
}

export default Image_translate_class;
