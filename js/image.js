/* global MAIN, EVENTS, LAYER, POP, HELPER, TOOLS, DRAW, GUI, EDIT, FILE */
/* global canvas_active, ImageFilters, WIDTH, HEIGHT, canvas_active, canvas_front */

var IMAGE = new IMAGE_CLASS();

/** 
 * manages image actions
 * 
 * @author ViliusL
 */
function IMAGE_CLASS() {

	//information
	this.image_information = function () {
		var _this = this;
		var pixels = WIDTH*HEIGHT;
		pixels = HELPER.number_format(pixels, 0);
		
		POP.add({title: "Width:", value: WIDTH});
		POP.add({title: "Height:", value: HEIGHT});
		POP.add({title: "Pixels:", value: pixels});
		POP.add({title: "Unique colors:", value: '...'});
		
		//show general data
		for (var i in FILE.file_info.general){
			POP.add({title: i + ":", value: FILE.file_info.general[i]});
		}
		
		//show exif data
		var n = 0;
		for (var i in FILE.file_info.exif){
			if(i == 'undefined')
				continue;
			if(n == 0)
				POP.add({title: "==== EXIF ====", value: ''});
			POP.add({title: i + ":", value: FILE.file_info.exif[i]});
			n++;
		}
		
		POP.show('Information', null, null, function(){
			//calc colors
			setTimeout(function(){
				var colors = _this.unique_colors_count(canvas_active(true));
				colors = HELPER.number_format(colors, 0);
				document.getElementById('pop_data_uniquecolo').innerHTML = colors;
			}, 10);
		});
	};

	//size
	this.image_size = function () {
		POP.add({name: "width", title: "Width:", value: WIDTH, placeholder: WIDTH});
		POP.add({name: "height", title: "Height:", value: HEIGHT, placeholder: HEIGHT});
		POP.show('Attributes', [IMAGE, 'resize_custom']);
	};

	//trim
	this.image_trim = function () {
		EDIT.save_state();
		this.trim();
	};

	//crop
	this.image_crop = function () {
		EDIT.save_state();
		if (DRAW.select_data == false) {
			POP.add({html: 'Select area first'});
			POP.show('Error', '');
		}
		else {
			for (var i in LAYER.layers) {
				var layer = document.getElementById(LAYER.layers[i].name).getContext("2d");

				var tmp = layer.getImageData(DRAW.select_data.x, DRAW.select_data.y, DRAW.select_data.w, DRAW.select_data.h);
				layer.clearRect(0, 0, WIDTH, HEIGHT);
				layer.putImageData(tmp, 0, 0);
			}

			//resize
			EDIT.save_state();
			WIDTH = DRAW.select_data.w;
			HEIGHT = DRAW.select_data.h;
			LAYER.set_canvas_size();

			DRAW.select_data = false;
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
		}
	};

	//resize
	this.image_resize = function () {
		this.resize_box();
	};

	//rotate left
	this.image_rotate_left = function () {
		EDIT.save_state();
		this.rotate_resize_doc(270, WIDTH, HEIGHT);
		this.rotate_layer({angle: 270}, canvas_active(), WIDTH, HEIGHT);
	};

	//rotate right
	this.image_rotate_right = function () {
		EDIT.save_state();
		this.rotate_resize_doc(90, WIDTH, HEIGHT);
		this.rotate_layer({angle: 90}, canvas_active(), WIDTH, HEIGHT);
	};

	//rotate
	this.image_rotate = function () {
		POP.add({name: "angle", title: "Enter angle (0-360):", value: 0, range: [0, 360]});
		POP.add({name: "mode", title: "Area:", values: ['All', 'Visible']});
		POP.show(
			'Rotate', 
			function (response) {
				EDIT.save_state();
				if(response.mode == 'All')
					IMAGE.rotate_resize_doc(response.angle, WIDTH, HEIGHT);
				IMAGE.rotate_layer(response, canvas_active(), WIDTH, HEIGHT);
			},
			function (response, canvas_preview, w, h) {
				IMAGE.rotate_layer(response, canvas_preview, w, h);
			}
		);
	};

	//vertical flip
	this.image_vflip = function () {
		EDIT.save_state();
		var tempCanvas = document.createElement("canvas");
		var tempCtx = tempCanvas.getContext("2d");
		tempCanvas.width = WIDTH;
		tempCanvas.height = HEIGHT;
		tempCtx.drawImage(canvas_active(true), 0, 0, WIDTH, HEIGHT);
		//flip
		canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
		canvas_active().save();
		canvas_active().scale(-1, 1);
		canvas_active().drawImage(tempCanvas, -WIDTH, 0);
		canvas_active().restore();
	};

	//horizontal flip
	this.image_hflip = function () {
		EDIT.save_state();
		var tempCanvas = document.createElement("canvas");
		var tempCtx = tempCanvas.getContext("2d");
		tempCanvas.width = WIDTH;
		tempCanvas.height = HEIGHT;
		tempCtx.drawImage(canvas_active(true), 0, 0, WIDTH, HEIGHT);
		//flip
		canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
		canvas_active().save();
		canvas_active().scale(1, -1);
		canvas_active().drawImage(tempCanvas, 0, -HEIGHT);
		canvas_active().restore();
	};

	//color corrections
	this.image_colors = function () {
		POP.add({name: "param1", title: "Brightness:", value: "0", range: [-100, 100]});
		POP.add({name: "param2", title: "Contrast:", value: "0", range: [-100, 100]});
		POP.add({});
		POP.add({name: "param_red", title: "Red channel:", value: "0", range: [-255, 255]});
		POP.add({name: "param_green", title: "Green channel:", value: "0", range: [-255, 255]});
		POP.add({name: "param_blue", title: "Blue channel:", value: "0", range: [-255, 255]});
		POP.add({});
		POP.add({name: "param_h", title: "Hue:", value: "0", range: [-180, 180]});
		POP.add({name: "param_s", title: "Saturation:", value: "0", range: [-100, 100]});
		POP.add({name: "param_l", title: "Luminance:", value: "0", range: [-100, 100]});

		POP.show(
			'Color corrections', 
			function (user_response) {
				EDIT.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param_red = parseInt(user_response.param_red);
				var param_green = parseInt(user_response.param_green);
				var param_blue = parseInt(user_response.param_blue);
				var param_h = parseInt(user_response.param_h);
				var param_s = parseInt(user_response.param_s);
				var param_l = parseInt(user_response.param_l);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				//Brightness/Contrast
				var filtered = ImageFilters.BrightnessContrastPhotoshop(imageData, param1, param2);
				//RGB corrections
				var filtered = ImageFilters.ColorTransformFilter(filtered, 1, 1, 1, 1, param_red, param_green, param_blue, 1);
				//hue/saturation/luminance
				var filtered = ImageFilters.HSLAdjustment(filtered, param_h, param_s, param_l);
				canvas_active().putImageData(filtered, 0, 0);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param_red = parseInt(user_response.param_red);
				var param_green = parseInt(user_response.param_green);
				var param_blue = parseInt(user_response.param_blue);
				var param_h = parseInt(user_response.param_h);
				var param_s = parseInt(user_response.param_s);
				var param_l = parseInt(user_response.param_l);

				var imageData = canvas_preview.getImageData(0, 0, w, h);
				//Brightness/Contrast
				var filtered = ImageFilters.BrightnessContrastPhotoshop(imageData, param1, param2);	//add effect
				//RGB corrections
				var filtered = ImageFilters.ColorTransformFilter(filtered, 1, 1, 1, 1, param_red, param_green, param_blue, 1);
				//hue/saturation/luminance
				var filtered = ImageFilters.HSLAdjustment(filtered, param_h, param_s, param_l);
				canvas_preview.putImageData(filtered, 0, 0);
			}
		);
	};

	//auto adjust colors
	this.image_auto_adjust = function () {
		EDIT.save_state();
		this.auto_adjust(canvas_active(), WIDTH, HEIGHT);
	};

	//convert to grayscale
	this.image_GrayScale = function () {
		EDIT.save_state();
		var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
		var filtered = ImageFilters.GrayScale(imageData);	//add effect
		canvas_active().putImageData(filtered, 0, 0);
	};

	//enchance colors
	this.image_decrease_colors = function () {
		POP.add({name: "param1", title: "Colors:", value: "10", range: [1, 256]});
		POP.add({name: "param3", title: "Greyscale:", values: ["No", "Yes"], });
		POP.show(
			'Decrease colors', 
			function (user_response) {
				EDIT.save_state();
				var param1 = parseInt(user_response.param1);
				if (user_response.param3 == 'Yes')
					param3 = true;
				else
					param3 = false;

				IMAGE.decrease_colors(canvas_active(true), canvas_active(true), WIDTH, HEIGHT, param1, param3);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseInt(user_response.param1);
				if (user_response.param3 == 'Yes')
					param3 = true;
				else
					param3 = false;

				IMAGE.decrease_colors(canvas_active(true), document.getElementById("pop_post"), w, h, param1, param3);
			}
		);
	};

	//negative
	this.image_negative = function () {
		EDIT.save_state();
		if (DRAW.select_data == false)
			var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
		else
			var imageData = canvas_active().getImageData(DRAW.select_data.x, DRAW.select_data.y, DRAW.select_data.w, DRAW.select_data.h);
		var pixels = imageData.data;
		for (var i = 0; i < pixels.length; i += 4) {
			pixels[i] = 255 - pixels[i]; // red
			pixels[i + 1] = 255 - pixels[i + 1]; // green
			pixels[i + 2] = 255 - pixels[i + 2]; // blue
		}
		//save
		if (DRAW.select_data == false)
			canvas_active().putImageData(imageData, 0, 0);
		else
			canvas_active().putImageData(imageData, DRAW.select_data.x, DRAW.select_data.y);
	};

	//grid
	this.image_grid = function () {
		POP.add({name: "visible", title: "Visible:", value: "Yes", values: ["Yes", "No"]});
		POP.add({name: "gap_x", title: "Horizontal gap:", value: GUI.grid_size[0]});
		POP.add({name: "gap_y", title: "Vertical gap:", value: GUI.grid_size[1]});
		POP.show(
			'Grid', 
			function (response) {
				if (response.visible == "Yes") {
					GUI.grid = true;
					gap_x = response.gap_x;
					gap_y = response.gap_y;
					GUI.draw_grid(gap_x, gap_y);
				}
				else {
					GUI.grid = false;
					GUI.draw_grid();
				}
			}
		);
	};

	//histogram
	this.image_histogram = function () {
		this.histogram();
	};

	this.resize_custom = function (user_response) {
		EDIT.save_state();
		EVENTS.autosize = false;
		if (user_response.width != WIDTH || user_response.height != HEIGHT) {
			WIDTH = user_response.width;
			HEIGHT = user_response.height;
			LAYER.set_canvas_size();
		}
	};

	//prepare rotation - increase doc dimensions if needed
	this.rotate_resize_doc = function (angle, w, h) {
		var o = angle * Math.PI / 180;
		var new_x = w * Math.abs(Math.cos(o)) + h * Math.abs(Math.sin(o));
		var new_y = w * Math.abs(Math.sin(o)) + h * Math.abs(Math.cos(o));
		new_x = Math.ceil(Math.round(new_x * 1000) / 1000);
		new_y = Math.ceil(Math.round(new_y * 1000) / 1000);

		if (WIDTH != new_x || HEIGHT != new_y) {
			EDIT.save_state();
			var dx = 0;
			var dy = 0;
			if (new_x > WIDTH) {
				dx = Math.ceil(new_x - WIDTH) / 2;
				WIDTH = new_x;
			}
			if (new_y > HEIGHT) {
				dy = Math.ceil(new_y - HEIGHT) / 2;
				HEIGHT = new_y;
			}
			LAYER.set_canvas_size();

			var tmp = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
			canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
			canvas_active().putImageData(tmp, dx, dy);
		}
	};

	//rotate layer
	this.rotate_layer = function (user_response, canvas, w, h) {
		var TO_RADIANS = Math.PI / 180;
		angle = user_response.angle;
		mode = user_response.mode;
		
		var area_x = 0;
		var area_y = 0;
		var area_w = w;
		var area_h = h;
		
		var dx = 0;
		var dy = 0;
		
		if(mode == 'Visible'){
			//rotate only visible part
			
			var trim_info = this.trim_info(canvas.canvas);
			area_x = trim_info.left;
			area_y = trim_info.top;
			area_w = w - trim_info.left - trim_info.right;
			area_h = h - trim_info.top - trim_info.bottom;
			
			//calc how much dimensions will increase
			var o = angle * Math.PI / 180;
			var new_x = area_w * Math.abs(Math.cos(o)) + area_h * Math.abs(Math.sin(o));
			var new_y = area_w * Math.abs(Math.sin(o)) + area_h * Math.abs(Math.cos(o));
			new_x = Math.ceil(Math.round(new_x * 1000) / 1000);
			new_y = Math.ceil(Math.round(new_y * 1000) / 1000);
			if(new_x > area_w || new_y > area_h){
				if (new_x > area_w) {
					dx = Math.ceil(new_x - area_w) / 2;
					if(area_x > dx)
						dx = 0;
				}
				if (new_y > area_h) {
					dy = Math.ceil(new_y - area_h) / 2;
					if(area_y > dy)
						dy = 0;
				}
				if (w == WIDTH && h == HEIGHT){
					var tmp = canvas.getImageData(0, 0, w, h);
					canvas.clearRect(0, 0, w, h);
					canvas.putImageData(tmp, dx, dy);
				}
			}
			
			//recalc
			var trim_info = this.trim_info(canvas.canvas);
			area_x = trim_info.left;
			area_y = trim_info.top;
			area_w = w - trim_info.left - trim_info.right;
			area_h = h - trim_info.top - trim_info.bottom;
		}
		
		var tempCanvas = document.createElement("canvas");
		var tempCtx = tempCanvas.getContext("2d");
		tempCanvas.width = area_w;
		tempCanvas.height = area_h;
		var imageData = canvas.getImageData(area_x, area_y, area_w, area_h);
		tempCtx.putImageData(imageData, 0, 0);

		//rotate
		canvas.clearRect(area_x, area_y, area_w, area_h);
		canvas.save();
		canvas.translate(area_x + Math.round(area_w / 2), area_y + Math.round(area_h / 2));
		canvas.rotate(angle * TO_RADIANS);
		canvas.drawImage(tempCanvas, -Math.round(area_w / 2), -Math.round(area_h / 2));
		canvas.restore();
		if (w == WIDTH && h == HEIGHT){	
			//if main canvas
			GUI.zoom();
		}
	};

	this.resize_box = function () {
		POP.add({name: "width", title: "Width (pixels):", value: '', placeholder: WIDTH});
		POP.add({name: "height", title: "Height (pixels):", value: '', placeholder: HEIGHT});
		POP.add({name: "width_percent", title: "Width (%):", value: '', placeholder: 100});
		POP.add({name: "height_percent", title: "Height (%):", value: '', placeholder: 100});
		POP.add({name: "mode", title: "Mode:", values: ["Resample - Hermite", "Basic", "HQX"]});
		POP.add({name: "preblur", title: "Pre-Blur:", values: ["Yes", "No"], value: "No"});
		POP.add({name: "sharpen", title: "Sharpen:", values: ["Yes", "No"], value: "No"});
		POP.show('Resize', [IMAGE, "resize_layer"]);
	};

	this.resize_layer = function (user_response) {
		EDIT.save_state();
		var width = parseInt(user_response.width);
		var height = parseInt(user_response.height);
		var width_100 = parseInt(user_response.width_percent);
		var height_100 = parseInt(user_response.height_percent);
		var preblur = user_response.preblur;
		var sharpen = user_response.sharpen;
		if (isNaN(width) && isNaN(height) && isNaN(width_100) && isNaN(height_100))
			return false;
		if (width == WIDTH && height == HEIGHT)
			return false;

		//if dimension with percent provided
		if (isNaN(width) && isNaN(height)) {
			if (isNaN(width_100) == false) {
				width = Math.round(WIDTH * width_100 / 100);
			}
			if (isNaN(height_100) == false) {
				height = Math.round(HEIGHT * height_100 / 100);
			}
		}

		//if only 1 dimension was provided
		if (isNaN(width) || isNaN(height)) {
			var ratio = WIDTH/HEIGHT;
			if (isNaN(width))
				width = Math.round(height * ratio);
			if (isNaN(height))
				height = Math.round(width / ratio);
		}

		//anti-artifacting?
		if (preblur == 'Yes') {
			var ratio_w = WIDTH / width;
			var ratio_h = HEIGHT / height;
			var ratio_avg = Math.max(ratio_w, ratio_h);
			var power = ratio_avg * 0.3;
			if (power > 0.6) {
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.GaussianBlur(imageData, power);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
			}
		}
		
		//validate
		if (user_response.mode == "Resample - Hermite" && (width > WIDTH || height > HEIGHT)){
			//scalling up - Hermite not supported
			user_response.mode = "Resize";
		}
		if (user_response.mode == "HQX" && (width < WIDTH && height < HEIGHT)){
			//scalling down - HQX not supported
			user_response.mode = "Resample - Hermite";
		}

		var resize_type;		
		if (user_response.mode == "Resample - Hermite") {
			//Hermite resample - max quality
			resize_type = 'Hermite';
			
			var HERMITE = new Hermite_class();
			HERMITE.resample_single(canvas_active(true), width, height);
			
			if (GUI.last_menu != 'layer_resize') {
				WIDTH = width;
				HEIGHT = height;
				if (WIDTH < 1)
					WIDTH = 1;
				if (HEIGHT < 1)
					HEIGHT = 1;
				LAYER.set_canvas_size();
			}
			GUI.zoom();
		}
		else if(user_response.mode == "HQX") {
			//HQX - 2, 3, 4 scale only, but amazing quality if there are only few colors
			resize_type = 'HQX';
			
			//find correct dimensions
			var multiply = Math.max(width/WIDTH, height/HEIGHT);
			multiply = Math.round(multiply);
			if(multiply < 2)
				multiply = 2;
			if(multiply > 4)
				multiply = 4;
			
			var image_data_resized = hqx(canvas_active(true), multiply);
			
			canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
			WIDTH = WIDTH * multiply;
			HEIGHT = HEIGHT * multiply;
			LAYER.set_canvas_size();
			canvas_active().putImageData(image_data_resized, 0, 0 );
			GUI.zoom();
		}
		else {
			//simple resize - max speed
			resize_type = 'Default';
			tmp_data = document.createElement("canvas");
			tmp_data.width = WIDTH;
			tmp_data.height = HEIGHT;
			tmp_data.getContext("2d").drawImage(canvas_active(true), 0, 0);

			canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
			WIDTH = width;
			HEIGHT = height;
			LAYER.set_canvas_size();
			canvas_active().drawImage(tmp_data, 0, 0, width, height);
			GUI.zoom();
		}
		
		//sharpen after?
		if (sharpen == 'Yes') {
			var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
			var filtered = ImageFilters.Sharpen(imageData, 1);	//add effect
			canvas_active().putImageData(filtered, 0, 0);
		}
	};

	/**
	 * get canvas painted are coords
	 * 
	 * @param {HtmlElement} canvas
	 * @param {boolean} trim_white
	 */
	this.trim_info = function (canvas, trim_white) {
		var top = 0;
		var left = 0;
		var bottom = 0;
		var right = 0;
		var img = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
		var imgData = img.data;
		var empty = false;
		if(trim_white == undefined)
			trim_white = true;
		//check top
		main1:
			for (var y = 0; y < img.height; y++) {
			for (var x = 0; x < img.width; x++) {
				var k = ((y * (img.width * 4)) + (x * 4));
				if (imgData[k + 3] == 0)
					continue; //transparent 
				if (trim_white == true && imgData[k] == 255 && imgData[k + 1] == 255 && imgData[k + 2] == 255)
					continue; //white
				break main1;
			}
			top++;
		}
		//check left
		main2:
			for (var x = 0; x < img.width; x++) {
			for (var y = 0; y < img.height; y++) {
				var k = ((y * (img.width * 4)) + (x * 4));
				if (imgData[k + 3] == 0)
					continue; //transparent 
				if (trim_white == true && imgData[k] == 255 && imgData[k + 1] == 255 && imgData[k + 2] == 255)
					continue; //white
				break main2;
			}
			left++;
		}
		//check bottom
		main3:
			for (var y = img.height - 1; y >= 0; y--) {
			for (var x = img.width - 1; x >= 0; x--) {
				var k = ((y * (img.width * 4)) + (x * 4));
				if (imgData[k + 3] == 0)
					continue; //transparent 
				if (trim_white == true && imgData[k] == 255 && imgData[k + 1] == 255 && imgData[k + 2] == 255)
					continue; //white
				break main3;
			}
			bottom++;
		}
		//check right
		main4:
			for (var x = img.width - 1; x >= 0; x--) {
			for (var y = img.height - 1; y >= 0; y--) {
				var k = ((y * (img.width * 4)) + (x * 4));
				if (imgData[k + 3] == 0)
					continue; //transparent 
				if (trim_white == true && imgData[k] == 255 && imgData[k + 1] == 255 && imgData[k + 2] == 255)
					continue; //white
				break main4;
			}
			right++;
		}
		
		if(top == canvas.height && left == canvas.width){
			//canvas is empty
			empty = true;
		}
		
		return {
			top: top,
			left: left,
			bottom: bottom,
			right: right,
			empty: empty,
		};
	};

	this.trim = function (layer, no_resize, removeWhiteColor) {
		var all_top = HEIGHT;
		var all_left = WIDTH;
		var all_bottom = HEIGHT;
		var all_right = WIDTH;
		
		if(no_resize == undefined)
			no_resize = false;
		if(removeWhiteColor == undefined)
			removeWhiteColor = false;
		
		for (var i in LAYER.layers) {
			if (layer != undefined && LAYER.layers[i].name != layer)
				continue;

			var top = 0;
			var left = 0;
			var bottom = 0;
			var right = 0;
			var img = document.getElementById(LAYER.layers[i].name).getContext("2d").getImageData(0, 0, WIDTH, HEIGHT);
			var imgData = img.data;
			//check top
			main1:
				for (var y = 0; y < img.height; y++) {
				for (var x = 0; x < img.width; x++) {
					var k = ((y * (img.width * 4)) + (x * 4));
					if (imgData[k + 3] == 0)
						continue; //transparent
					if (removeWhiteColor === true && imgData[k] == 255 && imgData[k + 1] == 255 && imgData[k + 2] == 255)
						continue; //white
					break main1;
				}
				top++;
			}
			//check left
			main2:
				for (var x = 0; x < img.width; x++) {
				for (var y = 0; y < img.height; y++) {
					var k = ((y * (img.width * 4)) + (x * 4));
					if (imgData[k + 3] == 0)
						continue; //transparent
					if (removeWhiteColor === true && imgData[k] == 255 && imgData[k + 1] == 255 && imgData[k + 2] == 255)
						continue; //white
					break main2;
				}
				left++;
			}
			//check bottom
			main3:
				for (var y = img.height - 1; y >= 0; y--) {
				for (var x = img.width - 1; x >= 0; x--) {
					var k = ((y * (img.width * 4)) + (x * 4));
					if (imgData[k + 3] == 0)
						continue; //transparent
					if (removeWhiteColor === true && imgData[k] == 255 && imgData[k + 1] == 255 && imgData[k + 2] == 255)
						continue; //white
					break main3;
				}
				bottom++;
			}
			//check right
			main4:
				for (var x = img.width - 1; x >= 0; x--) {
				for (var y = img.height - 1; y >= 0; y--) {
					var k = ((y * (img.width * 4)) + (x * 4));
					if (imgData[k + 3] == 0)
						continue; //transparent
					if (removeWhiteColor === true && imgData[k] == 255 && imgData[k + 1] == 255 && imgData[k + 2] == 255)
						continue; //white
					break main4;
				}
				right++;
			}
			all_top = Math.min(all_top, top);
			all_left = Math.min(all_left, left);
			all_bottom = Math.min(all_bottom, bottom);
			all_right = Math.min(all_right, right);
		}
		//move to top-left corner
		for (var i in LAYER.layers) {
			if (layer != undefined && LAYER.layers[i].name != layer)
				continue;

			tmp_data = document.getElementById(LAYER.layers[i].name).getContext("2d").getImageData(0, 0, WIDTH, HEIGHT);
			document.getElementById(LAYER.layers[i].name).getContext("2d").clearRect(0, 0, WIDTH, HEIGHT);
			document.getElementById(LAYER.layers[i].name).getContext("2d").putImageData(tmp_data, -all_left, -all_top);
			var canvas_name = LAYER.layers[i].name;
		}
		
		if(removeWhiteColor == false && (all_left + all_right + all_top + all_bottom == 0 || (all_left + all_top == 0 && no_resize == true )) ){	
			//also trim white color
			this.trim(layer, no_resize, true);
			return;
		}
		
		//resize
		if (no_resize == false){
			if (layer != undefined) {
				var W = Math.round(WIDTH - all_left - all_right);
				var H = Math.round(HEIGHT - all_top - all_bottom);

				var imageData = document.getElementById(layer).getContext("2d").getImageData(0, 0, W, H);
				document.getElementById(layer).width = W;
				document.getElementById(layer).height = H;
				document.getElementById(layer).getContext("2d").clearRect(0, 0, W, H);
				document.getElementById(layer).getContext("2d").putImageData(imageData, 0, 0);

				return {
					top: all_top,
					left: all_left,
					bottom: all_bottom,
					right: all_right
				};
			}
			else {
				WIDTH = WIDTH - all_left - all_right;
				HEIGHT = HEIGHT - all_top - all_bottom;
				if (WIDTH < 1)
					WIDTH = 1;
				if (HEIGHT < 1)
					HEIGHT = 1;
				LAYER.set_canvas_size();
				LAYER.update_info_block();
			}
		}
	};

	this.decrease_colors = function (canvas_source, canvas_destination, W, H, colors, greyscale) {
		var context = canvas_destination.getContext("2d");
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		var palette = [];

		//collect top colors
		var block_size = 10;
		var ctx = canvas_front; //use temp canvas
		ctx.clearRect(0, 0, W, H);
		ctx.drawImage(canvas_source, 0, 0, Math.ceil(canvas_source.width / block_size), Math.ceil(canvas_source.height / block_size)); //simple resize
		var img_p = ctx.getImageData(0, 0, Math.ceil(canvas_source.width / block_size), Math.ceil(canvas_source.height / block_size));
		var imgData_p = img_p.data;
		ctx.clearRect(0, 0, W, H);

		for (var i = 0; i < imgData_p.length; i += 4) {
			if (imgData_p[i + 3] == 0)
				continue;	//transparent
			var grey = Math.round(0.2126 * imgData_p[i] + 0.7152 * imgData_p[i + 1] + 0.0722 * imgData_p[i + 2]);
			palette.push([imgData_p[i], imgData_p[i + 1], imgData_p[i + 2], grey]);
		}

		//calculate weights
		var grey_palette = [];
		for (var i = 0; i < 256; i++)
			grey_palette[i] = 0;
		for (var i = 0; i < palette.length; i++)
			grey_palette[palette[i][3]]++;

		//remove similar colors
		for (var max = 10 * 3; max < 100 * 3; max = max + 10 * 3) {
			if (palette.length <= colors)
				break;
			for (var i = 0; i < palette.length; i++) {
				if (palette.length <= colors)
					break;
				var valid = true;
				for (var j = 0; j < palette.length; j++) {
					if (palette.length <= colors)
						break;
					if (i == j)
						continue;
					if (Math.abs(palette[i][0] - palette[j][0]) + Math.abs(palette[i][1] - palette[j][1]) + Math.abs(palette[i][2] - palette[j][2]) < max) {
						if (grey_palette[palette[i][3]] > grey_palette[palette[j][3]]) {
							//remove color
							palette.splice(j, 1);
							j--;
						}
						else {
							valid = false;
							break;
						}
					}
				}
				//remove color
				if (valid == false) {
					palette.splice(i, 1);
					i--;
				}
			}
		}
		palette = palette.slice(0, colors);

		//change
		var p_n = palette.length;
		for (var j = 0; j < H; j++) {
			for (var i = 0; i < W; i++) {
				var k = ((j * (W * 4)) + (i * 4));
				if (imgData[k + 3] == 0)
					continue;	//transparent
				
				//find closest color
				var index1 = 0;
				var min = 999999;
				var diff1;
				for (var m = 0; m < p_n; m++) {
					var diff = Math.abs(palette[m][0] - imgData[k]) + Math.abs(palette[m][1] - imgData[k + 1]) + Math.abs(palette[m][2] - imgData[k + 2]);
					if (diff < min) {
						min = diff;
						index1 = m;
						diff1 = diff;
					}
				}

				imgData[k] = palette[index1][0];
				imgData[k + 1] = palette[index1][1];
				imgData[k + 2] = palette[index1][2];

				if (greyscale == true) {
					var mid = Math.round(0.2126 * imgData[k] + 0.7152 * imgData[k + 1] + 0.0722 * imgData[k + 2]);
					imgData[k] = mid;
					imgData[k + 1] = mid;
					imgData[k + 2] = mid;
				}
			}
		}
		canvas_destination.getContext("2d").putImageData(img, 0, 0);
	};

	//fixing white and black color balance
	this.auto_adjust = function (context, W, H) {
		//settings
		var white = 240;	//white color min
		var black = 30;		//black color max
		var target_white = 1; 	//how much % white colors should take
		var target_black = 0.5;	//how much % black colors should take
		var modify = 1.1;	//color modify strength
		var cycles_count = 10; //how much iteration to change colors

		document.body.style.cursor = "wait";
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		var n = 0;	//pixels count without transparent

		//make sure we have white
		var n_valid = 0;
		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent
			if ((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3 > white)
				n_valid++;
			n++;
		}
		target = target_white;
		var n_fix_white = 0;
		var done = false;
		for (var j = 0; j < cycles_count; j++) {
			if (n_valid * 100 / n >= target)
				done = true;
			if (done == true)
				break;
			n_fix_white++;

			//adjust
			for (var i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				for (var c = 0; c < 3; c++) {
					var x = i + c;
					if (imgData[x] < 10)
						continue;
					//increase white
					imgData[x] *= modify;
					imgData[x] = Math.round(imgData[x]);
					if (imgData[x] > 255)
						imgData[x] = 255;
				}
			}

			//recheck
			n_valid = 0;
			for (var i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				if ((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3 > white)
					n_valid++;
			}
		}

		//make sure we have black
		n_valid = 0;
		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent
			if ((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3 < black)
				n_valid++;
		}
		target = target_black;
		var n_fix_black = 0;
		var done = false;
		for (var j = 0; j < cycles_count; j++) {
			if (n_valid * 100 / n >= target)
				done = true;
			if (done == true)
				break;
			n_fix_black++;

			//adjust
			for (var i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				for (var c = 0; c < 3; c++) {
					var x = i + c;
					if (imgData[x] > 240)
						continue;
					//increase black
					imgData[x] -= (255 - imgData[x]) * modify - (255 - imgData[x]);
					imgData[x] = Math.round(imgData[x]);
				}
			}

			//recheck
			n_valid = 0;
			for (var i = 0; i < imgData.length; i += 4) {
				if (imgData[i + 3] == 0)
					continue;	//transparent
				if ((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3 < black)
					n_valid++;
			}
		}

		//save	
		context.putImageData(img, 0, 0);
		document.body.style.cursor = "auto";
		//log('Iterations: brighten='+n_fix_white+", darken="+n_fix_black);
	};

	this.histogram = function () {
		POP.add({name: "param1", title: "Channel:", values: ["Gray", "Red", "Green", "Blue"], onchange: "IMAGE.histogram_onload()"});
		POP.add({title: 'Histogram:', function: function () {
				var html = '<canvas style="position:relative;" id="c_h" width="256" height="100"></canvas>';
				return html;
			}});
		POP.add({title: "Total pixels:", value: ""});
		POP.add({title: "Average:", value: ""});
		POP.show(
			'Histogram',
			undefined,
			undefined,
			this.histogram_onload
		);
	};
	
	this.histogram_onload = function () {
		var img = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
		var imgData = img.data;
		var channel_grey = document.getElementById("pop_data_param1_poptmp0");
		var channel_r = document.getElementById("pop_data_param1_poptmp1");
		var channel_g = document.getElementById("pop_data_param1_poptmp2");
		var channel_b = document.getElementById("pop_data_param1_poptmp3");
		
		if (channel_grey.checked == true)
			channel = 0;
		else if (channel_r.checked == true)
			channel = 1;
		else if (channel_g.checked == true)
			channel = 2;
		else if (channel_b.checked == true)
			channel = 3;

		var hist_data = [ [], [], [], [] ]; //grey, red, green, blue
		var total = imgData.length / 4;
		var sum = 0;
		var grey;

		for (var i = 0; i < imgData.length; i += 4) {
			//collect grey
			grey = Math.round((imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3);
			sum = sum + imgData[i] + imgData[i + 1] + imgData[i + 2];
			if(hist_data[0][grey] == undefined)
				hist_data[0][grey] = 1;
			else
				hist_data[0][grey]++;
			
			//collect colors
			for(var c = 0; c < 3; c++) {
				if(c+1 != channel)
					continue;
				if(hist_data[c+1][imgData[i+c]] == undefined)
					hist_data[c+1][imgData[i+c]] = 1;
				else
					hist_data[c+1][imgData[i+c]]++;
			}
		}
		
		var c = document.getElementById("c_h").getContext("2d");
		c.rect(0, 0, 256, 100);
		c.fillStyle = "#ffffff";
		c.fill();
		var opacity = 1;
		
		//draw histogram
		for(var h in hist_data) {
			for (var i = 0; i <= 255; i++) {
				if(h != channel)
					continue;
				if (hist_data[h][i] == 0)
					continue;
				c.beginPath();
				
				if(h == 0)
					c.strokeStyle = "rgba(64, 64, 64, "+opacity*2+")";
				else if(h == 1)
					c.strokeStyle = "rgba(255, 0, 0, "+opacity+")";
				else if(h == 2)
					c.strokeStyle = "rgba(0, 255, 0, "+opacity+")";
				else if(h == 3)
					c.strokeStyle = "rgba(0, 0, 255, "+opacity+")";
				
				c.lineWidth = 1;
				c.moveTo(i + 0.5, 100 + 0.5);
				c.lineTo(i + 0.5, 100 - Math.round(hist_data[h][i] * 255 * 100 / total / 6) + 0.5);
				c.stroke();
			}
		}
		
		document.getElementById("pop_data_totalpixel").innerHTML = HELPER.number_format(total, 0);
		if (total > 0)
			average = Math.round(sum * 10 / total / 3) / 10;
		else
			average = '-';
		document.getElementById("pop_data_average").innerHTML = average;
	};
	
	this.unique_colors_count = function (canvas) {
		var img = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
		var imgData = img.data;
		var colors = [];
		var n = 0;
		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent
			var key = imgData[i] + "." + imgData[i + 1] + "." + imgData[i + 2];
			if (colors[key] == undefined) {
				colors[key] = 1;
				n++;
			}
		}
		return n;
	};
	this.zoom_in = function() {
		GUI.zoom(+1, true);
	};
	this.zoom_out = function() {
		GUI.zoom(-1, true);
	};
	this.zoom_original = function() {
		GUI.zoom(100, true);
	};
	this.zoom_auto = function() {
		GUI.zoom_auto();
	};
}