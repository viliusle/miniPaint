import app from './../../app.js';
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
				{name: "y", title: "Y position:", value: config.layer.y},
			],
			on_finish: function (params) {
				app.State.do_action(
					new app.Actions.Bundle_action('translate_layer', 'Translate Layer', [
						new app.Actions.Update_layer_action(config.layer.id, {
							x: parseInt(params.x),
							y: parseInt(params.y)
						})
					])
				);
			},
		};
		this.POP.show(settings);
	}
}

export default Image_translate_class;
