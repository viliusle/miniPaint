import app from './../../app.js';
import config from './../../config.js';
import Base_tools_class from './../../core/base-tools.js';
import Base_layers_class from './../../core/base-layers.js';

class Star_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'star';
		this.layer = {};
		this.best_ratio = 1;
		this.coords = [];
		this.snap_line_info = {x: null, y: null};
	}

	load() {
		this.default_events();
	}

	mousedown(e) {
		this.shape_mousedown(e);
	}

	mousemove(e) {
		this.shape_mousemove(e);
	}

	mouseup(e) {
		this.shape_mouseup(e);
	}

	render_overlay(ctx){
		var ctx = this.Base_layers.ctx;
		this.render_overlay_parent(ctx);
	}

	generate_coords(spikes, innerRadius) {
		//settings

		innerRadius = parseInt(innerRadius) / 2;
		innerRadius = Math.min(Math.max(innerRadius, 0), 100);

		spikes = parseInt(spikes);
		spikes = Math.max(spikes, 3);

		var outerRadius = 50;
		if(spikes == 5){
			outerRadius = 53;
		}

		var cx = 50;

		var cy = 50;
		if(spikes == 5){
			cy = 55;
		}

		var rot = Math.PI / 2 * 3;
		var x = cx;
		var y = cy;
		var step = Math.PI / spikes;
		this.coords = [];
		this.coords.push([cx, cy - outerRadius]);
		for (var i = 0; i < spikes; i++) {
			x = cx + Math.cos(rot) * outerRadius;
			y = cy + Math.sin(rot) * outerRadius;
			this.coords.push([x, y]);
			rot += step;

			x = cx + Math.cos(rot) * innerRadius;
			y = cy + Math.sin(rot) * innerRadius;
			this.coords.push([x, y]);
			rot += step;
		}
		this.coords.push([cx, cy - outerRadius]);
	}

	demo(ctx, x, y, width, height) {
		this.generate_coords(5, 40);
		this.draw_shape(ctx, x, y, width, height, this.coords);
	}

	render(ctx, layer) {
		var params = layer.params;
		var fill = params.fill;

		this.generate_coords(params.corners, params.inner_radius);

		ctx.save();

		//set styles
		ctx.strokeStyle = 'transparent';
		ctx.fillStyle = 'transparent';
		if(params.border)
			ctx.strokeStyle = params.border_color;
		if(params.fill)
			ctx.fillStyle = params.fill_color;
		ctx.lineWidth = params.border_size;

		//draw with rotation support
		ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
		ctx.rotate(layer.rotate * Math.PI / 180);
		this.draw_shape(ctx, -layer.width / 2, -layer.height / 2, layer.width, layer.height, this.coords, false);

		ctx.restore();
	}

}

export default Star_class;
