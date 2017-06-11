/* global MAIN, HELPER, LAYER, EDIT, POP, GUI, EVENTS, IMAGE, EL, fx, ImageFilters, sketchy_brush, shaded_brush, chrome_brush, BezierCurveBrush */
/* global WIDTH, HEIGHT, COLOR, canvas_active, canvas_front */

var DRAW = new DRAW_TOOLS_CLASS();

/** 
 * manages draw tools
 * 
 * @author ViliusL
 */
function DRAW_TOOLS_CLASS() {
	
	/**
	 * user action for selected area
	 */
	this.select_square_action = '';
	
	/**
	 * previous line coordinates [x, y]
	 */
	this.last_line = [];
	
	/**
	 * user selected area config - array(x, y, width, height)
	 */
	this.select_data = false;
	
	/**
	 * currently used tool
	 */
	this.active_tool = 'brush';
	
	/**
	 * line points data for curved line
	 */
	var curve_points = [];
	
	/**
	 * image data for cloning tool
	 */
	var clone_data = false;
	
	/**
	 * fx library object
	 */
	var fx_filter = false;

	//credits to Victor Haydin
	this.toolFiller = function (context, W, H, x, y, color_to, sensitivity, anti_aliasing) {
		canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
		var img_tmp = canvas_front.getImageData(0, 0, W, H);
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
		if (color_from.r == color_to.r && color_from.g == color_to.g && color_from.b == color_to.b && color_from.a == color_to.a) {
			return false;
		}
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
		canvas_front.putImageData(img_tmp, 0, 0);
		if (anti_aliasing == true) {
			context.shadowColor = "rgba(" + color_to.r + ", " + color_to.g + ", " + color_to.b + ", " + color_to.a / 255 + ")";
			context.shadowBlur = 5;
		}
		context.drawImage(document.getElementById("canvas_front"), 0, 0);
		//reset
		context.shadowBlur = 0;
	};
	
	this.tool_magic_wand = function (context, W, H, x, y, sensitivity, anti_aliasing) {
		canvas_front.clearRect(0, 0, WIDTH, HEIGHT);

		canvas_front.rect(0, 0, WIDTH, HEIGHT);
		canvas_front.fillStyle = "rgba(255, 255, 255, 0)";
		canvas_front.fill();

		var img_tmp = canvas_front.getImageData(0, 0, W, H);
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
		//destination-out + blur = anti-aliasing
		if (anti_aliasing == true)
			img_tmp = ImageFilters.StackBlur(img_tmp, 2);
		canvas_front.putImageData(img_tmp, 0, 0);
		context.globalCompositeOperation = "destination-out";
		context.drawImage(document.getElementById("canvas_front"), 0, 0);
		//reset
		context.shadowBlur = 0;
		context.globalCompositeOperation = 'source-over';
	};
	
	//type = click, right_click, drag, move, release
	this.select_tool = function (type, mouse, event) {
		if (mouse == undefined)
			return false;
		if (mouse.valid == false)
			return true;
		if (mouse.click_valid == false)
			return true;
		if (event != undefined && event.target.id == "canvas_preview")
			return true;
		var active_layer_obj = document.getElementById(LAYER.layers[LAYER.layer_active].name);
		
		if (type == 'drag') {
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			
			if(active_layer_obj.style.visibility != 'hidden'){
				//hide active layer
				active_layer_obj.style.visibility = 'hidden';
			}
			
			if(EVENTS.ctrl_pressed == true){
				//ctrl is pressed
				var xx = mouse.x;
				var yy = mouse.y;
				if (Math.abs(mouse.click_x - mouse.x) < Math.abs(mouse.click_y - mouse.y))
					xx = mouse.click_x;
				else
					yy = mouse.click_y;
				canvas_front.drawImage(canvas_active(true), xx - mouse.click_x, yy - mouse.click_y);
			}
			else{
				canvas_front.drawImage(canvas_active(true), mouse.x - mouse.click_x, mouse.y - mouse.click_y);
			}
		}
		else if (type == 'release') {
			//show active layer
			active_layer_obj.style.visibility = 'visible';
			
			if (mouse.valid == false || mouse.click_x === false){
				return false;
			}
			if (mouse.x - mouse.click_x == 0 && mouse.y - mouse.click_y == 0){
				return false;
			}
			EDIT.save_state();
			var tmp = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
			canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
			if(EVENTS.ctrl_pressed == true){
				//ctrl is pressed
				var xx = mouse.x;
				var yy = mouse.y;
				if (Math.abs(mouse.click_x - mouse.x) < Math.abs(mouse.click_y - mouse.y))
					xx = mouse.click_x;
				else
					yy = mouse.click_y;
				canvas_active().putImageData(tmp, xx - mouse.click_x, yy - mouse.click_y);
			}
			else{
				canvas_active().putImageData(tmp, mouse.x - mouse.click_x, mouse.y - mouse.click_y);
			}	
		}
	};
	this.magic_wand = function (type, mouse, event) {
		if (mouse.valid == false)
			return true;
		if (type == 'click') {
			EDIT.save_state();
			this.tool_magic_wand(canvas_active(), WIDTH, HEIGHT, mouse.x, mouse.y, GUI.action_data().attributes.power, GUI.action_data().attributes.anti_aliasing);
		}
	};
	this.erase = function (type, mouse, event) {
		if (mouse.valid == false)
			return true;
		var strict = GUI.action_data().attributes.strict;
		var size = GUI.action_data().attributes.size;
		var is_circle = GUI.action_data().attributes.circle;
		
		var strict_element = document.getElementById('strict');
		if(is_circle == false){
			//hide strict controlls
			if(strict_element != undefined)
				strict_element.style.display = 'none';
		}
		else{
			//show strict controlls
			if(strict_element != undefined)
				strict_element.style.display = 'block';
		}

		if (type == 'click') {
			EDIT.save_state();
			
			canvas_active().beginPath();
			canvas_active().lineWidth = size;
			canvas_active().lineCap = 'round';
			canvas_active().lineJoin = 'round';		
			if (ALPHA < 255)
				canvas_active().strokeStyle = "rgba(255, 255, 255, " + ALPHA / 255 / 10 + ")";
			else
				canvas_active().strokeStyle = "rgba(255, 255, 255, 1)";
			
			if (is_circle == false) {
				//rectangle
				canvas_active().save();
				canvas_active().globalCompositeOperation = 'destination-out';
				canvas_active().fillStyle = "rgba(255, 255, 255, " + ALPHA / 255 + ")";
				canvas_active().fillRect(mouse.x - Math.ceil(size / 2) + 1, mouse.y - Math.ceil(size / 2) + 1, size, size);
				canvas_active().restore();
			}
			else {
				//circle
				canvas_active().save();
				
				if (strict == false) {
					var radgrad = canvas_active().createRadialGradient(
						mouse.x, mouse.y, size / 8,
						mouse.x, mouse.y, size / 2);
					radgrad.addColorStop(0, "rgba(255, 255, 255, " + ALPHA / 255 + ")");
					radgrad.addColorStop(1, "rgba(255, 255, 255, 0)");
				}

				//set Composite
					canvas_active().globalCompositeOperation = 'destination-out';
				if (strict == true)
					canvas_active().fillStyle = "rgba(255, 255, 255, " + ALPHA / 255 + ")";
				else
					canvas_active().fillStyle = radgrad;
				canvas_active().beginPath();
				canvas_active().arc(mouse.x, mouse.y, size / 2, 0, Math.PI * 2, true);
				canvas_active().fill();
				canvas_active().restore();
			}
		}
		else if (type == 'drag' && mouse.last_x != false && mouse.last_y != false) {
			canvas_active().save();
			
			if (strict == false && is_circle == true) {
				var radgrad = canvas_active().createRadialGradient(
					mouse.x, mouse.y, size / 10,
					mouse.x, mouse.y, size / 2);
				if (ALPHA < 255)
					radgrad.addColorStop(0, "rgba(255, 255, 255, " + ALPHA / 255 / 10 + ")");
				else
					radgrad.addColorStop(0, "rgba(255, 255, 255, 1)");
				radgrad.addColorStop(1, "rgba(255, 255, 255, 0)");
				canvas_active().strokeStyle = radgrad;
			}
			
			canvas_active().save();
			canvas_active().globalCompositeOperation = 'destination-out';

			canvas_active().beginPath();
			canvas_active().moveTo(mouse.last_x, mouse.last_y);
			canvas_active().lineTo(mouse.x, mouse.y);
			canvas_active().stroke();

			canvas_active().restore();
			
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			if (is_circle == false) {
				canvas_front.lineWidth = 1;
				EL.rectangle_dashed(canvas_front, mouse.x - Math.ceil(size / 2) + 1, mouse.y - Math.ceil(size / 2) + 1, mouse.x + Math.floor(size / 2), mouse.y + Math.floor(size / 2), 1, '#000000');
			}
			else {
				EL.circle(canvas_front, mouse.x, mouse.y, size);
			}
		}
		else if (type == 'move') {
			var size1 = Math.floor((size) / 2);
			var size2 = Math.floor((size) / 2);
			if (size % 2 == 0)
				size2--;
			else {
				size1--;
			}

			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			if (is_circle == false) {
				canvas_front.lineWidth = 1;
				EL.rectangle_dashed(canvas_front, mouse.x - Math.ceil(size / 2) + 1, mouse.y - Math.ceil(size / 2) + 1, mouse.x + Math.floor(size / 2), mouse.y + Math.floor(size / 2), 1, '#000000');
			}
			else {
				EL.circle(canvas_front, mouse.x, mouse.y, size);
			}
		}
	};
	this.fill = function (type, mouse, event) {
		if (mouse.valid == false)
			return true;
		if (type == 'click') {
			EDIT.save_state();
			var color_to = HELPER.hex2rgb(COLOR);
			color_to.a = ALPHA;
			DRAW.toolFiller(canvas_active(), WIDTH, HEIGHT, mouse.x, mouse.y, color_to, GUI.action_data().attributes.power, GUI.action_data().attributes.anti_aliasing);
		}
	};
	this.pick_color = function (type, mouse, event) {
		if (mouse.valid == false)
			return true;
		if (type == 'click') {
			var c = canvas_active().getImageData(mouse.x, mouse.y, 1, 1).data;
			COLOR = "#" + ("000000" + HELPER.rgbToHex(c[0], c[1], c[2])).slice(-6);

			//set alpha
			ALPHA = c[3];
			document.getElementById("rgb_a").value = ALPHA;

			GUI.sync_colors();
		}
	};
	this.pencil = function (type, mouse, event) {
		if (mouse.valid == false)
			return true;
		var color_rgb = HELPER.hex2rgb(COLOR);
		if (type == 'click') {
			EDIT.save_state();
		}
		else if (type == 'drag') {
			//why no simple lines? this way turns off aliasing
			if (mouse.last_x != false && mouse.last_y != false) {
				//saving
				dist_x = mouse.last_x - mouse.x;
				dist_y = mouse.last_y - mouse.y;
				distance = Math.sqrt((dist_x * dist_x) + (dist_y * dist_y));
				radiance = Math.atan2(dist_y, dist_x);
				for (var i = 0; i < distance; i++) {
					x_tmp = mouse.x + Math.cos(radiance) * i;
					y_tmp = mouse.y + Math.sin(radiance) * i;

					x_tmp = Math.round(x_tmp);
					y_tmp = Math.round(y_tmp);
					var my_color = HELPER.hex2rgb(COLOR);
					canvas_active().fillStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
					canvas_active().fillRect(x_tmp, y_tmp, 1, 1);
				}
			}
		}
		else if (type == 'release') {
			canvas_active().fillStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
			canvas_active().fillRect(mouse.x, mouse.y, 1, 1);
		}
	};
	this.line = function (type, mouse, event) {
		if (mouse.click_valid == false)
			return false;
		var color_rgb = HELPER.hex2rgb(COLOR);

		//horizontal/vertical only
		var xx = mouse.x;
		var yy = mouse.y;
		var from_x = mouse.click_x;
		var from_y = mouse.click_y;
		var attribute_type = GUI.action_data().attributes.type;
		if(attribute_type == undefined)
			attribute_type = 'Simple';
		
		//set line endings
		if(attribute_type == 'Simple'){
			var lineCap = 'butt';
		}
		else{
			var lineCap = 'round';
		}
		canvas_front.lineCap = lineCap;
		canvas_active().lineCap = lineCap;
			
		if (type == 'move') {
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
			canvas_front.lineWidth = GUI.action_data().attributes.size;

			if (attribute_type == 'Curve') {
				//curve
				if (curve_points.length == 2) {
					canvas_front.beginPath();
					canvas_front.moveTo(curve_points[0][0] + 0.5, curve_points[0][1] + 0.5);
					canvas_front.quadraticCurveTo(mouse.x + 0.5, mouse.y + 0.5, curve_points[1][0], curve_points[1][1]);
					canvas_front.stroke();
				}
			}
		}
		else if (type == 'drag') {
			document.body.style.cursor = "crosshair";
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.beginPath();
			canvas_front.strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
			canvas_front.lineWidth = GUI.action_data().attributes.size;
			if (attribute_type == 'Multi-line' && this.last_line[0] != undefined) {
				from_x = this.last_line[0];
				from_y = this.last_line[1];
			}
			if (EVENTS.ctrl_pressed == true) {
				if (Math.abs(from_x - mouse.x) < Math.abs(from_y - mouse.y))
					xx = from_x;
				else
					yy = from_y;
			}

			//arrow
			if (attribute_type == 'Arrow') {
				var headlen = GUI.action_data().attributes.size * 5;
				if (headlen < 15)
					headlen = 15;
				EL.arrow(canvas_front, from_x + 0.5, from_y + 0.5, xx + 0.5, yy + 0.5, headlen);
			}
			//line
			else {
				canvas_front.moveTo(from_x + 0.5, from_y + 0.5);
				canvas_front.lineTo(xx + 0.5, yy + 0.5);
				canvas_front.stroke();
			}
		}
		else if (type == 'click') {
			//curve
			if (attribute_type == 'Curve') {
				EDIT.save_state();
				
				canvas_active().beginPath();
				canvas_active().strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
				canvas_active().lineWidth = GUI.action_data().attributes.size;
				if (EVENTS.ctrl_pressed == true) {
					if (Math.abs(from_x - mouse.x) < Math.abs(from_y - mouse.y))
						xx = from_x;
					else
						yy = from_y;
				}
				if (curve_points.length == 2) {
					canvas_active().beginPath();
					canvas_active().moveTo(curve_points[0][0] + 0.5, curve_points[0][1] + 0.5);
					canvas_active().quadraticCurveTo(xx + 0.5, yy + 0.5, curve_points[1][0], curve_points[1][1]);
					canvas_active().stroke();
					curve_points = [];
				}
			}
			if (attribute_type != 'Multi-line'){
				//reset last line position
				DRAW.last_line = [];
			}
		}
		else if (type == 'release') {
			document.body.style.cursor = "auto";
			if (mouse.x - mouse.click_x == 0 && mouse.y - mouse.click_y == 0 && attribute_type != 'Multi-line')
				return false;

			EDIT.save_state();
			
			canvas_active().beginPath();
			canvas_active().strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
			canvas_active().lineWidth = GUI.action_data().attributes.size;
			if (attribute_type == 'Multi-line' && this.last_line[0] != undefined) {
				from_x = DRAW.last_line[0];
				from_y = DRAW.last_line[1];
			}
			if (EVENTS.ctrl_pressed == true) {
				if (Math.abs(from_x - mouse.x) < Math.abs(from_y - mouse.y))
					xx = from_x;
				else
					yy = from_y;
			}
			//arrow
			if (attribute_type == 'Arrow') {
				var headlen = GUI.action_data().attributes.size * 5;
				if (headlen < 15)
					headlen = 15;
				EL.arrow(canvas_active(), from_x + 0.5, from_y + 0.5, xx + 0.5, yy + 0.5, headlen);
				this.last_line[0] = xx;
				this.last_line[1] = yy;
			}
			//curve
			else if (attribute_type == 'Curve') {
				if (curve_points.length == 0 && (mouse.click_x != mouse.x || mouse.click_y != mouse.y)) {
					curve_points.push([mouse.click_x, mouse.click_y]);
					curve_points.push([xx, yy]);
				}
				else if (curve_points.length == 2)
					curve_points = [];
			}
			//line
			else {
				EL.line(canvas_active(), from_x, from_y, xx, yy);
				this.last_line[0] = xx;
				this.last_line[1] = yy;
			}
		}
	};
	this.letters = function (type, mouse, event) {
		var _this = this;
		if (mouse.valid == false)
			return true;
		var xx = mouse.x;
		var yy = mouse.y;
		if (type == 'click') {
			POP.add({name: "text", title: "Text:", value: "", type: 'textarea'});
			POP.add({name: "size", title: "Size:", value: 20, range: [2, 1000], step: 2});
			POP.add({name: "color", title: "Color:", value: "#000000", type: "color"});
			POP.add({name: "style", title: "Font style:", values: ["Normal", "Italic", "Bold", "Bold Italic"], type: 'select'});
			POP.add({name: "family", title: "Font family:", values: ["Arial", "Courier", "Impact", "Helvetica", "monospace", "Times New Roman", "Verdana"], type: 'select'});
			POP.add({name: "size_3d", title: "3D size:", value: 0, range: [0, 200]});
			POP.add({name: "pos_3d", title: "3D position:", values: ["Top-left", "Top-right", "Bottom-left", "Bottom-right"], type: 'select'});
			POP.add({name: "shadow", title: "Shadow:", values: ["No", "Yes"]});
			POP.add({name: "shadow_blur", title: "Shadow blur:", value: 6, range: [1, 20]});
			POP.add({name: "shadow_color", title: "Shadow color:", value: "#000000", type: "color"});
			POP.add({name: "fill_style", title: "Fill style:", values: ["Fill", "Stroke", "Both"], type: 'select'});
			POP.add({name: "stroke_size", title: "Stroke size:", value: 1, range: [1, 100]});
			POP.preview_in_main = true;
			POP.show(
				'Text', 
				function (user_response) {
					EDIT.save_state();
					var trim_details = IMAGE.trim_info(canvas_active(true));
					if (trim_details.empty == false) {
						LAYER.layer_add();
					}
					text = user_response.text.split("\n");
					for (var i in text) {
						user_response.text = text[i];
						var yyy = yy + i * (parseInt(user_response.size) + 2);
						_this.letters_render(canvas_active(), xx, yyy, user_response);
					}
					canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				},
				function (user_response) {
					canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
					text = user_response.text.split("\n");
					for (var i in text) {
						user_response.text = text[i];
						var yyy = yy + i * (parseInt(user_response.size) + 2);
						_this.letters_render(canvas_front, xx, yyy, user_response);
					}
				}
			);
		}
	};
	this.letters_render = function (canvas, xx, yy, user_response) {
		var text = user_response.text;
		var size = parseInt(user_response.size);
		var color = user_response.color;
		var dpth = parseInt(user_response.size_3d);
		var pos_3d = user_response.pos_3d;
		var shadow = user_response.shadow;
		var shadow_blur = parseInt(user_response.shadow_blur);
		var shadow_color = user_response.shadow_color;
		var font = user_response.family;
		var font_style = user_response.style;
		var fill_style = user_response.fill_style;
		var stroke_size = user_response.stroke_size;
		var dx;
		var dy;
		if (pos_3d == "Top-left") {
			dx = -1;
			dy = -1;
		}
		else if (pos_3d == "Top-right") {
			dx = 1;
			dy = -1;
		}
		else if (pos_3d == "Bottom-left") {
			dx = -1;
			dy = 1;
		}
		else if (pos_3d == "Bottom-right") {
			dx = 1;
			dy = 1;
		}

		var color_rgb = HELPER.hex2rgb(color);
		canvas.fillStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
		canvas.font = font_style + " " + size + "px " + font;
		var letters_height = HELPER.font_pixel_to_height(size);

		//shadow
		if (shadow == 'Yes') {
			canvas.save();
			canvas.shadowColor = shadow_color;
			canvas.shadowBlur = shadow_blur;
			canvas.shadowOffsetX = dx;
			canvas.shadowOffsetY = dy;
			canvas.fillText(text, xx + dx * (dpth - 1), yy + letters_height + dy * (dpth - 1));
			canvas.restore();
		}

		//3d
		if (dpth > 0) {
			canvas.fillStyle = HELPER.darkenColor(COLOR, -30);
			//canvas.fillStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
			for (cnt = 0; cnt < dpth; cnt++)
				canvas.fillText(text, xx + dx * cnt, yy + letters_height + dy * cnt);
			//color_rgb = HELPER.hex2rgb(COLOR);
		}

		//main text
		canvas.fillStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
		canvas.strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
		canvas.lineWidth = stroke_size;
		if (fill_style == 'Fill' || fill_style == 'Both')
			canvas.fillText(text, xx, yy + letters_height);
		if (fill_style == 'Stroke' || fill_style == 'Both')
			canvas.strokeText(text, xx, yy + letters_height);

		GUI.zoom();
	};
	this.draw_square = function (type, mouse, event) {
		if (mouse.click_valid == false)
			return true;
		var color_rgb = HELPER.hex2rgb(COLOR);
		var fill = GUI.action_data().attributes.fill;
		var width = mouse.x - mouse.click_x;
		var height = mouse.y - mouse.click_y;
			
		if (type == 'drag') {
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.fillStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
			canvas_front.strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
			canvas_front.lineWidth = 1;
			
			if (GUI.action_data().attributes.square == true)
				EL.square(canvas_front, mouse.click_x, mouse.click_y, width, height, fill);
			else
				EL.rectangle(canvas_front, mouse.click_x, mouse.click_y, width, height, fill);
		}
		else if (type == 'release') {
			if(mouse.x == mouse.click_x && mouse.y == mouse.click_y)
				return false;
			EDIT.save_state();
			
			canvas_active().fillStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
			canvas_active().strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
			canvas_active().lineWidth = 1;
			
			if (GUI.action_data().attributes.square == true)
				EL.square(canvas_active(), mouse.click_x, mouse.click_y, width, height, fill);
			else
				EL.rectangle(canvas_active(), mouse.click_x, mouse.click_y, width, height, fill);
		}
	};
	this.draw_circle = function (type, mouse, event) {
		if (mouse.click_valid == false)
			return true;
		var color_rgb = HELPER.hex2rgb(COLOR);
		if (type == 'drag') {
			dist_x = mouse.x - mouse.click_x;
			dist_y = mouse.y - mouse.click_y;
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			if (GUI.action_data().attributes.circle == true)
				dist_x = dist_y = Math.min(dist_x, dist_y);
			if (GUI.action_data().attributes.fill == true)
				EL.ellipse_by_center(canvas_front, mouse.click_x, mouse.click_y, dist_x * 2, dist_y * 2, "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")", true);
			else
				EL.ellipse_by_center(canvas_front, mouse.click_x, mouse.click_y, dist_x * 2, dist_y * 2, "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")");
		}
		else if (type == 'release') {
			dist_x = mouse.x - mouse.click_x;
			dist_y = mouse.y - mouse.click_y;
			if(dist_x == 0 && dist_y == 0)
				return false;
			EDIT.save_state();
			if (GUI.action_data().attributes.circle == true)
				dist_x = dist_y = Math.min(dist_x, dist_y);
			canvas_active().lineWidth = 1;
			if (GUI.action_data().attributes.fill == true)
				EL.ellipse_by_center(canvas_active(), mouse.click_x, mouse.click_y, dist_x * 2, dist_y * 2, "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")", true);
			else
				EL.ellipse_by_center(canvas_active(), mouse.click_x, mouse.click_y, dist_x * 2, dist_y * 2, "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")");
		}
	};
	this.update_brush = function () {
		document.getElementById('anti_aliasing').style.display = '';
		if (GUI.action_data().attributes.type != 'Brush')
			document.getElementById('anti_aliasing').style.display = 'none';
	};
	this.desaturate_tool = function (type, mouse, event) {
		if (mouse.valid == false)
			return true;
		var size = GUI.action_data().attributes.size;
		var xx = mouse.x - size / 2;
		var yy = mouse.y - size / 2;
		if (xx < 0)
			xx = 0;
		if (yy < 0)
			yy = 0;

		if (type == 'click') {
			EDIT.save_state();
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.GrayScale(imageData);	//add effect
			EL.image_round(canvas_active(), mouse.x, mouse.y, size, filtered, document.getElementById("canvas_front"), GUI.action_data().attributes.anti_aliasing);
		}
		else if (type == 'drag') {
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.GrayScale(imageData);	//add effect
			EL.image_round(canvas_active(), mouse.x, mouse.y, size, filtered, document.getElementById("canvas_front"), GUI.action_data().attributes.anti_aliasing);
		}
		if (type == 'move' || type == 'drag') {
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			EL.circle(canvas_front, mouse.x, mouse.y, size);
		}
	};
	this.brush = function (type, mouse, event) {
		if (mouse.valid == false)
			return true;
		var brush_type = GUI.action_data().attributes.type;
		var color_rgb = HELPER.hex2rgb(COLOR);
		var size = GUI.action_data().attributes.size;
		var original_size = GUI.action_data().attributes.size;

		if (type == 'click')
			EDIT.save_state();

		if (brush_type == 'Brush') {
			if (type == 'click') {
				//init settings
				canvas_active().beginPath();
				canvas_active().strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
				canvas_active().lineWidth = GUI.action_data().attributes.size;
				canvas_active().lineCap = 'round';
				canvas_active().lineJoin = 'round';

				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				if (ALPHA < 255) {
					canvas_front.beginPath();
					canvas_front.strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
					canvas_front.lineWidth = GUI.action_data().attributes.size;
					canvas_front.lineCap = 'round';
					canvas_front.lineJoin = 'round';
				}
				
				//blur
				canvas_active().shadowBlur = 0;
				if (GUI.action_data().attributes.anti_aliasing == true) {
					canvas_active().shadowColor = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
					canvas_active().shadowBlur = Math.round(GUI.action_data().attributes.size);
				}
			}
			else if (type == 'drag' && mouse.last_x != false && mouse.last_y != false) {
				
				//detect line size
				var max_speed = 20;
				var power = 0.7; //max 1, how much speed reduce size, 1 means reduce to 0
				
				var new_size = original_size - original_size / max_speed * mouse.speed_average * power;
				new_size = Math.max(new_size, original_size/4);
				new_size = Math.round(new_size);
				canvas_front.lineWidth = new_size;		
				canvas_active().lineWidth = new_size;
				
				if (ALPHA == 255)
					canvas_active().beginPath();
				canvas_active().moveTo(mouse.last_x, mouse.last_y);
				canvas_active().lineTo(mouse.x, mouse.y);
				if (ALPHA == 255)
					canvas_active().stroke();

				//now draw preview
				if (ALPHA < 255) {
					canvas_front.beginPath();
					//clean from last line
					canvas_front.globalCompositeOperation = "destination-out";
					canvas_front.strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", 1)";
					canvas_front.moveTo(mouse.last_x, mouse.last_y);
					canvas_front.lineTo(mouse.x, mouse.y);
					canvas_front.stroke();
					//reset
					canvas_front.strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
					canvas_front.globalCompositeOperation = "source-over";
					//draw new line segment
					canvas_front.moveTo(mouse.last_x, mouse.last_y);
					canvas_front.lineTo(mouse.x, mouse.y);
					canvas_front.stroke();
				}
			}
			else if (type == 'release') {
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				//paint everything
				canvas_active().stroke();

				//if mouse was not moved
				if (mouse.click_x == mouse.x && mouse.click_y == mouse.y) {
					canvas_active().beginPath();
					canvas_active().arc(mouse.x, mouse.y, GUI.action_data().attributes.size / 2, 0, 2 * Math.PI, false);
					canvas_active().fillStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
					canvas_active().fill();
				}
				canvas_active().shadowBlur = 0;
			}
			else if (type == 'move') {
				//show size
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				EL.circle(canvas_front, mouse.x, mouse.y, size);
			}
		}
		else if (brush_type == 'BezierCurve') {
			if (type == 'click')
				BezierCurveBrush.startCurve(mouse.x, mouse.y);
			else if (type == 'drag' && mouse.last_x != false && mouse.last_y != false) {
				var color_rgb = HELPER.hex2rgb(COLOR);
				canvas_active().strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
				canvas_active().lineWidth = 0.5;

				BezierCurveBrush.draw(canvas_active(), color_rgb, mouse.x, mouse.y, GUI.action_data().attributes.size);
			}
		}
		else if (brush_type == 'Chrome') {
			if (type == 'click') {
				chrome_brush.init(canvas_active());
				chrome_brush.strokeStart(mouse.x, mouse.y);
			}
			else if (type == 'drag' && mouse.last_x != false && mouse.last_y != false) {
				var color_rgb = HELPER.hex2rgb(COLOR);
				canvas_active().strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
				canvas_active().lineWidth = 1;

				chrome_brush.stroke(color_rgb, mouse.x, mouse.y, GUI.action_data().attributes.size);
			}
		}
		else if (brush_type == 'Fur') {
			if (type == 'click') {
				points = new Array();
				prevMouseX = mouse.x;
				prevMouseY = mouse.y;
				count = 0;
			}
			else if (type == 'drag' && mouse.last_x != false && mouse.last_y != false) {
				var color_rgb = HELPER.hex2rgb(COLOR);
				canvas_active().strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", 0.1)";
				canvas_active().lineWidth = 1;

				f = mouse.x;
				c = mouse.y;
				var e, b, a, g;
				points.push([f, c]);
				canvas_active().beginPath();
				canvas_active().moveTo(prevMouseX, prevMouseY);
				canvas_active().lineTo(f, c);
				canvas_active().stroke();
				for (e = 0; e < points.length; e++) {
					b = points[e][0] - points[count][0];
					a = points[e][1] - points[count][1];
					g = b * b + a * a;
					var g_size = Math.round(400 * GUI.action_data().attributes.size);
					if (g < g_size && Math.random() > g / g_size) {
						canvas_active().beginPath();
						canvas_active().moveTo(f + (b * 0.5), c + (a * 0.5));
						canvas_active().lineTo(f - (b * 0.5), c - (a * 0.5));
						canvas_active().stroke();
					}
				}
				prevMouseX = f;
				prevMouseY = c;
				count++;
			}
		}
		else if (brush_type == 'Grouped') {
			groups_n = GUI.action_data().attributes.size;
			gsize = 10;
			random_power = 5;

			if (type == 'click') {
				chrome_brush.init(canvas_active());
				chrome_brush.strokeStart(mouse.x, mouse.y);
				groups = [];

				for (var g = 0; g < groups_n; g++) {
					groups[g] = {};
					groups[g].x = HELPER.getRandomInt(-gsize, gsize);
					groups[g].y = HELPER.getRandomInt(-gsize, gsize);
				}
			}
			else if (type == 'drag' && mouse.last_x != false && mouse.last_y != false) {
				canvas_active().strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
				canvas_active().lineWidth = 0.5;

				for (var g in groups) {
					canvas_active().beginPath();
					canvas_active().moveTo(mouse.last_x + groups[g].x, mouse.last_y + groups[g].y);

					//randomize here
					groups[g].x += HELPER.getRandomInt(-random_power, random_power);
					groups[g].y += HELPER.getRandomInt(-random_power, random_power);
					if (groups[g].x < -gsize)
						groups[g].x = -gsize + random_power;
					if (groups[g].y < -gsize)
						groups[g].y = -gsize + random_power;
					if (groups[g].x > gsize)
						groups[g].x = gsize - random_power;
					if (groups[g].y > gsize)
						groups[g].y = gsize - random_power;

					canvas_active().lineTo(mouse.x + groups[g].x, mouse.y + groups[g].y);
					canvas_active().stroke();
				}
			}
		}
		else if (brush_type == 'Shaded') {
			if (type == 'click') {
				shaded_brush.init(canvas_active());
				shaded_brush.strokeStart(mouse.x, mouse.y);
			}
			else if (type == 'drag' && mouse.last_x != false && mouse.last_y != false) {
				var color_rgb = HELPER.hex2rgb(COLOR);
				canvas_active().strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
				canvas_active().lineWidth = 1;

				shaded_brush.stroke(color_rgb, mouse.x, mouse.y, GUI.action_data().attributes.size);
			}
		}
		else if (brush_type == 'Sketchy') {
			if (type == 'click') {
				sketchy_brush.init(canvas_active());
				sketchy_brush.strokeStart(mouse.x, mouse.y);
			}
			else if (type == 'drag' && mouse.last_x != false && mouse.last_y != false) {
				var color_rgb = HELPER.hex2rgb(COLOR);
				canvas_active().strokeStyle = "rgba(" + color_rgb.r + ", " + color_rgb.g + ", " + color_rgb.b + ", " + ALPHA / 255 + ")";
				canvas_active().lineWidth = 1;

				sketchy_brush.stroke(color_rgb, mouse.x, mouse.y, GUI.action_data().attributes.size);
			}
		}
	};
	this.gradient_tool = function (type, mouse, event) {
		if (mouse != undefined && mouse.valid == false && type != 'init')
			return true;
		var power = GUI.action_data().attributes.power;
		if (power > 99)
			power = 99;

		if (type == 'init') {
			POP.add({name: "param1", title: "Color #1:", value: '#000000', type: 'color'});
			POP.add({name: "param2", title: "Transparency #1:", value: '255', range: [0, 255]});
			POP.add({name: "param3", title: "Color #2:", value: '#ffffff', type: 'color'});
			POP.add({name: "param4", title: "Transparency #2:", value: '255', range: [0, 255]});
			POP.show(
				'Text', 
				function (user_response) {
					color1 = HELPER.hex2rgb(user_response.param1);
					color1.a = parseInt(user_response.param2);

					color2 = HELPER.hex2rgb(user_response.param3);
					color2.a = parseInt(user_response.param4);
				}
			);
		}
		else if (type == 'drag') {
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);

			if (GUI.action_data().attributes.radial == false) {
				//linear
				canvas_front.rect(0, 0, WIDTH, HEIGHT);
				
				var grd = canvas_front.createLinearGradient(
					mouse.click_x, mouse.click_y,
					mouse.x, mouse.y);
				
				grd.addColorStop(0, "rgba(" + color1.r + ", " + color1.g + ", " + color1.b + ", " + color1.a / 255 + ")");
				grd.addColorStop(1, "rgba(" + color2.r + ", " + color2.g + ", " + color2.b + ", " + color2.a / 255 + ")");
				canvas_front.fillStyle = grd;
				canvas_front.fill();
			}
			else {
				//radial
				var dist_x = mouse.click_x - mouse.x;
				var dist_y = mouse.click_y - mouse.y;
				var distance = Math.sqrt((dist_x * dist_x) + (dist_y * dist_y));
				var radgrad = canvas_front.createRadialGradient(
					mouse.click_x, mouse.click_y, distance * power / 100,
					mouse.click_x, mouse.click_y, distance);
				radgrad.addColorStop(0, "rgba(" + color1.r + ", " + color1.g + ", " + color1.b + ", " + color1.a / 255 + ")");
				radgrad.addColorStop(1, "rgba(" + color2.r + ", " + color2.g + ", " + color2.b + ", " + color2.a / 255 + ")");

				canvas_front.fillStyle = radgrad;
				canvas_front.fillRect(0, 0, WIDTH, HEIGHT);
			}
			//draw line
			canvas_front.beginPath();
			canvas_front.strokeStyle = "#ff0000";
			canvas_front.lineWidth = 1;
			var xx = mouse.x;
			var yy = mouse.y;
			canvas_front.moveTo(mouse.click_x + 0.5, mouse.click_y + 0.5);
			canvas_front.lineTo(xx + 0.5, yy + 0.5);
			canvas_front.stroke();
		}
		else if (type == 'release') {
			EDIT.save_state();
			if (GUI.action_data().attributes.radial == false) {
				//linear
				canvas_active().rect(0, 0, WIDTH, HEIGHT);
				var grd = canvas_active().createLinearGradient(
					mouse.click_x, mouse.click_y,
					mouse.x, mouse.y);
				
				grd.addColorStop(0, "rgba(" + color1.r + ", " + color1.g + ", " + color1.b + ", " + color1.a / 255 + ")");
				grd.addColorStop(1, "rgba(" + color2.r + ", " + color2.g + ", " + color2.b + ", " + color2.a / 255 + ")");
				canvas_active().fillStyle = grd;
				canvas_active().fill();
			}
			else {
				//radial
				var dist_x = mouse.click_x - mouse.x;
				var dist_y = mouse.click_y - mouse.y;
				var distance = Math.sqrt((dist_x * dist_x) + (dist_y * dist_y));
				var radgrad = canvas_active().createRadialGradient(
					mouse.click_x, mouse.click_y, distance * power / 100,
					mouse.click_x, mouse.click_y, distance);
				radgrad.addColorStop(0, "rgba(" + color1.r + ", " + color1.g + ", " + color1.b + ", " + color1.a / 255 + ")");
				radgrad.addColorStop(1, "rgba(" + color2.r + ", " + color2.g + ", " + color2.b + ", " + color2.a / 255 + ")");

				canvas_active().fillStyle = radgrad;
				canvas_active().fillRect(0, 0, WIDTH, HEIGHT);
			}
		}
	};
	this.blur_tool = function (type, mouse, event) {
		if (mouse.valid == false)
			return true;
		var size = GUI.action_data().attributes.size;
		var size_half = Math.round(size / 2);
		var xx = mouse.x - size / 2;
		var yy = mouse.y - size / 2;
		if (xx < 0)
			xx = 0;
		if (yy < 0)
			yy = 0;
		if (type == 'click') {
			EDIT.save_state();
			var param1 = GUI.action_data().attributes.power;
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.StackBlur(imageData, param1);	//add effect
			EL.image_round(canvas_active(), mouse.x, mouse.y, size, filtered, document.getElementById("canvas_front"));
			
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			EL.circle(canvas_front, mouse.x, mouse.y, size);
		}
		else if (type == 'drag') {
			var param1 = GUI.action_data().attributes.power;
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.StackBlur(imageData, param1);	//add effect
			EL.image_round(canvas_active(), mouse.x, mouse.y, size, filtered, document.getElementById("canvas_front"));
			
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			EL.circle(canvas_front, mouse.x, mouse.y, size);
		}
		else if (type == 'move') {
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			EL.circle(canvas_front, mouse.x, mouse.y, size);
		}
	};
	this.sharpen_tool = function (type, mouse, event) {
		if (mouse.valid == false)
			return true;
		var size = GUI.action_data().attributes.size;
		var param1 = 0.5;
		var xx = mouse.x - size / 2;
		var yy = mouse.y - size / 2;
		if (xx < 0)
			xx = 0;
		if (yy < 0)
			yy = 0;

		if (type == 'click') {
			EDIT.save_state();
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.Sharpen(imageData, param1);	//add effect
			EL.image_round(canvas_active(), mouse.x, mouse.y, size, filtered, document.getElementById("canvas_front"));
			
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			EL.circle(canvas_front, mouse.x, mouse.y, size);
		}
		else if (type == 'drag') {
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.Sharpen(imageData, param1);	//add effect
			EL.image_round(canvas_active(), mouse.x, mouse.y, size, filtered, document.getElementById("canvas_front"));
			
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			EL.circle(canvas_front, mouse.x, mouse.y, size);
		}
		else if (type == 'move') {
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			EL.circle(canvas_front, mouse.x, mouse.y, size);
		}
	};
	this.burn_dodge_tool = function (type, mouse, event) {
		if (mouse.valid == false)
			return true;
		var size = GUI.action_data().attributes.size;
		var power = GUI.action_data().attributes.power * 2.5;

		canvas_active().save();
		if (type == 'click') {
			EDIT.save_state();
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.save();
			EVENTS.clear_front_on_release = false;

			//init settings
			canvas_active().beginPath();
			canvas_active().lineWidth = GUI.action_data().attributes.size;
			canvas_active().lineCap = 'round';
			canvas_active().lineJoin = 'round';

			canvas_front.beginPath();
			if (GUI.action_data().attributes.burn == true)
				canvas_front.strokeStyle = "rgba(0, 0, 0, " + power / 255 + ")";
			else
				canvas_front.strokeStyle = "rgba(255, 255, 255, " + power / 255 + ")";
			canvas_front.lineWidth = GUI.action_data().attributes.size;
			canvas_front.lineCap = 'round';
			canvas_front.lineJoin = 'round';
		}
		else if (type == 'drag' && mouse.last_x != false && mouse.last_y != false) {
			//now draw preview
			canvas_front.beginPath();
			//clean from last line
			canvas_front.globalCompositeOperation = "destination-out";
			canvas_front.moveTo(mouse.last_x, mouse.last_y);
			canvas_front.lineTo(mouse.x, mouse.y);
			canvas_front.stroke();
			//reset
			canvas_front.globalCompositeOperation = "source-over";
			//draw new line segment
			canvas_front.moveTo(mouse.last_x, mouse.last_y);
			canvas_front.lineTo(mouse.x, mouse.y);
			canvas_front.stroke();
		}
		else if (type == 'release') {
			canvas_active().globalCompositeOperation = "soft-light";
			canvas_active().drawImage(document.getElementById("canvas_front"), 0, 0);
			canvas_active().globalCompositeOperation = "source-over";
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			EVENTS.clear_front_on_release = true;
			
			//if mouse was not moved
			if (mouse.click_x == mouse.x && mouse.click_y == mouse.y) {
				canvas_active().globalCompositeOperation = "soft-light";
				canvas_active().beginPath();
				canvas_active().arc(mouse.x, mouse.y, GUI.action_data().attributes.size / 2, 0, 2 * Math.PI, false);
				if (GUI.action_data().attributes.burn == true) {
					canvas_active().fillStyle = "rgba(0, 0, 0, " + power / 255 + ")";
				}
				else {
					canvas_active().fillStyle = "rgba(255, 255, 255, " + power / 255 + ")";
				}
				canvas_active().fill();
				canvas_active().globalCompositeOperation = "source-over";
			}
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.restore();
		}
		else if (type == 'move' && EVENTS.isDrag == false) {
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			EL.circle(canvas_front, mouse.x, mouse.y, size);
		}
		canvas_active().restore();
	};
	this.crop_tool = function (type, mouse, event) {
		if (mouse.click_valid == false)
			return true;
		
		if (type == 'drag') {
			if (mouse.x < 0)
				mouse.x = 0;
			if (mouse.y < 0)
				mouse.y = 0;
			if (mouse.x >= WIDTH)
				mouse.x = WIDTH;
			if (mouse.y >= HEIGHT)
				mouse.y = HEIGHT;
			if (mouse.click_x >= WIDTH)
				mouse.click_x = WIDTH;
			if (mouse.click_y >= HEIGHT)
				mouse.click_y = HEIGHT;
			if (this.select_square_action == '') {
				document.body.style.cursor = "crosshair";
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				canvas_front.fillStyle = "rgba(0, 255, 0, 0.3)";
				canvas_front.fillRect(mouse.click_x, mouse.click_y, mouse.x - mouse.click_x, mouse.y - mouse.click_y);
			}
		}
		else if (type == 'move' && this.select_data != false) {
			if (EVENTS.isDrag == true)
				return true;
			canvas_front.lineWidth = 1;
			border_size = 5;
			this.select_square_action = '';

			if (this.select_square_action == ''
				&& mouse.x > this.select_data.x && mouse.y > this.select_data.y
				&& mouse.x < this.select_data.x + this.select_data.w && mouse.y < this.select_data.y + this.select_data.h) {
				this.select_square_action = 'move';
				document.body.style.cursor = 'pointer';
			}
			if (this.select_square_action == '' && mouse.valid == true)
				document.body.style.cursor = "auto";
		}
		else if (type == 'release') {
			if (mouse.x < 0)
				mouse.x = 0;
			if (mouse.y < 0)
				mouse.y = 0;
			if (mouse.x >= WIDTH)
				mouse.x = WIDTH;
			if (mouse.y >= HEIGHT)
				mouse.y = HEIGHT;
			if (mouse.click_x >= WIDTH)
				mouse.click_x = WIDTH;
			if (mouse.click_y >= HEIGHT)
				mouse.click_y = HEIGHT;

			if (this.select_square_action == '') {
				if (mouse.x != mouse.click_x && mouse.y != mouse.click_y) {
					this.select_data = {
						x: Math.min(mouse.x, mouse.click_x),
						y: Math.min(mouse.y, mouse.click_y),
						w: Math.abs(mouse.x - mouse.click_x),
						h: Math.abs(mouse.y - mouse.click_y)
					};
				}
			}
			GUI.draw_selected_area(true);

			LAYER.update_info_block();
		}
		else if (type == 'click' && this.select_data != false) {
			document.body.style.cursor = "auto";
			if (mouse.x > this.select_data.x && mouse.y > this.select_data.y
				&& mouse.x < this.select_data.x + this.select_data.w && mouse.y < this.select_data.y + this.select_data.h) {
				EDIT.save_state();
				for (var i in LAYER.layers) {
					var layer = document.getElementById(LAYER.layers[i].name).getContext("2d");

					var tmp = layer.getImageData(this.select_data.x, this.select_data.y, this.select_data.w, this.select_data.h);
					layer.clearRect(0, 0, WIDTH, HEIGHT);
					layer.putImageData(tmp, 0, 0);
				}
				
				//resize
				WIDTH = this.select_data.w;
				HEIGHT = this.select_data.h;
				LAYER.set_canvas_size();

				EDIT.edit_clear();
			}
		}
	};
	this.clone_tool = function (type, mouse, event) {
		if (mouse.valid == false)
			return true;
		var size = GUI.action_data().attributes.size;
		var size_half = Math.round(size / 2);

		if (type == 'click') {
			EDIT.save_state();

			if (clone_data === false) {
				POP.add({html: 'Source is empty, right click on image first.'});
				POP.show('Error', '');
			}
			else {
				//draw rounded image
				EL.image_round(canvas_active(), mouse.x, mouse.y, size, clone_data, document.getElementById("canvas_front"), GUI.action_data().attributes.anti_aliasing);
			}
		}
		else if (type == 'right_click') {
			//save clone source
			clone_data = document.createElement("canvas");
			clone_data.width = size;
			clone_data.height = size;
			var xx = mouse.x - size_half;
			var yy = mouse.y - size_half;
			if (xx < 0)
				xx = 0;
			if (yy < 0)
				yy = 0;
			clone_data.getContext("2d").drawImage(canvas_active(true), xx, yy, size, size, 0, 0, size, size);
			return false;
		}
		else if (type == 'drag') {
			if (event.which == 3)
				return true;
			if (clone_data === false)
				return false;	//no source

			//draw rounded image
			EL.image_round(canvas_active(), mouse.x, mouse.y, size, clone_data, document.getElementById("canvas_front"), GUI.action_data().attributes.anti_aliasing);
		}
		else if (type == 'move') {
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			EL.circle(canvas_front, mouse.x, mouse.y, size);
		}
	};
	this.select_square = function (type, mouse, event) {
		if (mouse.click_valid == false)
			return true;
		if (type == 'drag') {
			if (mouse.x < 0)
				mouse.x = 0;
			if (mouse.y < 0)
				mouse.y = 0;
			if (mouse.x >= WIDTH)
				mouse.x = WIDTH;
			if (mouse.y >= HEIGHT)
				mouse.y = HEIGHT;
			if (mouse.click_x >= WIDTH)
				mouse.click_x = WIDTH;
			if (mouse.click_y >= HEIGHT)
				mouse.click_y = HEIGHT;
			if (this.select_square_action == '') {
				//user still selecting area
				document.body.style.cursor = "crosshair";
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				canvas_front.fillStyle = "rgba(0, 255, 0, 0.3)";
				canvas_front.fillRect(mouse.click_x, mouse.click_y, mouse.x - mouse.click_x, mouse.y - mouse.click_y);
			}
			else {
				//drag
				if (this.select_square_action == 'move') {
					//move
					try {
						canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
						canvas_front.drawImage(canvas_active(true),
							this.select_data.x, this.select_data.y, this.select_data.w, this.select_data.h,
							mouse.x - mouse.click_x + this.select_data.x,
							mouse.y - mouse.click_y + this.select_data.y,
							this.select_data.w,
							this.select_data.h);
						canvas_front.restore();
					}
					catch (err) {
						console.log("Error: " + err.message);
					}
				}
				else {
					//resize
					var s_x = this.select_data.x;
					var s_y = this.select_data.y;
					var d_x = this.select_data.w;
					var d_y = this.select_data.h;
					if (this.select_square_action == 'resize-left') {
						s_x += mouse.x - mouse.click_x;
						d_x -= mouse.x - mouse.click_x;
					}
					else if (this.select_square_action == 'resize-right')
						d_x += mouse.x - mouse.click_x;
					else if (this.select_square_action == 'resize-top') {
						s_y += mouse.y - mouse.click_y;
						d_y -= mouse.y - mouse.click_y;
					}
					else if (this.select_square_action == 'resize-bottom')
						d_y += mouse.y - mouse.click_y;
					else if (this.select_square_action == 'resize-1') {
						s_x += mouse.x - mouse.click_x;
						s_y += mouse.y - mouse.click_y;
						d_x -= mouse.x - mouse.click_x;
						d_y -= mouse.y - mouse.click_y;
					}
					else if (this.select_square_action == 'resize-2') {
						d_x += mouse.x - mouse.click_x;
						s_y += mouse.y - mouse.click_y;
						d_y -= mouse.y - mouse.click_y;
					}
					else if (this.select_square_action == 'resize-3') {
						d_x += mouse.x - mouse.click_x;
						d_y += mouse.y - mouse.click_y;
					}
					else if (this.select_square_action == 'resize-4') {
						s_x += mouse.x - mouse.click_x;
						d_x -= mouse.x - mouse.click_x;
						d_y += mouse.y - mouse.click_y;
					}
					var s_x = Math.max(s_x, 0);
					var s_y = Math.max(s_y, 0);
					var d_x = Math.max(d_x, 0);
					var d_y = Math.max(d_y, 0);

					canvas_front.save();
					canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
					
					canvas_front.webkitImageSmoothingEnabled = false;
					canvas_front.msImageSmoothingEnabled = false;
					canvas_front.imageSmoothingEnabled = false;
					
					canvas_front.drawImage(canvas_active(true),
						this.select_data.x, this.select_data.y, this.select_data.w, this.select_data.h,
						s_x, s_y, d_x, d_y);
					canvas_front.restore();
				}
			}
		}
		else if (type == 'move' && this.select_data != false) {
			if (EVENTS.isDrag == true)
				return true;
			canvas_front.lineWidth = 1;
			border_size = 5;
			this.select_square_action = '';
			var sr_size = Math.ceil(EVENTS.sr_size / GUI.ZOOM * 100);

			//left
			if (this.check_mouse_pos(this.select_data.x, this.select_data.y + this.select_data.h / 2, sr_size, mouse.x, mouse.y) == true) {
				document.body.style.cursor = "w-resize";
				this.select_square_action = 'resize-left';
			}
			//top
			else if (this.check_mouse_pos(this.select_data.x + this.select_data.w / 2, this.select_data.y, sr_size, mouse.x, mouse.y) == true) {
				document.body.style.cursor = "n-resize";
				this.select_square_action = 'resize-top';
			}
			//right
			else if (this.check_mouse_pos(this.select_data.x + this.select_data.w - sr_size, this.select_data.y + this.select_data.h / 2, sr_size, mouse.x, mouse.y) == true) {
				document.body.style.cursor = "w-resize";
				this.select_square_action = 'resize-right';
			}
			//bottom
			else if (this.check_mouse_pos(this.select_data.x + this.select_data.w / 2, this.select_data.y + this.select_data.h - sr_size, sr_size, mouse.x, mouse.y) == true) {
				document.body.style.cursor = "n-resize";
				this.select_square_action = 'resize-bottom';
			}

			//corner 1
			if (this.check_mouse_pos(this.select_data.x, this.select_data.y, sr_size, mouse.x, mouse.y) == true) {
				document.body.style.cursor = "nw-resize";
				this.select_square_action = 'resize-1';
			}
			//corner 2
			else if (this.check_mouse_pos(this.select_data.x + this.select_data.w - sr_size, this.select_data.y, sr_size, mouse.x, mouse.y) == true) {
				document.body.style.cursor = "ne-resize";
				this.select_square_action = 'resize-2';
			}
			//corner 3
			else if (this.check_mouse_pos(this.select_data.x + this.select_data.w - sr_size, this.select_data.y + this.select_data.h - sr_size, sr_size, mouse.x, mouse.y) == true) {
				document.body.style.cursor = "nw-resize";
				this.select_square_action = 'resize-3';
			}
			//corner 4
			else if (this.check_mouse_pos(this.select_data.x, this.select_data.y + this.select_data.h - sr_size, sr_size, mouse.x, mouse.y) == true) {
				document.body.style.cursor = "ne-resize";
				this.select_square_action = 'resize-4';
			}

			if (this.select_square_action == ''
				&& mouse.x > this.select_data.x && mouse.y > this.select_data.y
				&& mouse.x < this.select_data.x + this.select_data.w && mouse.y < this.select_data.y + this.select_data.h) {
				this.select_square_action = 'move';
				document.body.style.cursor = "move";
			}
			if (this.select_square_action == '' && mouse.valid == true)
				document.body.style.cursor = "auto";
		}
		else if (type == 'release') {
			if (mouse.x < 0)
				mouse.x = 0;
			if (mouse.y < 0)
				mouse.y = 0;
			if (mouse.x >= WIDTH)
				mouse.x = WIDTH;
			if (mouse.y >= HEIGHT)
				mouse.y = HEIGHT;
			if (mouse.click_x >= WIDTH)
				mouse.click_x = WIDTH;
			if (mouse.click_y >= HEIGHT)
				mouse.click_y = HEIGHT;

			if (this.select_square_action == '') {
				if (mouse.x != mouse.click_x && mouse.y != mouse.click_y) {
					this.select_data = {
						x: Math.min(mouse.x, mouse.click_x),
						y: Math.min(mouse.y, mouse.click_y),
						w: Math.abs(mouse.x - mouse.click_x),
						h: Math.abs(mouse.y - mouse.click_y)
					};
				}
			}
			else {
				if (mouse.x - mouse.click_x == 0 && mouse.y - mouse.click_y == 0)
					return false;				
				EDIT.save_state();
				
				if (this.select_square_action == 'move') {
					//move selected area
					if (this.select_data != false) {
						canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
						canvas_front.drawImage(canvas_active(true), 0, 0);
						canvas_active().clearRect(this.select_data.x, this.select_data.y, this.select_data.w, this.select_data.h);
						canvas_active().drawImage(
							document.getElementById("canvas_front"),
							this.select_data.x, this.select_data.y,
							this.select_data.w, this.select_data.h,
							mouse.x - mouse.click_x + this.select_data.x, mouse.y - mouse.click_y + this.select_data.y,
							this.select_data.w, this.select_data.h);
							
						canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
					}
					this.select_data.x += mouse.x - mouse.click_x;
					this.select_data.y += mouse.y - mouse.click_y;
				}
				else {
					//resize selected area
					var s_x = this.select_data.x;
					var s_y = this.select_data.y;
					var d_x = this.select_data.w;
					var d_y = this.select_data.h;

					if (this.select_square_action == 'resize-left') {
						s_x += mouse.x - mouse.click_x;
						d_x -= mouse.x - mouse.click_x;
					}
					else if (this.select_square_action == 'resize-right')
						d_x += mouse.x - mouse.click_x;
					else if (this.select_square_action == 'resize-top') {
						s_y += mouse.y - mouse.click_y;
						d_y -= mouse.y - mouse.click_y;
					}
					else if (this.select_square_action == 'resize-bottom')
						d_y += mouse.y - mouse.click_y;
					else if (this.select_square_action == 'resize-1') {
						s_x += mouse.x - mouse.click_x;
						s_y += mouse.y - mouse.click_y;
						d_x -= mouse.x - mouse.click_x;
						d_y -= mouse.y - mouse.click_y;
					}
					else if (this.select_square_action == 'resize-2') {
						d_x += mouse.x - mouse.click_x;
						s_y += mouse.y - mouse.click_y;
						d_y -= mouse.y - mouse.click_y;
					}
					else if (this.select_square_action == 'resize-3') {
						d_x += mouse.x - mouse.click_x;
						d_y += mouse.y - mouse.click_y;
					}
					else if (this.select_square_action == 'resize-4') {
						s_x += mouse.x - mouse.click_x;
						d_x -= mouse.x - mouse.click_x;
						d_y += mouse.y - mouse.click_y;
					}
					var s_x = Math.max(s_x, 0);
					var s_y = Math.max(s_y, 0);
					var d_x = Math.max(d_x, 0);
					var d_y = Math.max(d_y, 0);

					var tempCanvas = document.createElement("canvas");
					var tempCtx = tempCanvas.getContext("2d");
					tempCanvas.width = Math.max(d_x, this.select_data.w);
					tempCanvas.height = Math.max(d_y, this.select_data.h);
					tempCtx.drawImage(canvas_active(true), this.select_data.x, this.select_data.y, this.select_data.w, this.select_data.h, 0, 0, this.select_data.w, this.select_data.h);

					canvas_active().clearRect(s_x, s_y, d_x, d_y);
					canvas_active().drawImage(tempCanvas, 0, 0, this.select_data.w, this.select_data.h, s_x, s_y, d_x, d_y);

					this.select_data.x = s_x;
					this.select_data.y = s_y;
					this.select_data.w = d_x;
					this.select_data.h = d_y;
				}
			}
			GUI.draw_selected_area();
			LAYER.update_info_block();
		}
	};

	this.check_mouse_pos = function (x, y, size, mouse_x, mouse_y) {
		if (mouse_x > x - Math.round(size) && mouse_x < x + Math.round(size))
			if (mouse_y > y - Math.round(size) && mouse_y < y + Math.round(size))
				return true;
		return false;
	};
	
	this.bulge_pinch_tool = function (type, mouse, event) {
		if (mouse.valid == false)
			return true;
		
		//make sure FX lib loaded
		if(fx_filter == false){
			fx_filter = fx.canvas();
		}
		
		var strength = GUI.action_data().attributes.size / 100;
		if(strength > 1)
			strength = 1;
		var radius = GUI.action_data().attributes.radius;
		var bulge = GUI.action_data().attributes.bulge;
		if(bulge == false)
			strength = -1 * strength;

		if (type == 'click') {
			EDIT.save_state();
			
			var texture = fx_filter.texture(canvas_active(true));
			fx_filter.draw(texture).bulgePinch(mouse.x, mouse.y, radius, strength).update();	//effect
			canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
			canvas_active().drawImage(fx_filter, 0, 0);
			GUI.zoom();
		}
		if (type == 'move') {
			var texture = fx_filter.texture(canvas_active(true));
			fx_filter.draw(texture).bulgePinch(mouse.x, mouse.y, radius, strength).update();	//effect
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.drawImage(fx_filter, 0, 0);
		}
	};
}