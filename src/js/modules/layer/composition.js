import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';

class Layer_composition_class {

	constructor() {
		this.POP = new Dialog_class();
	}

	composition() {
		var compositions = [
			"-- Default --",
			"color",
			"color-burn",
			"color-dodge",
			"copy",
			"darken",
			"darker",
			"destination-atop",
			"destination-in",
			"destination-out",
			"destination-over",
			"difference",
			"exclusion",
			"hard-light",
			"hue",
			"lighten",
			"lighter",
			"luminosity",
			"multiply",
			"overlay",
			"saturation",
			"screen",
			"soft-light",
			"source-atop",
			"source-in",
			"source-out",
			"source-over",
			"xor",
		];

		var initial_composition = config.layer.composition;

		var settings = {
			title: 'Composition',
			//preview: true,
			params: [
				{name: "composition", title: "Composition:", value: config.layer.composition, values: compositions},
			],
			on_change: function (params, canvas_preview, w, h) {
				//redraw preview
				if (params.composition == '-- Default --') {
					params.composition = 'source-over';
				}
				config.layer.composition = params.composition;
				config.need_render = true;
			},
			on_finish: function (params) {
				config.layer.composition = initial_composition;
				window.State.save();
				if (params.composition == '-- Default --') {
					params.composition = 'source-over';
				}
				config.layer.composition = params.composition;
				config.need_render = true;
			},
		};
		this.POP.show(settings);
	}
}

export default Layer_composition_class;
