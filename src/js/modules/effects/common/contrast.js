import Effects_common_class from '../abstract/css.js';
import Base_layers_class from './../../../core/base-layers.js';
import config from "../../../config";
import alertify from './../../../../../node_modules/alertifyjs/build/alertify.min.js';

class Effects_contrast_class extends Effects_common_class {

	constructor() {
		super();
		this.Base_layers = new Base_layers_class();
	}

	contrast(filter_id) {
		if (config.layer.type == null) {
			alertify.error('Layer is empty.');
			return;
		}

		var filter = this.Base_layers.find_filter_by_id(filter_id, 'contrast');

		var params = [
			{name: "value", title: "Percentage:", value: filter.value ??= 40, range: [-100, 100]},
		];
		this.show_dialog('contrast', params, filter_id);
	}

	convert_value(value) {
		var system_value;
		if (value > 0) {
			system_value = value / 100 + 1;
		}
		else if (value < 0) {
			system_value = value / 100 + 1;
		}
		else {
			system_value = 1;
		}

		return system_value;
	}

	demo(canvas_id, canvas_thumb){
		var canvas = document.getElementById(canvas_id);
		var ctx = canvas.getContext("2d");

		//draw
		var size = this.convert_value(40, null, 'preview');
		ctx.filter = "contrast("+size+")";
		ctx.drawImage(canvas_thumb, 0, 0);
		ctx.filter = 'none';
	}

	render_pre(ctx, data) {
		var value = this.convert_value(data.params.value, data.params, 'save');
		var filter = 'contrast(' + value + ')';

		if(ctx.filter == 'none')
			ctx.filter = filter;
		else
			ctx.filter += ' ' + filter;
	}

	render_post(ctx, data){
		ctx.filter = 'none';
	}

}

export default Effects_contrast_class;