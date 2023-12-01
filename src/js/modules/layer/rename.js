import app from './../../app.js';
import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';
import Helper_class from './../../libs/helpers.js';

class Layer_rename_class {

	constructor() {
		this.Base_layers = new Base_layers_class();
		this.POP = new Dialog_class();
		this.Helper = new Helper_class();
	}

	rename(id = null) {
		var _this = this;

		var name_ = this.Helper.escapeHtml(config.layer.name);

		var settings = {
			title: 'Rename',
			params: [
				{name: "name", title: "Name:", value: name_},
			],
			on_load: function () {
				document.querySelector('#pop_data_name').select();
			},
			on_finish: function (params) {
				app.State.do_action(
					new app.Actions.Bundle_action('rename_layer', 'Rename Layer', [
						new app.Actions.Refresh_layers_gui_action('undo'),
						new app.Actions.Update_layer_action(id || config.layer.id, {
							name: _this.validate_name(params.name)
						}),
						new app.Actions.Refresh_layers_gui_action('do')
					])
				);
			},
		};
		this.POP.show(settings);
	}

	validate_name(text) {
		text = text
			.replace(/&/g, "-")
			.replace(/</g, "-")
			.replace(/>/g, "-")
			.replace(/"/g, "-")
			.replace(/'/g, "-");

		return text;
	}
}

export default Layer_rename_class;
