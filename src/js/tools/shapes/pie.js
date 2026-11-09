import app from './../../app.js';
import config from './../../config.js';
import Base_tools_class from './../../core/base-tools.js';
import Base_layers_class from './../../core/base-layers.js';

class Pie_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'pie';
		this.layer = {};
		this.best_ratio = 1;
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

	demo(ctx, x, y, width, height) {
		ctx.fillStyle = '#aaa';
		ctx.strokeStyle = '#555';
		ctx.lineWidth = 2;

		var size = Math.min(width, height);
		this.draw_shape(ctx, x + (width - size) / 2, y + (height - size) / 2, size, size, 270);
	}

	render(ctx, layer) {
		var params = layer.params;

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
		this.draw_shape(ctx, -layer.width / 2, -layer.height / 2, layer.width, layer.height, params.angle);

		ctx.restore();
	}

	draw_shape(ctx, x, y, width, height, angle) {
		angle = parseInt(angle);
		if(isNaN(angle))
			angle = 270;
		angle = Math.min(Math.max(angle, 1), 360);

		//gap is centered on the right side
		var start = (360 - angle) / 2 * Math.PI / 180;
		var end = start + angle * Math.PI / 180;
		var cx = x + width / 2;
		var cy = y + height / 2;

		ctx.lineJoin = "round";
		ctx.beginPath();
		if(angle < 360)
			ctx.moveTo(cx, cy);
		//ellipse() throws on negative radius
		ctx.ellipse(cx, cy, Math.abs(width / 2), Math.abs(height / 2), 0, start, end);
		ctx.closePath();

		ctx.fill();
		ctx.stroke();
	}

}

export default Pie_class;
