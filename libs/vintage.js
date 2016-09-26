/* global fx, ImageFilters, canvas_active */

var VINTAGE = new VINTAGE_CLASS();

/**
 * adds vintage effect
 * 
 * @author ViliusL
 * 
 * Functions:
 * - adjust_color
 * - lower_contrast
 * - blur
 * - light_leak
 * - chemicals
 * - exposure
 * - grains
 * - grains_big
 * - optics
 * - dusts
 *
 * Usage:	VINTAGE.___function___(canvas_ctx, width, height, param1, param2, ...);
 * 
 * libs:		
 * - imagefilters.js, url: https://github.com/arahaya/ImageFilters.js
 * - glfx.js url: http://evanw.github.com/glfx.js/
 */
function VINTAGE_CLASS() {
	var fx_filter = false;

	//increasing red color
	this.adjust_color = function (context, W, H, level_red) {	//level = [0, 200], default 70
		var param_green = 0;
		var param_blue = 0;
		var imageData = context.getImageData(0, 0, W, H);
		var filtered = ImageFilters.ColorTransformFilter(imageData, 1, 1, 1, 1, level_red, param_green, param_blue, 1);
		context.putImageData(filtered, 0, 0);
	};
	
	//decreasing contrast
	this.lower_contrast = function (context, W, H, level) {	//level = [0, 50], default 15
		var imageData = context.getImageData(0, 0, W, H);
		var filtered = ImageFilters.BrightnessContrastPhotoshop(imageData, 0, -level);
		context.putImageData(filtered, 0, 0);
	};
	
	//adding blur
	this.blur = function (context, W, H, level) {	//level = [0, 2], default 0
		if (level < 1)
			return context;
		var imageData = context.getImageData(0, 0, W, H);
		var filtered = ImageFilters.GaussianBlur(imageData, level);
		context.putImageData(filtered, 0, 0);
	};
	
	//creating transparent #ffa500 radial gradients
	this.light_leak = function (context, W, H, level) {	//level = [0, 150], default 90
		var click_x = this.getRandomInt(0, W);
		var click_y = this.getRandomInt(0, H);
		var distance = Math.min(W, H) * 0.6;
		var radgrad = canvas_active().createRadialGradient(
			click_x, click_y, distance * level / 255,
			click_x, click_y, distance);
		radgrad.addColorStop(0, "rgba(255, 165, 0, " + level / 255 + ")");
		radgrad.addColorStop(1, "rgba(255, 255, 255, 0)");

		context.fillStyle = radgrad;
		context.fillRect(0, 0, W, H);
	};
	
	//de-saturate
	this.chemicals = function (context, W, H, level) {	//level = [0, 100], default 40
		var imageData = context.getImageData(0, 0, W, H);
		var filtered = ImageFilters.HSLAdjustment(imageData, 0, -level, 0);
		context.putImageData(filtered, 0, 0);
	};
	
	//creating transparent vertical black-to-white gradients
	this.exposure = function (context, W, H, level) {		//level = [0, 150], default 80
		context.rect(0, 0, W, H);
		var grd = canvas_active().createLinearGradient(0, 0, 0, H);
		if (this.getRandomInt(1, 10) < 5) {
			//dark at top
			grd.addColorStop(0, "rgba(0, 0, 0, " + level / 255 + ")");
			grd.addColorStop(1, "rgba(255, 255, 255, " + level / 255 + ")");
		}
		else {
			//bright at top
			grd.addColorStop(0, "rgba(255, 255, 255, " + level / 255 + ")");
			grd.addColorStop(1, "rgba(0, 0, 0, " + level / 255 + ")");
		}
		context.fillStyle = grd;
		context.fill();
	};
	
	//add grains, noise
	this.grains = function (context, W, H, level) {	//level = [0, 50], default 10
		if (level == 0)
			return context;
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		for (var j = 0; j < H; j++) {
			for (var i = 0; i < W; i++) {
				var x = (i + j * W) * 4;
				if (imgData[x + 3] == 0)
					continue;	//transparent
				//increase it's lightness
				var delta = this.getRandomInt(0, level);
				if (delta == 0)
					continue;

				if (imgData[x] - delta < 0)
					imgData[x] = -(imgData[x] - delta);
				else
					imgData[x] = imgData[x] - delta;
				if (imgData[x + 1] - delta < 0)
					imgData[x + 1] = -(imgData[x + 1] - delta);
				else
					imgData[x + 1] = imgData[x + 1] - delta;
				if (imgData[x + 2] - delta < 0)
					imgData[x + 2] = -(imgData[x + 2] - delta);
				else
					imgData[x + 2] = imgData[x + 2] - delta;
			}
		}
		context.putImageData(img, 0, 0);
	};
	
	//add big grains, noise
	this.grains_big = function (context, W, H, level) {	//level = [0, 50], default 20
		if (level == 0)
			return context;
		var n = W * H / 100 * level;	//density
		var color = 200;
		for (var i = 0; i < n; i++) {
			var power = this.getRandomInt(5, 10 + level);
			var size = 2;
			var x = this.getRandomInt(0, W);
			var y = this.getRandomInt(0, H);
			context.fillStyle = "rgba(" + color + ", " + color + ", " + color + ", " + power / 255 + ")";
			context.fillRect(x, y, size, size);
		}
	};
	
	//adding vignette effect - blured dark borders
	this.optics = function (context, W, H, param1, param2) {	//param1 [0, 0.5], param2 [0, 0.7], default 0.3, 0.5
		//make sure FX lib loaded
		if(fx_filter == false){
			fx_filter = fx.canvas();
		}
		
		var texture = fx_filter.texture(context.getImageData(0, 0, W, H));
		fx_filter.draw(texture).vignette(param1, param2).update();
		context.drawImage(fx_filter, 0, 0);
	};
	
	//add dust and hairs
	this.dusts = function (context, W, H, level) {	//level = [0, 100], default 70
		var n = level / 100 * (W * H) / 1000;
		//add dust
		context.fillStyle = "rgba(200, 200, 200, 0.3)";
		for (var i = 0; i < n; i++) {
			var x = this.getRandomInt(0, W);
			var y = this.getRandomInt(0, H);
			var mode = this.getRandomInt(1, 2);
			if (mode == 1) {
				var w = 1;
				var h = this.getRandomInt(1, 3);
			}
			else if (mode == 2) {
				var w = this.getRandomInt(1, 3);
				var h = 1;
			}
			context.beginPath();
			context.rect(x, y, w, h);
			context.fill();
		}

		//add hairs
		context.strokeStyle = "rgba(200, 200, 200, 0.2)";
		for (var i = 0; i < n / 3; i++) {
			var x = this.getRandomInt(0, W);
			var y = this.getRandomInt(0, H);
			var radius = this.getRandomInt(5, 15);
			var start_nr = this.getRandomInt(0, 20) / 10;
			var start_angle = Math.PI * start_nr;
			var end_angle = Math.PI * (start_nr + this.getRandomInt(7, 15) / 10);
			context.beginPath();
			context.arc(x, y, radius, start_angle, end_angle);
			context.stroke();
		}

		return context;
	};
	
	//random number generator
	this.getRandomInt = function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};
}
