import config from '../../../config.js';
import Effects_common_class from '../abstract/css.js';
import Dialog_class from '../../../libs/popup.js';
import Effects_browser_class from '../browser.js';
import Base_layers_class from './../../../core/base-layers.js';
import alertify from './../../../../../node_modules/alertifyjs/build/alertify.min.js';

class Effects_brightness_class extends Effects_common_class {

	constructor() {
		super();
		this.POP = new Dialog_class();
		this.Effects_browser = new Effects_browser_class();
		this.Base_layers = new Base_layers_class();
		this.preview_padding = 20;
	}

	shadow(filter_id) {
		if (config.layer.type == null) {
			alertify.error('Layer is empty.');
			return;
		}

		var filter = this.Base_layers.find_filter_by_id(filter_id, 'shadow');

		var params = [
			{name: "x", title: "Offset X:", value: filter.x ??= 10, range: [-100, 100]},
			{name: "y", title: "Offset Y:", value: filter.y ??= 10, range: [-100, 100]},
			{name: "value", title: "Radius:", value: filter.value ??= 5, range: [0, 100]},
			{name: "color", title: "Color:", value: filter.color ??= "#000000", type: 'color'},
		];
		this.show_dialog('shadow', params, filter_id);
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

	demo(canvas_id, canvas_thumb){
		var canvas = document.getElementById(canvas_id);
		var ctx = canvas.getContext("2d");

		//draw
		var size = this.convert_value(null, {x: 5, y: 5, value: 5, color: '#000000'}, 'preview');
		ctx.filter = "drop-shadow("+size+")";
		ctx.drawImage(canvas_thumb,
			10, 10,
			this.Effects_browser.preview_width - 20, this.Effects_browser.preview_height - 20);
		ctx.filter = 'none';
	}

	render_pre(ctx, data) {
		var value = this.convert_value(data.params.value, data.params, 'save');
		var filter = 'drop-shadow(' + value + ')';

		if(ctx.filter == 'none')
			ctx.filter = filter;
		else
			ctx.filter += ' ' + filter;
	}

	render_post(ctx, data){
		ctx.filter = 'none';
	}

}

export default Effects_brightness_class;