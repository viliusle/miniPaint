import app from './../../app.js';
import config from './../../config.js';
import Base_tools_class from './../../core/base-tools.js';
import Base_layers_class from './../../core/base-layers.js';

class Hexagon_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'hexagon';
		this.layer = {};
		this.best_ratio = 1.1547005;
		this.snap_line_info = {x: null, y: null};
		this.coords = [
			[75, 6.698729810778069],
			[100, 50],
			[75, 93.30127018922192],
			[24.99999999999999, 93.30127018922192],
			[0, 50.00000000000001],
			[24.99999999999998, 6.698729810778076],
			[75, 6.698729810778069],
			[75, 6.698729810778069],
		];
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

		this.draw_shape(ctx, x, y - 5, width, height, this.coords);

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
		this.draw_shape(ctx, -layer.width / 2, -layer.height / 2, layer.width, layer.height, this.coords);

		ctx.restore();
	}

	draw_shape(ctx, x, y, width, height, coords) {
		ctx.lineJoin = "round";

		ctx.beginPath();

		ctx.scale(1, this.best_ratio);

		for(var i in coords){
			if(coords[i] === null){
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
				ctx.beginPath();
				continue;
			}

			//coords in 100x100 box
			var pos_x = x + coords[i][0] * width / 100;
			var pos_y = y + coords[i][1] * height / 100;

			if(i == '0')
				ctx.moveTo(pos_x, pos_y);
			else
				ctx.lineTo(pos_x, pos_y);
		}
		ctx.closePath();

		ctx.fill();
		ctx.stroke();
	}

}

export default Hexagon_class;
