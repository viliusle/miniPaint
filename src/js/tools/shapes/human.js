import app from './../../app.js';
import config from './../../config.js';
import Base_tools_class from './../../core/base-tools.js';
import Base_layers_class from './../../core/base-layers.js';

class Human_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'human';
		this.layer = {};
		this.best_ratio = 0.35;
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

	draw_shape(ctx, x, y, width, height) {
		ctx.lineJoin = "round";

		ctx.beginPath();

		ctx.translate(-width / 2, -height / 2);

		var radius = Math.sqrt(width * height) * 0.28;
		var neck_height = height * 0.07;
		var leg_height = height * 0.3;
		if(radius * 2 + neck_height + leg_height > height){
			radius = (height - leg_height - neck_height) / 2;
		}

		ctx.arc(width / 2, radius, radius, 0, 2 * Math.PI);
		//body
		ctx.moveTo(width / 2, radius * 2);
		ctx.lineTo(width / 2, height - leg_height);
		//arm
		ctx.moveTo(0, radius*2 + neck_height);
		ctx.lineTo(width, radius*2 + neck_height);
		//left leg
		ctx.moveTo(width / 2, height - leg_height);
		ctx.lineTo(0, height);
		//right leg
		ctx.moveTo(width / 2, height - leg_height);
		ctx.lineTo(width, height);

		ctx.fill();
		ctx.stroke();
	}

}

export default Human_class;
