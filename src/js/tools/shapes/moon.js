import Base_tools_class from './../../core/base-tools.js';
import Base_layers_class from './../../core/base-layers.js';

class Moon_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'moon';
		this.layer = {};
		this.best_ratio = 0.8;
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

		var width_all = width + x * 2;
		width = height * this.best_ratio;
		x = (width_all - width) / 2;

		ctx.save();
		ctx.translate(x + width / 2, y + height / 2);
		this.draw_shape(ctx, -width / 2, -height / 2, width, height, true, true);
		ctx.restore();
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
		this.draw_shape(ctx, -layer.width / 2, -layer.height / 2, layer.width, layer.height, params.fill, params.border);

		ctx.restore();
	}

	draw_shape(ctx, x, y, width, height, fill, stroke) {
		var left = parseInt(x);
		var top = parseInt(y);

		ctx.beginPath();
		ctx.moveTo(left + width * 0.512, top + height / 2);
		ctx.bezierCurveTo(
			left + width * 51.2 / 100, top + height * 28.4 / 100,
			left + width * 71.5 / 100, top + height * 10.1 / 100,
			left + width * 100 / 100, top + height * 3.1 / 100
		);
		ctx.bezierCurveTo(
			left + width * 92 / 100, top + height * 1.1 / 100,
			left + width * 83.4 / 100, top + height * 0 / 100,
			left + width * 74.4 / 100, top + height * 0 / 100
		);
		ctx.bezierCurveTo(
			left + width * 33.3 / 100, top + height * 0 / 100,
			left + width * 0 / 100, top + height * 22.4 / 100,
			left + width * 0 / 100, top + height * 50 / 100
		);
		ctx.bezierCurveTo(
			left + width * 0 / 100, top + height * 77.6 / 100,
			left + width * 33.3 / 100, top + height * 100 / 100,
			left + width * 74.4 / 100, top + height * 100 / 100
		);
		ctx.bezierCurveTo(
			left + width * 83.4 / 100, top + height * 100 / 100,
			left + width * 92 / 100, top + height * 98.9 / 100,
			left + width * 100 / 100, top + height * 96.9 / 100
		);
		ctx.bezierCurveTo(
			left + width * 71.5 / 100, top + height * 89.9 / 100,
			left + width * 51.2 / 100, top + height * 71.6 / 100,
			left + width * 51.2 / 100, top + height * 50 / 100
		);
		ctx.closePath();
		if (fill) {
			ctx.fill();
		}
		if (stroke) {
			ctx.stroke();
		}
	}

}

export default Moon_class;
