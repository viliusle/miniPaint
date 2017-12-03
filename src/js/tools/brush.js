import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';

class Brush_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'brush';
		this.data = [];
		this.layer = {};
		this.params_hash = false;
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

			//mouse cursor
			var mouse = _this.get_mouse_info(e);
			var params = _this.getParams();
			_this.show_mouse_cursor(mouse.x, mouse.y, params.size, 'circle');
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

		var params_hash = this.get_params_hash();

		if (config.layer.type != this.name || params_hash != this.params_hash) {
			//register new object - current layer is not ours or params changed
			this.data = [];
			this.layer = {
				type: this.name,
				data: this.data,
				params: this.clone(this.getParams()),
				status: 'draft',
				render_function: [this.name, 'render'],
				width: null,
				height: null,
				rotate: null,
			};
			this.Base_layers.insert(this.layer);
			this.params_hash = params_hash;
		}
		else {
			//continue adding layer data, just register break
			this.data.push(null);
		}
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.is_drag == false)
			return;
		if (mouse.valid == false || mouse.click_valid == false) {
			this.data.push(null);
			return;
		}

		var max_speed = 20;
		var power = 2; //how speed affects size
		var params = this.getParams();

		//detect line size
		var size = params.size;
		var new_size = size;
		if (params.smart_brush == true) {
			new_size = size + size / max_speed * mouse.speed_average * power;
			new_size = Math.max(new_size, size / 4);
			new_size = Math.round(new_size);
		}

		//more data
		this.data.push([mouse.x - config.layer.x, mouse.y - config.layer.y, new_size]);
		this.Base_layers.render();
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false) {
			config.layer.status = null;
			return;
		}

		//more data
		this.data.push([mouse.x - config.layer.x, mouse.y - config.layer.y]);
		config.layer.status = null;
		this.Base_layers.render();
	}

	render(ctx, layer) {
		if (layer.data.length == 0)
			return;

		var params = layer.params;
		var size = params.size;

		//set styles
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;
		ctx.lineWidth = params.size;
		ctx.lineCap = 'round';

		ctx.translate(layer.x, layer.y);

		//draw
		var data = layer.data;
		var n = data.length;
		var size = params.size;
		ctx.beginPath();
		ctx.moveTo(data[0][0], data[0][1]);
		for (var i = 1; i < n; i++) {
			if (data[i] === null) {
				//break
				ctx.beginPath();
			}
			else {
				//line
				ctx.lineWidth = data[i][2];

				if (data[i - 1] == null) {
					//exception - point
					ctx.arc(data[i][0], data[i][1], size / 2, 0, 2 * Math.PI, false);
					ctx.fill();
				}
				else {
					//lines
					ctx.lineWidth = data[i][2];
					ctx.beginPath();
					ctx.moveTo(data[i - 1][0], data[i - 1][1]);
					ctx.lineTo(data[i][0], data[i][1]);
					ctx.stroke();
				}
			}
		}
		if (n == 1 || data[1] == null) {
			//point
			ctx.beginPath();
			ctx.arc(data[0][0], data[0][1], size / 2, 0, 2 * Math.PI, false);
			ctx.fill();
		}

		ctx.translate(-layer.x, -layer.y);
	}

}
;
export default Brush_class;
