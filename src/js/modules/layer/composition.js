import app from './../../app.js';
import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Base_gui_class from "../../core/base-gui.js";

class Layer_composition_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_gui_class = new Base_gui_class();
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
		var _this = this;

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
				_this.Base_gui_class.GUI_layers.render_layers();
			},
			on_finish: function (params) {
				config.layer.composition = initial_composition;
				if (params.composition == '-- Default --') {
					params.composition = 'source-over';
				}
				app.State.do_action(
					new app.Actions.Bundle_action('change_composition', 'Change Composition', [
						new app.Actions.Update_layer_action(config.layer.id, {
							composition: params.composition
						})
					])
				);
			},
			on_cancel: function (params) {
				config.layer.composition = initial_composition;
				config.need_render = true;
				_this.Base_gui_class.GUI_layers.render_layers();
			},
		};
		this.POP.show(settings);
	}
}

export default Layer_composition_class;
