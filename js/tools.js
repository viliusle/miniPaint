/* global POP, MAIN, SIFT, LAYER, IMAGE, EVENTS, HELPER, EDIT, GUI, EL */
/* global WIDTH, HEIGHT, COLOR, canvas_active */

var TOOLS = new TOOLS_CLASS();

/** 
 * manages various tools
 * 
 * @author ViliusL
 */
function TOOLS_CLASS() {

	//sprites
	this.tools_sprites = function () {
		POP.add({name: "param1", title: "Gap:", value: "50", values: ["0", "10", "50", "100"]});
		POP.add({name: "param2", title: "Width:", value: WIDTH});
		POP.show('Sprites', function (response) {
			EDIT.save_state();
			var param1 = parseInt(response.param1);
			var sprite_width = parseInt(response.param2);
			TOOLS.generate_sprites(param1, sprite_width);
		});
	};

	//show keypoints
	this.tools_keypoints = function () {
		SIFT.generate_keypoints(canvas_active(true), true);
	};

	//create panorama
	this.tools_panorama = function () {
		SIFT.panorama();
	};

	//extract alpha channel
	this.tools_color2alpha = function () {
		POP.add({name: "param1", title: "Color:", value: COLOR, type: 'color'});
		POP.show(
			'Color to alpha',
			function (user_response) {
				EDIT.save_state();
				var param1 = user_response.param1;
				TOOLS.convert_color_to_alpha(canvas_active(), WIDTH, HEIGHT, param1);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = user_response.param1;
				TOOLS.convert_color_to_alpha(canvas_preview, w, h, param1);
			}
		);
	};

	//expands colors
	this.tools_color_zoom = function () {
		POP.add({name: "param1", title: "Zoom:", value: "2", range: [2, 20], });
		POP.add({name: "param2", title: "Center:", value: "128", range: [0, 255]});
		POP.show(
			'Color Zoom',
			function (user_response) {
				EDIT.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);

				TOOLS.color_zoom(canvas_active(), WIDTH, HEIGHT, param1, param2);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);

				TOOLS.color_zoom(canvas_preview, w, h, param1, param2);
			}
		);
	};

	//recover alpha channel values
	this.tools_restore_alpha = function () {
		POP.add({name: "param", title: "Level:", value: "128", range: [0, 255]});
		POP.show(
			'Recover alpha',
			function (user_response) {
				EDIT.save_state();
				var param = parseInt(user_response.param);

				TOOLS.recover_alpha(canvas_active(), WIDTH, HEIGHT, param);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param = parseInt(user_response.param);

				TOOLS.recover_alpha(canvas_preview, w, h, param);
			}
		);
	};

	//adds borders
	this.tools_borders = function () {
		POP.add({name: "color", title: "Color:", value: COLOR, type: 'color'});
		POP.add({name: "shadow", title: "Shadow:", values: ["No", "Yes"]});
		POP.add({name: "size", title: "Size:", value: "5", range: [1, 100]});
		POP.show(
			'Borders',
			function (user_response) {
				EDIT.save_state();
				var color = user_response.color;
				var size = Math.round(WIDTH / 100 * user_response.size);
				var shadow = false;
				if(user_response.shadow == 'Yes')
					shadow = true;

				TOOLS.add_borders(canvas_active(), WIDTH, HEIGHT, color, size, shadow);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var color = user_response.color;
				var size = Math.round(w / 100 * user_response.size);
				var shadow = false;
				if(user_response.shadow == 'Yes')
					shadow = true;
				
				TOOLS.add_borders(canvas_preview, w, h, color, size, shadow);
			}
		);
	};
	
	this.generate_sprites = function (gap, sprite_width) {
		if (LAYER.layers.length == 1)
			return false;
		EDIT.save_state();
		LAYER.layer_add();
		var xx = 0;
		var yy = 0;
		var max_height = 0;
		var tmp = document.createElement("canvas");
		tmp.setAttribute('id', "tmp_canvas");
		tmp.width = sprite_width;
		tmp.height = HEIGHT;
		var W = sprite_width;
		var H = HEIGHT;
		
		//prepare width
		WIDTH = sprite_width;
		LAYER.set_canvas_size();
		
		for(var i = LAYER.layers.length-1; i >=0; i--){
			if (i == LAYER.layer_active)
				continue;	//end
			if (LAYER.layers[i].visible == false)
				continue;

			tmp.getContext("2d").clearRect(0, 0, W, H);
			tmp.getContext("2d").drawImage(document.getElementById(LAYER.layers[i].name), 0, 0);

			var trim_details = IMAGE.trim_info(tmp, false); //trim
			if (WIDTH == trim_details.left)
				continue; //empty layer
			var width = W - trim_details.left - trim_details.right;
			var height = H - trim_details.top - trim_details.bottom;

			if (xx + width > sprite_width) {
				xx = 0;
				yy += max_height;
				max_height = 0;
			}
			if (yy % gap > 0 && gap > 0)
				yy = yy - yy % gap + gap;
			if (yy + height > HEIGHT) {
				EVENTS.autosize = false;
				HEIGHT = yy + height;
				LAYER.set_canvas_size();
			}

			canvas_active().drawImage(tmp, trim_details.left, trim_details.top, width, height, xx, yy, width, height);
			xx += width;
			if (gap > 0)
				xx = xx - xx % gap + gap;

			if (height > max_height)
				max_height = height;
			if (xx > sprite_width) {
				xx = 0;
				yy += max_height;
				max_height = 0;
			}
		}
		
		//remove other layers
		for(var i = LAYER.layers.length-1; i >= 0; i--) {
			if (i == LAYER.layer_active)
				continue;
			LAYER.layer_remove(i, true);
		}
		LAYER.layer_renew();
	};
	
	this.convert_color_to_alpha = function (context, W, H, color) {
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		var back_color = HELPER.hex2rgb(color);

		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent

			//calculate difference from requested color, and change alpha
			var diff = Math.abs(imgData[i] - back_color.r) + Math.abs(imgData[i + 1] - back_color.g) + Math.abs(imgData[i + 2] - back_color.b) / 3;
			imgData[i + 3] = Math.round(diff);

			//combining 2 layers in future will change colors, so make changes to get same colors in final image
			//color_result = color_1 * (alpha_1 / 255) * (1 - A2 / 255) + color_2 * (alpha_2 / 255)
			//color_2 = (color_result - color_1 * (alpha_1 / 255) * (1 - A2 / 255)) / (alpha_2 / 255)
			imgData[i] = Math.ceil((imgData[i] - back_color.r * (1 - imgData[i + 3] / 255)) / (imgData[i + 3] / 255));
			imgData[i + 1] = Math.ceil((imgData[i + 1] - back_color.g * (1 - imgData[i + 3] / 255)) / (imgData[i + 3] / 255));
			imgData[i + 2] = Math.ceil((imgData[i + 2] - back_color.b * (1 - imgData[i + 3] / 255)) / (imgData[i + 3] / 255));
		}
		context.putImageData(img, 0, 0);
	};
	
	this.color_zoom = function (context, W, H, zoom, center) {
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		var grey;
		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent

			grey = Math.round(0.2126 * imgData[i] + 0.7152 * imgData[i + 1] + 0.0722 * imgData[i + 2]);

			for (var j = 0; j < 3; j++) {
				var k = i + j;
				if (grey > center)
					imgData[k] += (imgData[k] - center) * zoom;
				else if (grey < center)
					imgData[k] -= (center - imgData[k]) * zoom;
				if (imgData[k] < 0)
					imgData[k] = 0;
				if (imgData[k] > 255)
					imgData[k] = 255;
			}
		}
		context.putImageData(img, 0, 0);
	};
	
	this.recover_alpha = function (context, W, H, level) {
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		var tmp;
		level = parseInt(level);
		for (var i = 0; i < imgData.length; i += 4) {
			tmp = imgData[i + 3] + level;
			if (tmp > 255)
				tmp = 255;
			imgData[i + 3] = tmp;
		}
		context.putImageData(img, 0, 0);
	};
	
	this.add_borders = function (context, W, H, color, size, shadow) {
		context.save();
		if(shadow == true){
			//with shadow
			context.beginPath();
			context.lineWidth = size;
			context.strokeStyle = 'green';
			context.shadowColor = color;
			context.shadowBlur = size/2;
			context.rect(-size/2, -size/2, W+size, H+size);
			context.stroke();
			context.stroke();
			context.stroke();
			context.stroke();
			context.stroke();			
		}
		else{
			context.strokeStyle = color;
			context.lineWidth = size;
			EL.rectangle(context, 0, 0, W-1, H-1, false, true);
		}
		context.restore();
	};
	
	this.tools_replace_color = function(){
		POP.add({name: "target", title: "Target:", value: COLOR, type: 'color'});
		POP.add({name: "repalcement", title: "Replacement:", value: '#ff0000', type: 'color'});
		POP.add({name: "power", title: "Power:", value: "20", range: [0, 255]});
		POP.add({name: "alpha", title: "Alpha:", value: "255", range: [0, 255]});
		POP.add({name: "mode", title: "Mode:", values: ['Advanced', 'Simple']});
		POP.show(
			'Replace color',
			function (user_response) {
				EDIT.save_state();
				var target = user_response.target;
				var repalcement = user_response.repalcement;
				var power = user_response.power;
				var alpha = user_response.alpha;
				var advanced_mode = true;
				if(user_response.mode == 'Simple')
					advanced_mode = false;
				
				TOOLS.replace_color_process(canvas_active(), WIDTH, HEIGHT, target, repalcement, power, alpha, advanced_mode);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var target = user_response.target;
				var repalcement = user_response.repalcement;
				var power = user_response.power;
				var alpha = user_response.alpha;
				var advanced_mode = true;
				if(user_response.mode == 'Simple')
					advanced_mode = false;
				
				TOOLS.replace_color_process(canvas_preview, w, h, target, repalcement, power, alpha, advanced_mode);
			}
		);
	};
	
	this.replace_color_process = function(context, W, H, target, replacement, power, alpha, advanced_mode){
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		var target_rgb = HELPER.hex2rgb(target);
		var target_hsl = HELPER.rgbToHsl(target_rgb.r, target_rgb.g, target_rgb.b);
		var target_normalized = HELPER.hslToRgb(target_hsl[0], target_hsl[1], 0.5);
		
		var replacement_rgb = HELPER.hex2rgb(replacement);
		var replacement_hsl = HELPER.rgbToHsl(replacement_rgb.r, replacement_rgb.g, replacement_rgb.b);
		
		for (var i = 0; i < imgData.length; i += 4) {
			if (imgData[i + 3] == 0)
				continue;	//transparent

			if(advanced_mode == false){
				//simple replace
				
				//calculate difference from requested color, and change alpha
				var diff = (Math.abs(imgData[i] - target_rgb.r) + Math.abs(imgData[i + 1] - target_rgb.g) + Math.abs(imgData[i + 2] - target_rgb.b) ) / 3;
				if(diff > power)
					continue;
				
				imgData[i] = replacement_rgb.r;
				imgData[i + 1] = replacement_rgb.g;
				imgData[i + 2] = replacement_rgb.b;
				if(alpha < 255)
					imgData[i + 3] = alpha;
			}
			else{
				//advanced replace using HSL
				
				var hsl = HELPER.rgbToHsl(imgData[i], imgData[i+1], imgData[i+2]);
				var normalized = HELPER.hslToRgb(hsl[0], hsl[1], 0.5);
				var diff = (Math.abs(normalized[0] - target_normalized[0]) + Math.abs(normalized[1] - target_normalized[1]) + Math.abs(normalized[2] - target_normalized[2]) ) / 3;
				if(diff > power)
					continue;
				
				//change to new color with exiting luminance
				var replacement_normalized = HELPER.hslToRgb(replacement_hsl[0], replacement_hsl[1], hsl[2] * (replacement_hsl[2]*255) / 120);
				
				imgData[i] = replacement_normalized[0];
				imgData[i + 1] = replacement_normalized[1];
				imgData[i + 2] = replacement_normalized[2];
				if(alpha < 255)
					imgData[i + 3] = alpha;
			}
		}
		context.putImageData(img, 0, 0);
	};
}