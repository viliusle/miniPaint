/*
author:		ViliusL
about:		adds vintage effect, functions:
			adjust_color
			lower_contrast
			blur
			light_leak
			chemicals
			exposure
			grains
			optics
			dusts
			lines
theory:		Ken, http://stackoverflow.com/questions/13355119/vintage-ing-image-with-javascript/18862003#18862003
libs:		imagefilters.js, url: https://github.com/arahaya/ImageFilters.js
		glfx.js url: http://evanw.github.com/glfx.js/
*/

var VINTAGE = new VINTAGE_CLASS();

function VINTAGE_CLASS(){
	var fx_filter = fx.canvas();
	
	//increasing red color
	this.adjust_color = function(context, W, H, level){	//level = [0, 200], default 70
		var imageData = context.getImageData(0, 0, W, H);
		var filtered = ImageFilters.ColorTransformFilter(imageData, 1, 1, 1, 1, level, 0, 0, 1);
		context.putImageData(filtered, 0, 0);
		};
	//decreasing contrast
	this.lower_contrast = function(context, W, H, level){	//level = [0, 50], default 15
		var imageData = context.getImageData(0, 0, W, H);
		var filtered = ImageFilters.BrightnessContrastPhotoshop(imageData, 0, -level);
		context.putImageData(filtered, 0, 0);
		};
	//adding blur
	this.blur = function(context, W, H, level){	//level = [0, 2], default 0
		if(level < 1) return context;
		var imageData = context.getImageData(0, 0, W, H);
		var filtered = ImageFilters.GaussianBlur(imageData, level);
		context.putImageData(filtered, 0, 0);
		};
	//creating transparent #ffa500 radial gradients
	this.light_leak = function(context, W, H, level){	//level = [0, 150], default 90
		var click_x = this.getRandomInt(0, W);
		var click_y = this.getRandomInt(0, H);
		var distance = Math.min(W, H) * 0.6;
		var radgrad = canvas_active().createRadialGradient(
			click_x, click_y, distance*level/255,
			click_x, click_y, distance);
		radgrad.addColorStop(0, "rgba(255, 165, 0, "+level/255+")");
		radgrad.addColorStop(1, "rgba(255, 255, 255, 0)");
		
		context.fillStyle = radgrad;
		context.fillRect(0, 0, W, H);
		};
	//de-saturate
	this.chemicals = function(context, W, H, level){	//level = [0, 100], default 40
		var imageData = context.getImageData(0, 0, W, H);
		var filtered = ImageFilters.HSLAdjustment(imageData, 0, -level, 0);
		context.putImageData(filtered, 0, 0);
		};
	//creating transparent vertical black-to-white gradients
	this.exposure = function(context, W, H, level){		//level = [0, 150], default 80
		context.rect(0, 0, W, H);
		var grd = canvas_active().createLinearGradient(0, 0, 0, H);
		if(this.getRandomInt(1, 10) < 5){
			//dark at top
			grd.addColorStop(0, "rgba(0, 0, 0, "+level/255+")");
			grd.addColorStop(1, "rgba(255, 255, 255, "+level/255+")");
			}
		else{
			//bright at top
			grd.addColorStop(0, "rgba(255, 255, 255, "+level/255+")");
			grd.addColorStop(1, "rgba(0, 0, 0, "+level/255+")");
			}
		context.fillStyle = grd;
		context.fill();
		};
	//add grains, noise
	this.grains = function(context, W, H, level){	//level = [0, 50], default 10
		if(level == 0) return context;
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;	
		for(var j = 0; j < H; j++){
			for(var i = 0; i < W; i++){		
				var x = (i + j*W) * 4;
				if(imgData[x+3] == 0) continue;	//transparent
				//increase it's lightness
				var delta = this.getRandomInt(0, level);
				if(delta == 0) continue;
				
				imgData[x] = imgData[x] + delta;
				imgData[x+1] = imgData[x+1] + delta;
				imgData[x+2] = imgData[x+2] + delta;
				
				if(imgData[x] > 255) imgData[x] = 255;
				if(imgData[x+1] > 255) imgData[x+1] = 255;
				if(imgData[x+2] > 255) imgData[x+2] = 255;
				}
			}	
		context.putImageData(img, 0, 0);
		};	
	//adding vignette effect - blured dark borders
	this.optics = function(context, W, H, param1, param2){	//param1, param2 = [0, 1], default 0.3, 0.5
		var texture = fx_filter.texture(context.getImageData(0, 0, W, H));
		fx_filter.draw(texture).vignette(param1, param2).update();
		context.drawImage(fx_filter, 0, 0);
		};
	//add dust and hairs
	this.dusts = function(context, W, H, level){	//level = [0, 100], default 70
		var n = level / 100 * (W * H) / 1000;
		//add dust
		context.fillStyle = "rgba(255, 255, 255, 0.3)";
		for(var i=0; i<n; i++){
			var x = this.getRandomInt(0, W);
			var y = this.getRandomInt(0, H);
			var mode = this.getRandomInt(1, 2);
			if(mode == 1){
				var w = 1;
				var h = this.getRandomInt(1, 3);
				}
			else if(mode == 2){
				var w = this.getRandomInt(1, 3);
				var h = 1;
				}
			context.beginPath();
			context.rect(x, y, w, h);
			context.fill();
			}
		
		//add hairs
		context.strokeStyle = "rgba(255, 255, 255, 0.2)";
		for(var i=0; i<n/5; i++){
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
	//add lines
	this.lines = function(context, W, H, level){	//level = [0, 100], default 50
		var n = level / 100 * W / 10;
		context.lineWidth = 1;
		for(var a=0; a<1; a++){ //angle
			var angle = 0;
			if(a > 0)
				angle = this.getRandomInt(-90, 90);
			for(var j=0; j<n; j++){ //lines
				var x = this.getRandomInt(0, W) + 0.5;
				var y = 0;
				var x2 = x;
				var y2 = H;
				var power = this.getRandomInt(0, 15) / 100;
				
				//sides
				context.strokeStyle = "rgba(255, 255, 255, "+(power/2)+")";
				context.beginPath();
				context.lineWidth = 3;
				context.moveTo(x, y);
				context.lineTo(x2, y2);
				context.stroke();
				
				//center
				context.strokeStyle = "rgba(255, 255, 255, "+power+")";
				context.beginPath();
				context.lineWidth = 1;
				context.moveTo(x, y);
				context.lineTo(x2, y2);
				context.stroke();
				}
			}
		return context;
		};
	//random number generator
	this.getRandomInt = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
		};
	}
