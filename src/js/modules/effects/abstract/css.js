import app from './../../../app.js';
import config from './../../../config.js';
import Dialog_class from './../../../libs/popup.js';
import Base_layers_class from './../../../core/base-layers.js';
import Helper_class from './../../../libs/helpers.js';

class Effects_common_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.params = null;
	}

	show_dialog(type, params) {
		var _this = this;
		var title = this.Helper.ucfirst(type);
		title = title.replace(/-/g, ' ');

		var settings = {
			title: title,
			preview: true,
			effects: true,
			params: params,
			on_change: function (params, canvas_preview, w, h) {
				_this.params = params;
				canvas_preview.filter = _this.preview(params, type);
				canvas_preview.drawImage(this.layer_active_small, 0, 0);
			},
			on_finish: function (params) {
				_this.params = params;
				_this.save(params, type);
			},
		};
		this.POP.show(settings);
	}

	save(params, type) {
		return app.State.do_action(
			new app.Actions.Add_layer_filter_action(null, type, params)
		);
	}

	preview(params, type) {
		var value = this.convert_value(params.value, params, 'preview');
		return type + "(" + value + ")";
	}

	convert_value(value, params) {
		return value;
	}

}

export default Effects_common_class;