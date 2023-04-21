import app from './../app.js';
import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import Base_layers_class from './../core/base-layers.js';
import Helper_class from './../libs/helpers.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';

class Fill_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.ctx = ctx;
		this.name = 'fill';
		this.working = false;
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
		if (mouse.click_valid == false) {
			return;
		}
		if (config.layer.rotate || 0 > 0) {
			alertify.error('Erase on rotate object is disabled. Please rasterize first.');
			return;
		}

		this.fill(mouse);
	}

	async fill(mouse) {
		var params = this.getParams();

		if(this.working == true){
			return;
		}

		if (config.layer.type != 'image' && config.layer.type !== null) {
			alertify.error('This layer must contain an image. Please convert it to raster to apply this tool.');
			return;
		}
		if (config.layer.is_vector == true) {
			alertify.error('Layer is vector, convert it to raster to apply this tool.');
			return;
		}
		if (config.ALPHA == 0) {
			alertify.error('Color alpha value can not be zero.');
			return;
		}

		//get canvas from layer
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext("2d");
		if (config.layer.type !== null) {
			canvas.width = config.layer.width_original;
			canvas.height = config.layer.height_original;
			ctx.drawImage(config.layer.link, 0, 0);
		}
		else {
			canvas.width = config.WIDTH;
			canvas.height = config.HEIGHT;
		}

		var mouse_x = Math.round(mouse.x) - config.layer.x;
		var mouse_y = Math.round(mouse.y) - config.layer.y;

		//adapt to origin size
		mouse_x = this.adaptSize(mouse_x, 'width');
		mouse_y = this.adaptSize(mouse_y, 'height');

		//convert float coords to integers
		mouse_x = Math.round(mouse_x);
		mouse_y = Math.round(mouse_y);

		var color_to = this.Helper.hexToRgb(config.COLOR);
		color_to.a = config.ALPHA;

		//change
		this.working = true;
		this.fill_general(ctx, config.WIDTH, config.HEIGHT,
			mouse_x, mouse_y, color_to, params.power, params.anti_aliasing, params.contiguous);

		if (config.layer.type != null) {
			//update
			app.State.do_action(
				new app.Actions.Bundle_action('fill_tool', 'Fill Tool', [
					new app.Actions.Update_layer_image_action(canvas)
				])
			);
		}
		else {
			//create new
			var params = [];
			params.type = 'image';
			params.name = 'Fill';
			params.data = canvas.toDataURL("image/png");
			params.x = parseInt(canvas.dataset.x) || 0;
			params.y = parseInt(canvas.dataset.y) || 0;
			params.width = canvas.width;
			params.height = canvas.height;
			app.State.do_action(
				new app.Actions.Bundle_action('fill_tool', 'Fill Tool', [
					new app.Actions.Insert_layer_action(params)
				])
			);
		}

		//prevent crash bug on touch screen - hard to explain and debug
		await new Promise(r => setTimeout(r, 10));
		this.working = false;
	}

	fill_general(context, W, H, x, y, color_to, sensitivity, anti_aliasing, contiguous = false) {
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
		var color_from = {
			r: imgData[k + 0],
			g: imgData[k + 1],
			b: imgData[k + 2],
			a: imgData[k + 3]
		};
		if (color_from.r == color_to.r && color_from.g == color_to.g
			&& color_from.b == color_to.b && color_from.a == color_to.a) {
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

					//check
					if (Math.abs(imgData[k + 0] - color_from.r) <= sensitivity &&
						Math.abs(imgData[k + 1] - color_from.g) <= sensitivity &&
						Math.abs(imgData[k + 2] - color_from.b) <= sensitivity &&
						Math.abs(imgData[k + 3] - color_from.a) <= sensitivity) {

						//fill pixel
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

		ctxTemp.putImageData(img_tmp, 0, 0);
		if (anti_aliasing == true) {
			context.filter = 'blur(1px)';
		}
		context.drawImage(canvasTemp, 0, 0);
	}

}
export default Fill_class;
