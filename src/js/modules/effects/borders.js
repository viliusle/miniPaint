import app from './../../app.js';
import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import Effects_browser_class from "./browser";

class Effects_borders_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
		this.Effects_browser = new Effects_browser_class();
	}

	borders(filter_id) {
		if (config.layer.type == null) {
			alertify.error('Layer is empty.');
			return;
		}

		var _this = this;
		var filter = this.Base_layers.find_filter_by_id(filter_id, 'borders');

		var settings = {
			title: 'Borders',
			params: [
				{name: "color", title: "Color:", value: filter.color ??= config.COLOR, type: 'color'},
				{name: "size", title: "Size:", value: filter.size ??= 10},
			],
			on_finish: function (params) {
				var target = Math.min(config.WIDTH, config.HEIGHT);
				_this.add_borders(params, filter_id);
			},
		};
		var rotate = config.layer.rotate;
		config.layer.rotate = 0;
		this.Base_layers.disable_filter(filter_id);
		this.POP.show(settings);
		config.layer.rotate = rotate;
		this.Base_layers.disable_filter(null);
	}

	demo(canvas_id, canvas_thumb){
		var canvas = document.getElementById(canvas_id);
		var ctx = canvas.getContext("2d");

		//draw
		ctx.drawImage(canvas_thumb,
			5, 5,
			this.Effects_browser.preview_width - 10, this.Effects_browser.preview_height - 10);

		//add borders
		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 10;
		ctx.beginPath();
		ctx.rect(0, 0, canvas.width, canvas.height);
		ctx.stroke();
	}

	render_pre(ctx, data) {

	}

	render_post(ctx, data, layer){
		var size = Math.max(0, data.params.size);

		var x = layer.x;
		var y = layer.y;
		var width = parseInt(layer.width);
		var height = parseInt(layer.height);

		//legacy check
		if(x == null) x = 0;
		if(y == null) y = 0;
		if(!width) width = config.WIDTH;
		if(!height) height = config.HEIGHT;

		ctx.save();

		//set styles
		ctx.strokeStyle = data.params.color;
		ctx.lineWidth = size;

		//draw with rotation support
		ctx.translate(layer.x + width / 2, layer.y + height / 2);
		ctx.rotate(layer.rotate * Math.PI / 180);
		var x_new = -width / 2;
		var y_new = -height / 2;

		ctx.beginPath();
		ctx.rect(x_new - size * 0.5, y_new - size * 0.5, width + size, height + size);
		ctx.stroke();

		ctx.restore();
	}

	add_borders(params, filter_id) {
		//apply effect
		return app.State.do_action(
			new app.Actions.Add_layer_filter_action(config.layer.id, 'borders', params, filter_id)
		);
	}

}

export default Effects_borders_class;