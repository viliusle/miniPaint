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

	show_dialog(type, params, filter_id) {
		var _this = this;
		var title = this.Helper.ucfirst(type);
		title = title.replace(/-/g, ' ');

		var preview_padding = 0;
		if(typeof this.preview_padding != "undefined"){
			preview_padding = this.preview_padding;
		}

		var settings = {
			title: title,
			preview: true,
			preview_padding: preview_padding,
			effects: true,
			params: params,
			on_change: function (params, canvas_preview, w, h) {
				_this.params = params;
				canvas_preview.filter = _this.preview(params, type);
				canvas_preview.drawImage(this.layer_active_small,
					preview_padding, preview_padding,
					_this.POP.width_mini - preview_padding * 2, _this.POP.height_mini - preview_padding * 2
				);
			},
			on_finish: function (params) {
				_this.params = params;
				_this.save(params, type, filter_id);
			},
		};
		this.Base_layers.disable_filter(filter_id);
		this.POP.show(settings);
		this.Base_layers.disable_filter(null);
	}

	save(params, type, filter_id) {
		return app.State.do_action(
			new app.Actions.Add_layer_filter_action(null, type, params, filter_id)
		);
	}

	preview(params, type) {
		if(type == 'shadow'){
			type = 'drop-shadow';
		}

		var value = this.convert_value(params.value, params, 'preview');
		return type + "(" + value + ")";
	}

	convert_value(value, params) {
		return value;
	}

}

export default Effects_common_class;