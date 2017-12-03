import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';

class Layer_rename_class {

	constructor() {
		this.Base_layers = new Base_layers_class();
		this.POP = new Dialog_class();
	}

	rename(id = null) {
		var _this = this;

		var settings = {
			title: 'Rename',
			params: [
				{name: "name", title: "Name:", value: config.layer.name},
			],
			on_load: function () {
				document.querySelector('#pop_data_name').select();
			},
			on_finish: function (params) {
				window.State.save();
				if (id == null)
					var link = config.layer;
				else
					var link = _this.Base_layers.get_layer(id);
				link.name = params.name;
				_this.Base_layers.refresh_gui();
				config.need_render = true;
			},
		};
		this.POP.show(settings);
	}
}

export default Layer_rename_class;
