import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';

class Line_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'line';
		this.layer = {};
	}

	load() {
		var _this = this;

		//events
		document.addEventListener('mousedown', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mousedown(e);
		});
		document.addEventListener('mousemove', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mousemove(e);
		});
		document.addEventListener('mouseup', function (e) {
			if (config.TOOL.name != _this.name)
				return;
			_this.mouseup(e);
		});
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false)
			return;

		window.State.save();

		//register new object - current layer is not ours or params changed
		this.layer = {
			type: this.name,
			params: this.clone(this.getParams()),
			status: 'draft',
			render_function: [this.name, 'render'],
			x: mouse.x,
			y: mouse.y,
			rotate: null,
		};
		this.Base_layers.insert(this.layer);
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.is_drag == false)
			return;
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}

		var width = mouse.x - this.layer.x;
		var height = mouse.y - this.layer.y;
		if (e.ctrlKey == true || e.metaKey) {
			//one direction only
			if (Math.abs(width) < Math.abs(height))
				width = 1;
			else
				height = 1;
		}

		//more data
		config.layer.width = width;
		config.layer.height = height;
		this.Base_layers.render();
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false) {
			config.layer.status = null;
			return;
		}

		var width = mouse.x - this.layer.x;
		var height = mouse.y - this.layer.y;

		if (width == 0 && height == 0) {
			//same coordinates - cancel
			this.Base_layers.delete(config.layer.id);
			return;
		}

		if (e.ctrlKey == true || e.metaKey) {
			//one direction only
			if (Math.abs(width) < Math.abs(height))
				width = 1;
			else
				height = 1;
		}

		//more data
		config.layer.width = width;
		config.layer.height = height;
		config.layer.status = null;
		this.Base_layers.render();
	}

	render(ctx, layer) {
		if (layer.width == 0 && layer.height == 0)
			return;

		var params = layer.params;
		var type = params.type.value;

		//set styles
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;
		ctx.lineWidth = params.size;
		ctx.lineCap = 'round';

		var width = layer.x + layer.width - 1;
		var height = layer.y + layer.height - 1;

		if (type == 'Simple') {
			//draw line
			ctx.beginPath();
			ctx.moveTo(layer.x + 0.5, layer.y + 0.5);
			ctx.lineTo(width + 0.5, height + 0.5);
			ctx.stroke();
		}
		else if (type == 'Arrow') {
			var headlen = params.size * 5;
			if (headlen < 15)
				headlen = 15;
			this.arrow(ctx,
				layer.x + 0.5, layer.y + 0.5,
				width + 0.5, height + 0.5,
				headlen);
		}
		else if (type == 'Curve') {
			//not supported
		}
	}

	arrow(ctx, fromx, fromy, tox, toy, headlen) {
		if (headlen == undefined)
			headlen = 10;	// length of head in pixels
		var dx = tox - fromx;
		var dy = toy - fromy;
		var angle = Math.atan2(dy, dx);
		ctx.beginPath();
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
		ctx.lineTo(tox, toy);
		ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
		ctx.stroke();
	}

}

export default Line_class;
