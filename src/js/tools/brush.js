import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';

class Brush_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.name = 'brush';
		this.layer = {};
		this.params_hash = false;
		this.pressure_supported = false;
		this.pointer_pressure = 0; // has range [0 - 1]
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
		_this.show_mouse_cursor(mouse.x, mouse.y, params.size, 'circle');
	}

	dragEnd(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mouseup(event);
	}

	load() {
		var _this = this;

		//pointer events
		document.addEventListener('pointerdown', function (event) {
			_this.pointerdown(event);
		});
		document.addEventListener('pointermove', function (event) {
			_this.pointermove(event);
		});

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

	pointerdown(e) {
		// Devices that don't actually support pen pressure can give 0.5 as a false reading.
		// It is highly unlikely a real pen will read exactly 0.5 at the start of a stroke.
		if (e.pressure && e.pressure !== 0 && e.pressure !== 0.5 && e.pressure <= 1) {
			this.pressure_supported = true;
			this.pointer_pressure = e.pressure;
		} else {
			this.pressure_supported = false;
		}
	}

	pointermove(e) {
		// Pressure of exactly 1 seems to be an input error, sometimes I see it when lifting the pen
		// off the screen when pressure reading should be near 0.
		if (this.pressure_supported && e.pressure < 1) { 
			this.pointer_pressure = e.pressure;
		}
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false)
			return;

		window.State.save();

		var params_hash = this.get_params_hash();

		if (config.layer.type != this.name || params_hash != this.params_hash) {
			//register new object - current layer is not ours or params changed
			this.layer = {
				type: this.name,
				data: [],
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
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.is_drag == false)
			return;
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}

		var max_speed = 20;
		var power = 2; //how speed affects size
		var params = this.getParams();

		//detect line size
		var size = params.size;
		var new_size = size;

		if (this.pressure_supported) {
			new_size = size * this.pointer_pressure * 2;
		}
		else if (params.smart_brush == true) {
			new_size = size + size / max_speed * mouse.speed_average * power;
			new_size = Math.max(new_size, size / 4);
			new_size = Math.round(new_size);
		}

		//more data
		config.layer.data.push([mouse.x - config.layer.x, mouse.y - config.layer.y, new_size]);
		this.Base_layers.render();
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false) {
			config.layer.status = null;
			return;
		}

		//more data
		var params = this.getParams();
		var size = params.size;
		var new_size = size;
		if (this.pressure_supported) {
			new_size = size * this.pointer_pressure * 2;
		}
		config.layer.data.push([mouse.x - config.layer.x, mouse.y - config.layer.y, new_size]);
		config.layer.data.push(null);
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

				if (data[i - 1] == null && data[i + 1] == null) {
					//exception - point
					ctx.arc(data[i][0], data[i][1], size / 2, 0, 2 * Math.PI, false);
					ctx.fill();
				}
				else if (data[i - 1] != null) {
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

};

export default Brush_class;
