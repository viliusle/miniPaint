import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';

class Pencil_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.name = 'pencil';
		this.layer = {};
		this.params_hash = false;
	}

	dragStart(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousedown(event);
	}

	dragMove(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousemove(event);

		//mouse cursor
		var mouse = _this.get_mouse_info(event);
		var params = _this.getParams();
		if (params.antialiasing == true)
			_this.show_mouse_cursor(mouse.x, mouse.y, params.size || 1, 'circle');
	}

	dragEnd(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mouseup(event);
	}

	load() {
		var _this = this;

		//mouse events
		document.addEventListener('mousedown', function (event) {
			_this.dragStart(event);
		});
		document.addEventListener('mousemove', function (event) {
			_this.dragMove(event);
		});
		document.addEventListener('mouseup', function (event) {
			_this.dragEnd(event);
		});

		// collect touch events
		document.addEventListener('touchstart', function (event) {
			_this.dragStart(event);
		});
		document.addEventListener('touchmove', function (event) {
			_this.dragMove(event);
		});
		document.addEventListener('touchend', function (event) {
			_this.dragEnd(event);
		});
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false)
			return;

		window.State.save();

		var params_hash = this.get_params_hash();
		var params = this.getParams();
		var opacity = 100;
		if (params.antialiasing == false)
			opacity = Math.round(config.ALPHA / 255 * 100);
		
		if (config.layer.type != this.name || params_hash != this.params_hash) {
			//register new object - current layer is not ours or params changed
			this.layer = {
				type: this.name,
				data: [],
				opacity: opacity,
				params: this.clone(this.getParams()),
				status: 'draft',
				render_function: [this.name, 'render'],
				width: null,
				height: null,
				rotate: null,
				is_vector: true,
			};
			this.Base_layers.insert(this.layer);
			this.params_hash = params_hash;
		}
		else {
			//continue adding layer data, just register break
			config.layer.data.push(null);
		}
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();
		if (mouse.is_drag == false)
			return;
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}

		//more data
		if (params.antialiasing == false)
			config.layer.data.push([Math.ceil(mouse.x), Math.ceil(mouse.y)]);
		else
			config.layer.data.push([mouse.x - config.layer.x, mouse.y - config.layer.y]);
		this.Base_layers.render();
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);
		var params = this.getParams();
		if (mouse.valid == false || mouse.click_valid == false) {
			config.layer.status = null;
			return;
		}

		//more data
		if (params.antialiasing == false)
			config.layer.data.push([Math.ceil(mouse.x), Math.ceil(mouse.y)]);
		else
			config.layer.data.push([mouse.x - config.layer.x, mouse.y - config.layer.y]);
		config.layer.status = null;
		this.Base_layers.render();
	}

	on_params_update() {
		var params = this.getParams();
		var strict_element = document.querySelector('.block .item.size');

		if (params.antialiasing == false) {
			//hide strict controls
			strict_element.style.display = 'none';
		}
		else {
			//show strict controls
			strict_element.style.display = 'inline_block';
		}
	}

	render(ctx, layer) {
		var params = layer.params;

		if (params.antialiasing == true)
			this.render_antialiased(ctx, layer);
		else
			this.render_aliased(ctx, layer);
	}
	
	/**
	 * draw with antialiasing, nice mode
	 *
	 * @param {ctx} ctx
	 * @param {object} layer
	 */
	render_antialiased(ctx, layer) {
		if (layer.data.length == 0)
			return;

		var params = layer.params;
		var data = layer.data;
		var n = data.length;
		var size = params.size || 1;

		//set styles
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;
		ctx.lineWidth = size;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		ctx.translate(layer.x, layer.y);

		//draw
		ctx.beginPath();
		ctx.moveTo(data[0][0], data[0][1]);
		for (var i = 1; i < n; i++) {
			if (data[i] === null) {
				//break
				ctx.beginPath();
			}
			else {
				//line
				if (data[i - 1] == null) {
					//exception - point
					ctx.arc(data[i][0], data[i][1], size / 2, 0, 2 * Math.PI, false);
					ctx.fill();
				}
				else {
					//lines
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

	/**
	 * draw without antialiasing, sharp, ugly mode.
	 *
	 * @param {ctx} ctx
	 * @param {object} layer
	 */
	render_aliased(ctx, layer) {
		if (layer.data.length == 0)
			return;

		var params = layer.params;
		var data = layer.data;
		var n = data.length;

		//set styles
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;

		ctx.translate(layer.x, layer.y);

		//draw
		ctx.beginPath();
		ctx.moveTo(data[0][0], data[0][1]);
		for (var i = 1; i < n; i++) {
			if (data[i] === null) {
				//break
				ctx.beginPath();
			}
			else {
				//line
				if (data[i - 1] == null) {
					//exception - point
					ctx.fillRect(data[i][0] - 1, data[i][1] - 1, 1, 1);
				}
				else {
					//lines
					ctx.beginPath();
					this.draw_simple_line(ctx, data[i - 1][0], data[i - 1][1], data[i][0], data[i][1]);
				}
			}
		}
		if (n == 1 || data[1] == null) {
			//point
			ctx.beginPath();
			ctx.fillRect(data[0][0] - 1, data[0][1] - 1, 1, 1);
		}

		ctx.translate(-layer.x, -layer.y);
	}

	/**
	 * draws line without aliasing
	 *
	 * @param {ctx} ctx
	 * @param {int} from_x
	 * @param {int} from_y
	 * @param {int} to_x
	 * @param {int} to_y
	 */
	draw_simple_line(ctx, from_x, from_y, to_x, to_y) {
		var dist_x = from_x - to_x;
		var dist_y = from_y - to_y;
		var distance = Math.sqrt((dist_x * dist_x) + (dist_y * dist_y));
		var radiance = Math.atan2(dist_y, dist_x);
		for (var j = 0; j < distance; j++) {
			var x_tmp = Math.round(to_x - 1 + Math.cos(radiance) * j);
			var y_tmp = Math.round(to_y - 1 + Math.sin(radiance) * j);

			ctx.fillRect(x_tmp, y_tmp, 1, 1);
		}
	}

};

export default Pencil_class;
