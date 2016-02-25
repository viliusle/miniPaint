/* global POP, MAIN, SIFT, LAYER, IMAGE, EVENTS, HELPER, EDIT, GUI */
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
		POP.add({name: "param1", title: "Offset:", value: "50", values: ["0", "10", "50", "100"]});
		POP.show('Sprites', function (response) {
			EDIT.save_state();
			var param1 = parseInt(response.param1);
			TOOLS.generate_sprites(param1);
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
		POP.add({name: "param1", title: "Color:", value: COLOR, type: 'color'});
		POP.add({name: "param2", title: "Size:", value: "5", range: [1, 100]});
		POP.show(
			'Borders',
			function (user_response) {
				EDIT.save_state();
				var param1 = user_response.param1;
				var param2 = parseInt(user_response.param2);

				LAYER.add_layer();
				TOOLS.add_borders(canvas_active(), WIDTH, HEIGHT, param1, param2);
				GUI.zoom();
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = user_response.param1;
				var param2 = parseInt(user_response.param2);

				TOOLS.add_borders(canvas_preview, w, h, param1, param2);
			}
		);
	};
	
	this.generate_sprites = function (gap) {
		if (LAYER.layers.length == 1)
			return false;
		EDIT.save_state();
		LAYER.layer_add();
		var xx = 0;
		var yy = 0;
		var max_height = 0;
		var tmp = document.createElement("canvas");
		tmp.setAttribute('id', "tmp_canvas");
		tmp.width = WIDTH;
		tmp.height = HEIGHT;
		var W = WIDTH;
		var H = HEIGHT;
		for (var i in LAYER.layers) {
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

			if (xx + width > WIDTH) {
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
			if (xx > WIDTH) {
				xx = 0;
				yy += max_height;
				max_height = 0;
			}
		}
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
	
	this.add_borders = function (context, W, H, color, size) {
		context.strokeStyle = color;
		context.lineWidth = size;
		HELPER.roundRect(context, 0 + 0.5, 0 + 0.5, W - 1, H - 1, 0, false, true);
	};
}