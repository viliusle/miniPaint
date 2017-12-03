import config from './../../config.js';
import Effects_common_class from './abstract/css.js';
import Dialog_class from './../../libs/popup.js';

class Effects_blur_class extends Effects_common_class {

	constructor() {
		super();
		this.POP = new Dialog_class();
	}

	blur() {
		var params = [
			{name: "value", title: "Percentage:", value: 5, range: [0, 50]},
		];
		this.show_dialog('blur', params);
	}

	convert_value(value, params, type) {

		//adapt size to real canvas dimensions
		if (type == 'preview') {
			var diff = (this.POP.width_mini / this.POP.height_mini) / (config.WIDTH / config.HEIGHT);

			value = value * diff;
		}

		return value + 'px';
	}

}

export default Effects_blur_class;