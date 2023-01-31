import config from '../../../config.js';
import Effects_common_class from '../abstract/css.js';
import Dialog_class from '../../../libs/popup.js';
import Base_layers_class from './../../../core/base-layers.js';
import alertify from './../../../../../node_modules/alertifyjs/build/alertify.min.js';

class Effects_blur_class extends Effects_common_class {

	constructor() {
		super();
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	blur(filter_id) {
		if (config.layer.type == null) {
			alertify.error('Layer is empty.');
			return;
		}

		var filter = this.Base_layers.find_filter_by_id(filter_id, 'blur');

		var params = [
			{name: "value", title: "Percentage:", value: filter.value ??= 5, range: [0, 50]},
		];
		this.show_dialog('blur', params, filter_id);
	}

	convert_value(value, params, type) {

		//adapt size to real canvas dimensions
		if (type == 'preview') {
			var diff = (this.POP.width_mini / this.POP.height_mini) / (config.WIDTH / config.HEIGHT);

			value = value * diff;
		}

		return value + 'px';
	}

	demo(canvas_id, canvas_thumb){
		var canvas = document.getElementById(canvas_id);
		var ctx = canvas.getContext("2d");

		//draw
		var size = this.convert_value(5, null, 'preview');
		ctx.filter = "blur("+size+")";
		ctx.drawImage(canvas_thumb, 0, 0);
		ctx.filter = 'none';
	}

	render_pre(ctx, data) {
		var value = this.convert_value(data.params.value, data.params, 'save');
		var filter = 'blur(' + value + ')';

		if(ctx.filter == 'none')
			ctx.filter = filter;
		else
			ctx.filter += ' ' + filter;
	}

	render_post(ctx, data){
		ctx.filter = 'none';
	}

}

export default Effects_blur_class;