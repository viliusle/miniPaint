import app from './../../app.js';
import config from './../../config.js';
import Base_tools_class from './../../core/base-tools.js';
import Base_layers_class from './../../core/base-layers.js';

class Heart_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'heart';
		this.layer = {};
		this.best_ratio = 1.2;
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

		ctx.save();
		ctx.translate(x + width / 2, y + height / 2);
		this.draw_shape(ctx, -width / 2, -height / 2, width, height);
		ctx.restore();
	}

	render(ctx, layer) {
		var params = layer.params;
		var fill = params.fill;

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
		this.draw_shape(ctx, -layer.width / 2, -layer.height / 2, layer.width, layer.height);

		ctx.restore();
	}

	draw_shape(ctx, x, y, width, height, coords) {
		ctx.lineJoin = "round";

		ctx.beginPath();

		ctx.scale(1.071, 1.1);
		ctx.translate(-width / 2, -height / 1.85);

		ctx.moveTo(width/2, height/5);
		ctx.bezierCurveTo(5 * width / 14, 0,
			0, height / 15,
			width / 28, 2 * height / 5);

		ctx.bezierCurveTo(width / 14, 2 * height / 3,
			3 * width / 7, 5 * height / 6,
			width / 2, height);

		ctx.bezierCurveTo(4 * width / 7, 5 * height / 6,
			13 * width / 14, 2 * height / 3,
			27 * width / 28, 2 * height / 5);

		ctx.bezierCurveTo(width, height / 15,
			9 * width / 14, 0,
			width / 2, height / 5);

		ctx.closePath();

		ctx.fill();
		ctx.stroke();
	}

}

export default Heart_class;
