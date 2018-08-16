import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Dialog_class from './../../libs/popup.js';

class Tools_borders_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Base_layers = new Base_layers_class();
	}

	borders() {
		var _this = this;

		var settings = {
			title: 'Borders',
			preview: true,
			on_change: function (params, canvas_preview, w, h) {
				var target = Math.min(w, h);
				params.size = Math.round(target / 100 * params.size);
				_this.preview_borders(params, canvas_preview, w, h);
			},
			params: [
				{name: "color", title: "Color:", value: config.COLOR, type: 'color'},
				{name: "shadow", title: "Shadow:", value: false},
				{name: "size", title: "Size:", value: "5", range: [1, 100]},
			],
			on_finish: function (params) {
				var target = Math.min(config.WIDTH, config.HEIGHT);
				params.size = Math.round(target / 100 * params.size);
				_this.add_borders(params);
			},
		};
		this.POP.show(settings);
	}

	preview_borders(params, ctx, width, height) {
		var size = params.size;
		var color = params.color;
		var color = params.color;

		ctx.save();
		ctx.lineWidth = size;
		if (params.shadow === true) {
			//with shadow
			ctx.beginPath();
			ctx.shadowColor = color;
			ctx.shadowBlur = size;
			ctx.rect(-size / 2, -size / 2, width + size, height + size);
			ctx.stroke();
			ctx.stroke();
			ctx.stroke();
		}
		else {
			ctx.strokeStyle = color;
			ctx.rect(0, 0, width, height);
			ctx.stroke();
		}
		ctx.restore();
	}

	add_borders(params) {
		window.State.save();

		//create borders layer
		this.layer = {
			name: 'Borders',
			type: 'borders',
			render_function: ['borders', 'render'],
			params: {size: params.size, shadow: params.shadow},
			color: params.color,
			x: null,
			y: null,
			width: null,
			height: null,
			is_vector: true,
		};
		this.Base_layers.insert(this.layer);
	}

}

export default Tools_borders_class;