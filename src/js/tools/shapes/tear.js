import Base_tools_class from './../../core/base-tools.js';
import Base_layers_class from './../../core/base-layers.js';

class Tear_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'tear';
		this.layer = {};
		this.best_ratio = 0.7;
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

		//settings
		var curve_height = 29 / 100;
		var curve_start_x = 28 / 100;
		var curve_end_x = 1 - curve_start_x;
		var curve_cdx = 70;
		var curve_cdy = 58;

		ctx.beginPath();
		ctx.moveTo(left + width * 0.5, top);
		ctx.quadraticCurveTo(
			left + width * 0.5, top + height * 13 / 100,
			left + width * curve_end_x, top + height * curve_height
		);
		ctx.bezierCurveTo(
			left + width * (50 + curve_cdx) / 100, top + height * curve_cdy / 100,
			left + width * 100 / 100, top + height * 100 / 100,
			left + width * 0.5, top + height
		);
		ctx.bezierCurveTo(
			left + width * 0 / 100, top + height * 100 / 100,
			left + width * (50 - curve_cdx) / 100, top + height * curve_cdy / 100,
			left + width * curve_start_x, top + height * curve_height
		);
		ctx.quadraticCurveTo(
			left + width * 0.5, top + height * 13 / 100,
			left + width * 0.5, top
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

export default Tear_class;
