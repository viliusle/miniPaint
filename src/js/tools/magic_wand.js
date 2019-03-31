import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';

class Magic_wand_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.ctx = ctx;
		this.name = 'magic_wand';
	}

	dragStart(event) {
		var _this = this;
		if (config.TOOL.name != _this.name)
			return;
		_this.mousedown(event);
	}

	load() {
		var _this = this;

		//mouse events
		document.addEventListener('mousedown', function (event) {
			_this.dragStart(event);
		});

		// collect touch events
		document.addEventListener('touchstart', function (event) {
			_this.dragStart(event);
		});
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}
		if (config.layer.rotate || 0 > 0) {
			alertify.error('Erase on rotate object is disabled. Sorry.');
			return;
		}

		window.State.save();

		this.magic_wand(mouse);
	}

	magic_wand(mouse) {
		var params = this.getParams();

		if (config.layer.type != 'image') {
			alertify.error('Layer must be image, convert it to raster to apply this tool.');
			return;
		}
		if (config.layer.is_vector == true) {
			alertify.error('Layer is vector, convert it to raster to apply this tool.');
			return;
		}

		//get canvas from layer
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext("2d");
		canvas.width = config.layer.width_original;
		canvas.height = config.layer.height_original;
		ctx.drawImage(config.layer.link, 0, 0);

		var mouse_x = Math.round(mouse.x) - config.layer.x;
		var mouse_y = Math.round(mouse.y) - config.layer.y;

		//adapt to origin size
		mouse_x = this.adaptSize(mouse_x, 'width');
		mouse_y = this.adaptSize(mouse_y, 'height');

		//convert float coords to integers
		mouse_x = Math.round(mouse_x);
		mouse_y = Math.round(mouse_y);

		//change
		this.magic_wand_general(ctx, config.WIDTH, config.HEIGHT,
			mouse_x, mouse_y, params.power, params.anti_aliasing, params.contiguous);

		this.Base_layers.update_layer_image(canvas);
	}

	/**
	 * apply magic wand
	 *
	 * @param {ctx} context
	 * @param {int} W
	 * @param {int} H
	 * @param {int} x
	 * @param {int} y
	 * @param {int} sensitivity max 100
	 * @param {Boolean} anti_aliasing
	 */
	magic_wand_general(context, W, H, x, y, sensitivity, anti_aliasing, contiguous = false) {
		sensitivity = sensitivity * 255 / 100; //convert to 0-255 interval
		x = parseInt(x);
		y = parseInt(y);
		var canvasTemp = document.createElement('canvas');
		canvasTemp.width = W;
		canvasTemp.height = H;
		var ctxTemp = canvasTemp.getContext("2d");

		ctxTemp.rect(0, 0, W, H);
		ctxTemp.fillStyle = "rgba(255, 255, 255, 0)";
		ctxTemp.fill();

		var img_tmp = ctxTemp.getImageData(0, 0, W, H);
		var imgData_tmp = img_tmp.data;

		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		var k = ((y * (img.width * 4)) + (x * 4));
		var dx = [0, -1, +1, 0];
		var dy = [-1, 0, 0, +1];
		var color_to = {
			r: 255,
			g: 255,
			b: 255,
			a: 255
		};
		var color_from = {
			r: imgData[k + 0],
			g: imgData[k + 1],
			b: imgData[k + 2],
			a: imgData[k + 3]
		};
		if (color_from.r == color_to.r &&
			color_from.g == color_to.g &&
			color_from.b == color_to.b &&
			color_from.a == 0) {
			return false;
		}
		if (contiguous == false) {
			//check only nearest pixels
			var stack = [];
			stack.push([x, y]);
			while (stack.length > 0) {
				var curPoint = stack.pop();
				for (var i = 0; i < 4; i++) {
					var nextPointX = curPoint[0] + dx[i];
					var nextPointY = curPoint[1] + dy[i];
					if (nextPointX < 0 || nextPointY < 0 || nextPointX >= W || nextPointY >= H)
						continue;
					var k = (nextPointY * W + nextPointX) * 4;
					if (imgData_tmp[k + 3] != 0)
						continue; //already parsed

					if (Math.abs(imgData[k] - color_from.r) <= sensitivity
						&& Math.abs(imgData[k + 1] - color_from.g) <= sensitivity
						&& Math.abs(imgData[k + 2] - color_from.b) <= sensitivity
						&& Math.abs(imgData[k + 3] - color_from.a) <= sensitivity) {
						imgData_tmp[k] = color_to.r; //r
						imgData_tmp[k + 1] = color_to.g; //g
						imgData_tmp[k + 2] = color_to.b; //b
						imgData_tmp[k + 3] = color_to.a; //a

						stack.push([nextPointX, nextPointY]);
					}
				}
			}
		}
		else {
			//global mode - contiguous
			for (var i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent

				//imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);

				for (var j = 0; j < 4; j++) {
					var k = i + j;

					if (Math.abs(imgData[k] - color_from.r) <= sensitivity
						&& Math.abs(imgData[k + 1] - color_from.g) <= sensitivity
						&& Math.abs(imgData[k + 2] - color_from.b) <= sensitivity
						&& Math.abs(imgData[k + 3] - color_from.a) <= sensitivity) {
						imgData_tmp[k] = color_to.r; //r
						imgData_tmp[k + 1] = color_to.g; //g
						imgData_tmp[k + 2] = color_to.b; //b
						imgData_tmp[k + 3] = color_to.a; //a
					}
				}
			}
		}

		//destination-out + blur = anti-aliasing
		ctxTemp.putImageData(img_tmp, 0, 0);
		context.globalCompositeOperation = "destination-out";
		if (anti_aliasing == true) {
			context.filter = 'blur(1px)';
		}
		context.drawImage(canvasTemp, 0, 0);
	}

}
export default Magic_wand_class;
