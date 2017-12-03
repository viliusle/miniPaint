import config from './../../config.js';
import Effects_common_class from './abstract/css.js';
import Dialog_class from './../../libs/popup.js';

class Effects_brightness_class extends Effects_common_class {

	constructor() {
		super();
		this.POP = new Dialog_class();
	}

	shadow() {
		var params = [
			{name: "x", title: "Offset X:", value: 10, range: [-100, 100]},
			{name: "y", title: "Offset Y:", value: 10, range: [-100, 100]},
			{name: "value", title: "Radius:", value: 5, range: [0, 100]},
			{name: "color", title: "Color:", value: "#000000", type: 'color'},
		];
		this.show_dialog('shadow', params);
	}

	convert_value(value, params, type) {
		var system_value = value;

		//adapt size to real canvas dimensions
		if (type == 'preview') {
			var diff = (this.POP.width_mini / this.POP.height_mini) / (config.WIDTH / config.HEIGHT);

			params.x = params.x * (this.POP.width_mini / config.WIDTH);
			params.y = params.y * (this.POP.height_mini / config.HEIGHT);
			params.value = params.value * diff;
		}

		return params.x + "px " + params.y + "px " + params.value + "px " + params.color;
	}

}
;

export default Effects_brightness_class;