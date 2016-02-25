/* global EVENTS, HELPER, POP, DRAW, LAYER, EL */
/* global WIDTH, HEIGHT, canvas_front, DRAW_TOOLS_CONFIG, canvas_grid, canvas_preview */

var GUI = new GUI_CLASS();

/**
 * manages grapchic interface functionality: left/right sidebar actions
 * 
 * @author ViliusL
 */
function GUI_CLASS() {
	
	/**
	 * preview mini window size on right sidebar
	 */
	this.PREVIEW_SIZE = {w: 148, h: 100};
	
	/**
	 * last used menu id
	 */
	this.last_menu = '';
	
	/**
	 * grid dimnesions config
	 */
	this.grid_size = [50, 50];
	
	/**
	 * if grid is visible
	 */
	this.grid = false;
	
	/**
	 * true if using transparecy, false if using white background
	 */
	this.TRANSPARENCY = true;
	
	/**
	 * zoom level, original - 100%, can vary from 10% to 1000%
	 */
	this.ZOOM = 100;
	
	/**
	 * last color copy
	 */
	var COLOR_copy;
	
	this.draw_helpers = function () {
		//left menu
		var html = '';
		for (var i in DRAW_TOOLS_CONFIG) {
			html += '<a title="' + DRAW_TOOLS_CONFIG[i].title + '"';
			html += ' style="background: #989898 url(\'img/' + DRAW_TOOLS_CONFIG[i].icon[0] + '\') no-repeat ' + DRAW_TOOLS_CONFIG[i].icon[1] + 'px ' + DRAW_TOOLS_CONFIG[i].icon[2] + 'px;"';
			if (DRAW_TOOLS_CONFIG[i].name == DRAW.active_tool)
				html += ' class="active"';
			html += ' onclick="return GUI.action(\'' + DRAW_TOOLS_CONFIG[i].name + '\');"';
			html += ' id="' + DRAW_TOOLS_CONFIG[i].name + '"';
			html += ' href="#"></a>' + "\n";
		}
		document.getElementById("menu_left_container").innerHTML = html;

		//draw colors
		var html = '';
		var colors_data = [
			['#ff0000', '#ff5b31', '#ffa500', '#ff007f', '#ff00ff'], //red
			['#00ff00', '#008000', '#7fff00', '#00ff7f', '#8ac273'], //green
			['#0000ff', '#007fff', '#37629c', '#000080', '#8000ff'], //blue
			['#ffff00', '#ffff80', '#ddd06a', '#808000', '#bcb88a'], //yellow
			['#ffffff', '#c0c0c0', '#808080', '#404040', '#000000']	//grey
		];
		for (var i in colors_data) {
			for (var j in colors_data[i]) {
				html += '<div style="background-color:' + colors_data[i][j] + ';" class="mini-color" onclick="GUI.set_color(this);"></div>' + "\n";
			}
			html += '<div style="clear:both;"></div>' + "\n";
		}
		document.getElementById("all_colors").innerHTML = html;
	};
	
	this.draw_background = function (canvas, W, H, gap, force) {
		if (this.TRANSPARENCY == false && force == undefined) {
			canvas.beginPath();
			canvas.rect(0, 0, W, H);
			canvas.fillStyle = "#ffffff";
			canvas.fill();
			return false;
		}
		if (gap == undefined)
			gap = 10;
		var fill = true;
		for (var i = 0; i < W; i = i + gap) {
			if (i % (gap * 2) == 0)
				fill = true;
			else
				fill = false;
			for (var j = 0; j < H; j = j + gap) {
				if (fill == true) {
					canvas.fillStyle = '#eeeeee';
					canvas.fillRect(i, j, gap, gap);
					fill = false;
				}
				else
					fill = true;
			}
		}
	};
	
	this.draw_grid = function (gap_x, gap_y) {
		if (this.grid == false) {
			document.getElementById("canvas_grid").style.display = 'none';
			return false;
		}
		else {
			document.getElementById("canvas_grid").style.display = '';
			canvas_grid.clearRect(0, 0, WIDTH, HEIGHT);
		}

		//size
		if (gap_x != undefined && gap_y != undefined)
			this.grid_size = [gap_x, gap_y];
		else {
			gap_x = this.grid_size[0];
			gap_y = this.grid_size[1];
		}
		gap_x = parseInt(gap_x);
		gap_y = parseInt(gap_y);
		if (gap_x < 2)
			gap_x = 2;
		if (gap_y < 2)
			gap_y = 2;
		for (var i = gap_x; i < WIDTH; i = i + gap_x) {
			if (gap_x == 0)
				break;
			if (i % (gap_x * 5) == 0)	//main lines
				canvas_grid.strokeStyle = '#222222';
			else {
				EL.line_dashed(canvas_grid, i, 0, i, HEIGHT, 3, '#888888');
				continue;
			}
			canvas_grid.beginPath();
			canvas_grid.moveTo(0.5 + i, 0);
			canvas_grid.lineTo(0.5 + i, HEIGHT);
			canvas_grid.stroke();
		}
		for (var i = gap_y; i < HEIGHT; i = i + gap_y) {
			if (gap_y == 0)
				break;
			if (i % (gap_y * 5) == 0)	//main lines
				canvas_grid.strokeStyle = '#222222';
			else {
				EL.line_dashed(canvas_grid, 0, i, WIDTH, i, 3, '#888888');
				continue;
			}
			canvas_grid.beginPath();
			canvas_grid.moveTo(0, 0.5 + i);
			canvas_grid.lineTo(WIDTH, 0.5 + i);
			canvas_grid.stroke();
		}
	};
	this.redraw_preview = function () {
		canvas_preview.beginPath();
		canvas_preview.rect(0, 0, GUI.PREVIEW_SIZE.w, GUI.PREVIEW_SIZE.h);
		canvas_preview.fillStyle = "#ffffff";
		canvas_preview.fill();
		this.draw_background(canvas_preview, GUI.PREVIEW_SIZE.w, GUI.PREVIEW_SIZE.h, 5);

		//redraw preview area
		canvas_preview.save();
		canvas_preview.scale(GUI.PREVIEW_SIZE.w / WIDTH, GUI.PREVIEW_SIZE.h / HEIGHT);
		for (var i in LAYER.layers) {
			if (LAYER.layers[i].visible == false)
				continue;
			canvas_preview.drawImage(document.getElementById(LAYER.layers[i].name), 0, 0, WIDTH, HEIGHT);
		}
		canvas_preview.restore();

		//active zone
		z_x = EVENTS.ZOOM_POS[0];
		z_y = EVENTS.ZOOM_POS[1];
		
		if (z_x > GUI.PREVIEW_SIZE.w - EVENTS.mini_rect_data.w - 1)
			z_x = GUI.PREVIEW_SIZE.w - EVENTS.mini_rect_data.w - 1;
		if (z_y > GUI.PREVIEW_SIZE.h - EVENTS.mini_rect_data.h - 1)
			z_y = GUI.PREVIEW_SIZE.h - EVENTS.mini_rect_data.h - 1;

		canvas_preview.lineWidth = 1;
		canvas_preview.beginPath();
		canvas_preview.rect(Math.round(z_x) + 0.5, Math.round(z_y) + 0.5, EVENTS.mini_rect_data.w, EVENTS.mini_rect_data.h);
		canvas_preview.fillStyle = "rgba(0, 0, 0, 0.2)";
		canvas_preview.strokeStyle = "#393939";
		canvas_preview.fill();
		canvas_preview.stroke();
		return true;
	};
	this.zoom = function (recalc, scroll) {
		if (recalc != undefined) {
			//zoom-in or zoom-out
			if (recalc == 1 || recalc == -1) {
				var step = 100;
				if (this.ZOOM <= 100 && recalc < 0)
					step = 10;
				if (this.ZOOM < 100 && recalc > 0)
					step = 10;
				if (recalc * step + this.ZOOM > 0) {
					this.ZOOM = this.ZOOM + recalc * step;
					if (this.ZOOM > 100 && this.ZOOM < 200)
						this.ZOOM = 100;
				}
			}
			//zoom using exact value
			else
				this.ZOOM = parseInt(recalc);
			EVENTS.calc_preview_auto();
		}
		document.getElementById("zoom_nr").innerHTML = this.ZOOM;
		document.getElementById("zoom_range").value = this.ZOOM;

		//change scale and repaint
		document.getElementById('canvas_back').style.width = Math.round(WIDTH * this.ZOOM / 100) + "px";
		document.getElementById('canvas_back').style.height = Math.round(HEIGHT * this.ZOOM / 100) + "px";
		for (var i in LAYER.layers) {
			document.getElementById(LAYER.layers[i].name).style.width = Math.round(WIDTH * this.ZOOM / 100) + "px";
			document.getElementById(LAYER.layers[i].name).style.height = Math.round(HEIGHT * this.ZOOM / 100) + "px";
		}
		document.getElementById('canvas_front').style.width = Math.round(WIDTH * this.ZOOM / 100) + "px";
		document.getElementById('canvas_front').style.height = Math.round(HEIGHT * this.ZOOM / 100) + "px";

		document.getElementById('canvas_grid').style.width = Math.round(WIDTH * this.ZOOM / 100) + "px";
		document.getElementById('canvas_grid').style.height = Math.round(HEIGHT * this.ZOOM / 100) + "px";

		//check main resize corners
		if (this.ZOOM != 100) {
			document.getElementById('resize-w').style.display = "none";
			document.getElementById('resize-h').style.display = "none";
			document.getElementById('resize-wh').style.display = "none";
		}
		else {
			document.getElementById('resize-w').style.display = "block";
			document.getElementById('resize-h').style.display = "block";
			document.getElementById('resize-wh').style.display = "block";
		}

		if (scroll != undefined)
			EVENTS.scroll_window();
		this.redraw_preview();
		return true;
	};
	
	this.update_attribute = function (object, next_value) {
		var max_value = 500;
		for (var k in this.action_data().attributes) {
			if (k != object.id)
				continue;
			if (this.action_data().attributes[k] === true || this.action_data().attributes[k] === false) {
				//true / false
				var value;
				if (next_value == 0)
					value = true;
				else
					value = false;
				//save
				this.action_data().attributes[k] = value;
				this.show_action_attributes();
			}
			else if (typeof this.action_data().attributes[k] == 'object') {
				//select
				var key = k.replace("_values", "");
				this.action_data().attributes[key] = object.value;
			}
			else if (this.action_data().attributes[k][0] == '#') {
				//color
				var key = k.replace("_values", "");
				this.action_data().attributes[key] = object.value;
			}
			else {
				//numbers
				if (next_value != undefined) {
					if (next_value > 0) {
						if (parseInt(this.action_data().attributes[k]) == 0)
							object.value = 1;
						else if (parseInt(this.action_data().attributes[k]) == 1)
							object.value = 5;
						else if (parseInt(this.action_data().attributes[k]) == 5)
							object.value = 10;
						else
							object.value = parseInt(this.action_data().attributes[k]) + next_value;
					}
					else if (next_value < 0) {
						if (parseInt(this.action_data().attributes[k]) == 1)
							object.value = 0;
						else if (parseInt(this.action_data().attributes[k]) <= 5)
							object.value = 1;
						else if (parseInt(this.action_data().attributes[k]) <= 10)
							object.value = 5;
						else if (parseInt(this.action_data().attributes[k]) <= 20)
							object.value = 10;
						else
							object.value = parseInt(this.action_data().attributes[k]) + next_value;
					}

					if (object.value < 0)
						object.value = 0;
					if (object.value > max_value)
						object.value = max_value;
				}
				else {
					if (object.value.length == 0)
						return false;
					object.value = parseInt(object.value);
					object.value = Math.abs(object.value);
					if (object.value == 0 || isNaN(object.value) || value > max_value)
						object.value = this.action_data().attributes[k];
				}
				if (k == 'power' && object.value > 100)
					object.value = 100;

				//save
				this.action_data().attributes[k] = object.value;

				document.getElementById(k).value = object.value;
			}
			if (this.action_data().on_update != undefined)
				DRAW[this.action_data().on_update](object.value);
		}
	};
	
	this.action = function (key) {
		DRAW[key]('init', {valid: true});
		if (DRAW.active_tool == key)
			return false;

		//change
		if (DRAW.active_tool != '')
			document.getElementById(DRAW.active_tool).className = "";
		DRAW.active_tool = key;
		document.getElementById(key).className = "active";
		this.show_action_attributes();

		return false;
	};
	
	this.action_data = function () {
		for (var i in DRAW_TOOLS_CONFIG) {
			if (DRAW_TOOLS_CONFIG[i].name == DRAW.active_tool)
				return DRAW_TOOLS_CONFIG[i];
		}
	};
	
	this.show_action_attributes = function () {
		html = '';
		var step = 10;
		for (var k in this.action_data().attributes) {
			var title = k[0].toUpperCase() + k.slice(1);
			title = title.replace("_", " ");
			if (this.action_data().attributes[k + "_values"] != undefined)
				continue;
			if (this.action_data().attributes[k] === true || this.action_data().attributes[k] === false) {
				//true / false
				if (this.action_data().attributes[k] == true)
					html += '<div onclick="GUI.update_attribute(this, 1)" style="background-color:#5680c1;" class="attribute-area" id="' + k + '">' + title + '</div>';
				else
					html += '<div onclick="GUI.update_attribute(this, 0)" class="attribute-area" id="' + k + '">' + title + '</div>';
			}
			else if (typeof GUI.action_data().attributes[k] == 'object') {
				//drop down select
				html += '<select style="font-size:11px;margin-bottom:10px;" onchange="GUI.update_attribute(this);" id="' + k + '">';
				for (var j in GUI.action_data().attributes[k]) {
					var sel = '';
					var key = k.replace("_values", "");
					if (GUI.action_data().attributes[key] == GUI.action_data().attributes[k][j])
						sel = 'selected="selected"';
					html += '<option ' + sel + ' name="' + GUI.action_data().attributes[k][j] + '">' + GUI.action_data().attributes[k][j] + '</option>';
				}
				html += '</select>';
			}
			else if (GUI.action_data().attributes[k][0] == '#') {
				//color
				html += '<table style="width:100%;">';	//table for 100% width
				html += '<tr>';
				html += '<td style="font-weight:bold;width:45px;">' + title + ':</td>';
				html += '<td><input onchange="GUI.update_attribute(this);" type="color" id="' + k + '" value="' + GUI.action_data().attributes[k] + '" /></td>';
				html += '</tr>';
				html += '</table>';
			}
			else {
				//numbers
				html += '<div id="' + k + '_container">';
				html += '<table style="width:100%;">';	//table for 100% width
				html += '<tr>';
				html += '<td style="font-weight:bold;padding-right:2px;white-space:nowrap;">' + title + ':</td>';
				html += '<td><input onKeyUp="GUI.update_attribute(this);" type="text" id="' + k + '" value="' + GUI.action_data().attributes[k] + '" /></td>';
				html += '</tr>';
				html += '</table>';
				html += '<div style="float:left;width:32px;" onclick="GUI.update_attribute(this, ' + (step) + ')" class="attribute-area" id="' + k + '">+</div>';
				html += '<div style="margin-left:48px;margin-bottom:15px;" onclick="GUI.update_attribute(this, ' + (-step) + ')" class="attribute-area" id="' + k + '">-</div>';
				html += '</div>';
			}
		}
		document.getElementById("action_attributes").innerHTML = html;
	};
	
	this.set_color = function (object) {
		if (HELPER.chech_input_color_support('main_colour') == true && object.id == 'main_colour')
			COLOR = object.value;
		else
			COLOR = HELPER.rgb2hex_all(object.style.backgroundColor);
		COLOR_copy = COLOR;

		if (HELPER.chech_input_color_support('main_colour') == true)
			document.getElementById("main_colour").value = COLOR; //supported
		else
			document.getElementById("main_colour_alt").style.backgroundColor = COLOR; //not supported

		document.getElementById("color_hex").value = COLOR;
		var colours = HELPER.hex2rgb(COLOR);
		document.getElementById("rgb_r").value = colours.r;
		document.getElementById("rgb_g").value = colours.g;
		document.getElementById("rgb_b").value = colours.b;
	};
	
	this.set_color_manual = function (event) {
		var object = event.target;
		if (object.value.length == 6 && object.value[0] != '#') {
			COLOR = '#' + object.value;
			this.sync_colors();
		}
		if (object.value.length == 7) {
			COLOR = object.value;
			this.sync_colors();
		}
		else if (object.value.length > 7)
			object.value = COLOR;
	};
	
	this.set_color_rgb = function (object, c) {
		var colours = HELPER.hex2rgb(COLOR);
		if (object.value.length > 3) {
			object.value = colours[c];
		}
		else if (object.value.length > 0) {
			value = object.value;
			value = parseInt(value);
			if (isNaN(value) || value != object.value || value > 255 || value < 0) {
				object.value = colours[c];
				return false;
			}
			COLOR = "#" + ("000000" + HELPER.rgbToHex(document.getElementById("rgb_r").value, document.getElementById("rgb_g").value, document.getElementById("rgb_b").value)).slice(-6);
			ALPHA = document.getElementById("rgb_a").value;
			document.getElementById("rgb_a").value = ALPHA;
			this.sync_colors();
		}
	};
	
	this.sync_colors = function () {
		document.getElementById("color_hex").value = COLOR;

		if (HELPER.chech_input_color_support('main_colour') == true)
			document.getElementById("main_colour").value = COLOR; //supported
		else
			document.getElementById("main_colour_alt").style.backgroundColor = COLOR; //not supported

		var colours = HELPER.hex2rgb(COLOR);
		document.getElementById("rgb_r").value = colours.r;
		document.getElementById("rgb_g").value = colours.g;
		document.getElementById("rgb_b").value = colours.b;
	};
	
	this.toggle_color_select = function () {
		if (POP.active == false) {
			POP.add({
				title: 'Colour:', 
				function: function () {
					COLOR_copy = COLOR;
					var html = '<canvas style="position:relative;margin-bottom:5px;" id="c_all" width="300" height="300"></canvas>';
					html += '<table>';
					html += '<tr>';
					html += '	<td><b>Lum:</b></td>';
					html += '	<td><input id="lum_ranger" oninput="GUI.change_lum(this.value);document.getElementById(\'lum_preview\').innerHTML=this.value;" type="range" value="0" min="-255" max="255" step="1"></td>';
					html += '	<td style="padding-left:10px;width:30px;" id="lum_preview">0</td>';
					html += '</tr>';
					html += '<tr>';
					html += '	<td><b>Alpha:</b></td>';
					html += '	<td><input oninput="GUI.change_alpha(this.value);document.getElementById(\'alpha_preview\').innerHTML=this.value;" type="range" value="' + ALPHA + '" min="0" max="255" step="1"></td>';
					html += '	<td style="padding-left:10px;" id="alpha_preview">' + ALPHA + '</td></tr>';
					html += '</tr>';
					html += '</table>';
					return html;
				}
			});
			POP.show(
				'Select color', 
				function (user_response) {
					var param1 = parseInt(user_response.param1);
				},
				undefined,
				this.toggle_color_select_onload
			);
		}
		else{
			POP.hide();
		}
	};
	
	this.change_lum = function (lumi) {
		lumi = parseInt(lumi);
		var c3 = HELPER.hex2rgb(COLOR_copy);
		c3.r += lumi;
		c3.g += lumi;
		c3.b += lumi;

		if (c3.r < 0)
			c3.r = 0;
		if (c3.g < 0)
			c3.g = 0;
		if (c3.b < 0)
			c3.b = 0;
		if (c3.r > 255)
			c3.r = 255;
		if (c3.g > 255)
			c3.g = 255;
		if (c3.b > 255)
			c3.b = 255;

		COLOR = "#" + ("000000" + HELPER.rgbToHex(c3.r, c3.g, c3.b)).slice(-6);
		this.sync_colors();
	};
	
	this.change_alpha = function (value) {
		ALPHA = parseInt(value);
		document.getElementById("rgb_a").value = ALPHA;
	};
	
	this.toggle_color_select_onload = function () {
		var img = new Image();
		img.onload = function () {
			document.getElementById("c_all").getContext("2d").drawImage(img, 0, 0);
			document.getElementById("c_all").onmousedown = function (event) {
				if (event.offsetX) {
					mouse_x = event.offsetX;
					mouse_y = event.offsetY;
				}
				else if (event.layerX) {
					mouse_x = event.layerX;
					mouse_y = event.layerY;
				}
				var c = document.getElementById("c_all").getContext("2d").getImageData(mouse_x, mouse_y, 1, 1).data;
				COLOR = "#" + ("000000" + HELPER.rgbToHex(c[0], c[1], c[2])).slice(-6);
				this.sync_colors();
				COLOR_copy = COLOR;
				document.getElementById("lum_ranger").value = 0;
			};
		};
		img.src = 'img/colorwheel.png';
	};
	
	this.draw_selected_area = function (no_resize) {
		if (DRAW.select_data == false)
			return false;
		//draw area
		canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
		var x = DRAW.select_data.x;
		var y = DRAW.select_data.y;
		var w = DRAW.select_data.w;
		var h = DRAW.select_data.h;
		if (this.ZOOM != 100) {
			x = Math.round(x);
			y = Math.round(y);
			w = Math.round(w);
			h = Math.round(h);
		}

		//fill
		canvas_front.fillStyle = "rgba(0, 255, 0, 0.3)";
		canvas_front.fillRect(x, y, w, h);
		if (this.ZOOM <= 100) {
			//borders
			canvas_front.strokeStyle = "rgba(0, 255, 0, 1)";
			canvas_front.lineWidth = 1;
			canvas_front.strokeRect(x + 0.5, y + 0.5, w, h);
		}
		if (no_resize == true)
			return true;

		//draw carners
		square(x, y, 0, 0);
		square(x + w, y, -1, 0);
		square(x, y + h, 0, -1);
		square(x + w, y + h, -1, -1);

		//draw centers
		square(x + w / 2, y, 0, 0);
		square(x, y + h / 2, 0, 0);
		square(x + w / 2, y + h, 0, -1);
		square(x + w, y + h / 2, -1, 0);

		function square(x, y, mx, my) {
			var sr_size = Math.ceil(EVENTS.sr_size / this.ZOOM * 100);
			x = Math.round(x);
			y = Math.round(y);
			canvas_front.beginPath();
			canvas_front.rect(x + mx * Math.round(sr_size), y + my * Math.round(sr_size), sr_size, sr_size);
			canvas_front.fillStyle = "#0000ff";
			canvas_front.fill();
		}
	};

}
