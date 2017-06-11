/* global HELPER, POP, MAIN, EVENTS, LAYER, IMAGE, DRAW, EDIT, GUI */
/* global WIDTH, HEIGHT, canvas_front, canvas_back */

var LAYER = new LAYER_CLASS();

/**
 * layers class - manages layers
 * 
 * @author ViliusL
 */
function LAYER_CLASS() {
	
	/**
	 * active layer index
	 */
	this.layer_active = 0;
	
	/**
	 * data layers array
	 */
	this.layers = [];
	
	/**
	 * latest layer index
	 */
	var layer_max_index = 0;

	//new layer
	this.layer_new = function () {
		EDIT.save_state();
		this.layer_add();
	};
	
	//remaps layer at different position
	this.layer_translate = function () {
		POP.add({name: "x", title: "X position:", value: 0});
		POP.add({name: "y", title: "Y position:", value: 0});
		POP.show('Translate to', [LAYER, 'layer_translate_custom']);	
	};
	
	//transalte handler for layer_translate()
	this.layer_translate_custom = function(user_response){
		EDIT.save_state();
		var x = parseInt(user_response.x);
		var y = parseInt(user_response.y);
		
		//move
		var tmp = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
		canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
		canvas_active().putImageData(tmp, x, y);
	};
	
	//removes all layers
	this.remove_all_layers = function(){
		//delete old layers
		for (var i = LAYER.layers.length-1; i >= 0; i--) {
			LAYER.layer_remove(i, true);
		}
		layer_max_index = 0;
		this.layer_renew();
	};
	
	//generate name for new layer
	this.generate_layer_name = function(prefix){
		if(prefix == undefined)
			prefix = 'Layer';
			
		return prefix + ' #' + (layer_max_index);
	};
	
	//create layer
	this.layer_add = function (name, data) {
		layer_max_index++;
		
		//save selected area
		var copy = false;
		var last_layer = LAYER.layer_active;
		if (DRAW.select_data != false && data == undefined) {
			copy = document.createElement("canvas");
			copy.width = DRAW.select_data.w;
			copy.height = DRAW.select_data.h;
			copy.getContext("2d").drawImage(canvas_active(true), DRAW.select_data.x, DRAW.select_data.y, DRAW.select_data.w, DRAW.select_data.h, 0, 0, DRAW.select_data.w, DRAW.select_data.h);
		}
		
		if (data == undefined) {
			//empty layer
			if (name == undefined) {
				name = this.generate_layer_name();
			}
			var new_layer = [];
			new_layer.name = name;
			new_layer.title = name;
			new_layer.visible = true;
			new_layer.opacity = 1;
			LAYER.create_canvas(name);
			this.layers.unshift(new_layer);
			
			//add selected data
			if (DRAW.select_data != false) {
				//copy user selected data to new layer
				canvas_active().drawImage(copy, 0, 0);

				//clear selection
				DRAW.select_data = false;
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);

				//switch back to old layer
				LAYER.layer_active = last_layer;
			}
		}
		else {
			var img = new Image();
			if (data.substring(0, 4) == 'http')
				img.crossOrigin = "Anonymous";	//data from other domain - turn on CORS
			var _this = this;
			
			img.onload = function () {
				//check size
				var need_resize = false;
				if (img.width > WIDTH || img.height > HEIGHT) {
					if (img.width > WIDTH)
						WIDTH = img.width;
					if (img.height > HEIGHT)
						HEIGHT = img.height;
					LAYER.set_canvas_size();
					need_resize = true;
				}
				//remove initial empty layer
				if (_this.layers.length == 1 && EVENTS.autosize == true) {
					var trim_info = IMAGE.trim_info(document.getElementById(_this.layers[0].name));
					if (trim_info.empty == true) {
						_this.layer_remove(0, true);
						WIDTH = img.width;
						HEIGHT = img.height;
						LAYER.set_canvas_size(false);
					}
				}

				for (var i in _this.layers) {
					if (_this.layers[i].name == name) {
						name = _this.generate_layer_name(name);
					}
				}
				LAYER.create_canvas(name);
				_this.layers.unshift({
					name: name,
					title: name,
					visible: true,
					opacity: 1
				});
				LAYER.layer_active = 0;

				document.getElementById(name).getContext("2d").globalAlpha = 1;
				document.getElementById(name).getContext('2d').drawImage(img, 0, 0);
				LAYER.layer_renew();
				if(_this.layers.length == 1 || need_resize == true) {
					GUI.zoom_auto(true);
				}
				GUI.redraw_preview();
			};
			img.onerror = function (ex) {
				POP.add({html: '<b>The image could not be loaded.<br /><br /></b>'});
				if (data.substring(0, 4) == 'http')
					POP.add({title: "Reason:", value: 'Cross-origin resource sharing (CORS) not supported. Try to save image first.'});
				POP.show('Error', '.');
			};
			img.src = data;
		}
		LAYER.layer_active = 0;
		document.getElementById(this.layers[LAYER.layer_active].name).getContext("2d").globalAlpha = 1;
		this.layer_renew();
	};
	
	this.layer_remove = function (i, force) {
		if (this.layers.length == 1 && force == undefined){
			//only 1 layer left
			canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
			return false;
		}
		element = document.getElementById(this.layers[i].name);
		element.getContext("2d").clearRect(0, 0, WIDTH, HEIGHT);
		element.parentNode.removeChild(element);

		this.layers.splice(i, 1);
		if (LAYER.layer_active == i)
			LAYER.layer_active = Math.max(0, LAYER.layer_active-1);
		this.layer_renew();
		GUI.redraw_preview();
	};

	//duplicate
	this.layer_duplicate = function () {
		EDIT.save_state();
		if (DRAW.select_data != false) {
			//selection
			EDIT.copy_to_clipboard();
			DRAW.select_data = false;
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			EDIT.paste('menu');
			LAYER.layer_active = 0;
			LAYER.layer_renew();
		}
		else {
			layer_max_index++;
			//copy all layer
			tmp_data = document.createElement("canvas");
			tmp_data.width = WIDTH;
			tmp_data.height = HEIGHT;
			tmp_data.getContext("2d").drawImage(canvas_active(true), 0, 0);

			//create
			var new_name = this.generate_layer_name();
			LAYER.create_canvas(new_name);
			this.layers.unshift({name: new_name, title: new_name, visible: true});
			this.layer_active = 0;
			canvas_active().drawImage(tmp_data, 0, 0);
			LAYER.layer_renew();
		}
	};

	//show / hide
	this.layer_show_hide = function () {
		LAYER.layer_visibility(LAYER.layer_active);
	};

	//crop
	this.layer_crop = function () {
		EDIT.save_state();
		if (DRAW.select_data == false) {
			POP.add({html: 'Select area first'});
			POP.show('Error', '');
		}
		else {
			var layer = LAYER.canvas_active();

			var tmp = layer.getImageData(DRAW.select_data.x, DRAW.select_data.y, DRAW.select_data.w, DRAW.select_data.h);
			layer.clearRect(0, 0, WIDTH, HEIGHT);
			layer.putImageData(tmp, 0, 0);

			DRAW.select_data = false;
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
		}
	};

	//delete
	this.layer_delete = function () {
		EDIT.save_state();
		LAYER.layer_remove(LAYER.layer_active);
	};

	//move up
	this.layer_move_up = function () {
		EDIT.save_state();
		LAYER.move_layer('up');
	};

	//move down
	this.layer_move_down = function () {
		EDIT.save_state();
		LAYER.move_layer('down');
	};

	//opacity
	this.layer_opacity = function () {
		LAYER.set_alpha();
	};
	
	//rename
	this.layer_rename = function () {
		var _this = this;
		POP.add({name: "param1", title: "Name:", value: this.layers[LAYER.layer_active].title});
		POP.show('Rename layer',
			function (user_response) {
				EDIT.save_state();
				var param1 = user_response.param1;

				_this.layers[LAYER.layer_active].title = param1;
				LAYER.layer_renew();
			}
		);
		document.getElementById("pop_data_param1").select();
	};

	//trim
	this.layer_trim = function () {
		EDIT.save_state();
		IMAGE.trim(this.layers[LAYER.layer_active].name, true);
	};

	//resize
	this.layer_resize = function () {
		IMAGE.resize_box();
	};

	//clear
	this.layer_clear = function () {
		EDIT.save_state();
		canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
	};

	//show differences
	this.layer_differences = function () {
		if (parseInt(LAYER.layer_active) + 1 >= this.layers.length) {
			POP.add({html: 'This can not be last layer'});
			POP.show('Error', '');
			return false;
		}

		POP.add({name: "param1", title: "Sensitivity:", value: "0", range: [0, 255]});
		POP.show(
			'Differences', 
			function (response) {
				var param1 = parseInt(response.param1);
				LAYER.calc_differences(param1);
			},
			function (user_response, canvas_preview, w, h) {
				var param1 = parseInt(user_response.param1);
				LAYER.calc_differences(param1, canvas_preview, w, h);
			}
		);
	};

	//merge
	this.layer_merge_down = function () {
		var compositions = ["source-over", "source-in", "source-out", "source-atop",
			"destination-over", "destination-in", "destination-out", "destination-atop",
			"lighter", "darker", "copy", "xor"];

		var blend_modes = ["normal", "multiply", "screen", "overlay", "darken", "lighten",
			"color-dodge", "color-burn", "hard-light", "soft-light", "difference",
			"exclusion", "hue", "saturation", "color", "luminosity"];

		if (LAYER.layer_active + 1 >= this.layers.length) {
			POP.add({html: 'This can not be last layer.'});
			POP.show('Error', '');
			return false;
		}
		POP.add({name: "param1", title: "Composition:", values: compositions});
		POP.add({name: "param2", title: "Blend:", values: blend_modes});
		POP.add({name: "param3", title: "Mode:", values: ["Composite", "Blend"]});
		POP.show(
			'Merge',
			function (response) {
				var param1 = response.param1;
				var param2 = response.param2;
				var param3 = response.param3;

				EDIT.save_state();
				
				//copy
				var tmp_data = document.createElement("canvas");
				tmp_data.width = WIDTH;
				tmp_data.height = HEIGHT;
				tmp_data.getContext("2d").drawImage(LAYER.canvas_active(true), 0, 0);

				//paste
				LAYER.canvas_active().save();
				LAYER.canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				LAYER.canvas_active().drawImage(document.getElementById(LAYER.layers[LAYER.layer_active + 1].name), 0, 0);
				
				if (param3 == "Composite")
					LAYER.canvas_active().globalCompositeOperation = param1;
				else
					LAYER.canvas_active().globalCompositeOperation = param2;
				LAYER.canvas_active().drawImage(tmp_data, 0, 0);
				LAYER.canvas_active().restore();

				//remove next layer
				LAYER.layer_remove(LAYER.layer_active + 1);
				LAYER.layer_renew();
			},
			function (response, canvas_preview, w, h) {
				var param1 = response.param1;
				var param2 = response.param2;
				var param3 = response.param3;

				//paste
				canvas_preview.save();
				canvas_preview.clearRect(0, 0, w, h);
				LAYER.layer_active++;
				canvas_preview.drawImage(LAYER.canvas_active(true), 0, 0, WIDTH, HEIGHT, 0, 0, w, h);
				LAYER.layer_active--;
				
				if (param3 == "Composite")
					canvas_preview.globalCompositeOperation = param1;
				else
					canvas_preview.globalCompositeOperation = param2;
				canvas_preview.drawImage(LAYER.canvas_active(true), 0, 0, WIDTH, HEIGHT, 0, 0, w, h);
				canvas_preview.restore();
			}
		);
	};

	//flatten all
	this.layer_flatten = function () {
		EDIT.save_state();
		if (this.layers.length == 1)
			return false;
		LAYER.layer_active = 0;
		tmp_data = document.createElement("canvas");
		tmp_data.width = WIDTH;
		tmp_data.height = HEIGHT;
		
		//prepare first layer
		LAYER.layer_active = this.layers.length-1;
		if(this.layers[LAYER.layer_active].visible == 0){
			canvas_active().clearRect(0, 0, WIDTH, HEIGHT);			
			LAYER.layer_visibility(LAYER.layer_active);
		}
		
		for (var i = this.layers.length-2; i >= 0; i--) {
			if(this.layers[i].visible == false){
				continue;
			}
			
			//copy
			LAYER.layer_active = i;
			tmp_data.getContext("2d").clearRect(0, 0, WIDTH, HEIGHT);
			tmp_data.getContext("2d").drawImage(canvas_active(true), 0, 0);

			//paste
			LAYER.layer_active = this.layers.length-1;
			canvas_active().drawImage(tmp_data, 0, 0);
		}
		
		//delete layers
		for (var i = this.layers.length-2; i >= 0; i--) {
			LAYER.layer_active = i;
			LAYER.layer_remove(LAYER.layer_active);
		}
		LAYER.layer_renew();
	};
	
	this.create_canvas = function (canvas_id) {
		var new_canvas = document.createElement('canvas');
		new_canvas.setAttribute('id', canvas_id);

		document.getElementById('canvas_more').appendChild(new_canvas);
		new_canvas.width = WIDTH;
		new_canvas.height = HEIGHT;
		
		new_canvas.getContext("2d").webkitImageSmoothingEnabled = false;
		new_canvas.getContext("2d").msImageSmoothingEnabled = false;
		new_canvas.getContext("2d").imageSmoothingEnabled = false;
		
		//sync zoom
		new_canvas.style.width = Math.round(WIDTH * GUI.ZOOM / 100) + "px";
		new_canvas.style.height = Math.round(HEIGHT * GUI.ZOOM / 100) + "px";
	};
	this.move_layer = function (direction) {
		if (this.layers.length < 2)
			return false;

		var layer_from = this.layers[this.layer_active];
		var parent = document.getElementById('canvas_more');
		var content = document.getElementById(this.layers[this.layer_active].name);

		if (direction == 'up') {
			if (this.layer_active == 0)
				return false;
			var layer_to = this.layers[this.layer_active - 1];
			
			if(this.layer_active != 1)
				parent.insertBefore(content, document.getElementById(this.layers[this.layer_active-2].name));
			else
				parent.insertBefore(content, null);

			this.layer_active--;
		}
		else if(direction == 'down') {
			if (this.layer_active == this.layers.length-1)
				return false;
			
			parent.insertBefore(content, document.getElementById(this.layers[this.layer_active+1].name));

			this.layer_active++;
		}
		//switch attribures
		var layer_to = this.layers[this.layer_active];
		for(var i in layer_to){
			var tmp = layer_to[i];
			layer_to[i] = layer_from[i];
			layer_from[i] = tmp;
		}

		this.layer_renew();
		GUI.zoom();
		return true;
	};
	this.layer_visibility = function (i) {
		if (this.layers[i].visible == true) {
			this.layers[i].visible = false;
			document.getElementById(this.layers[i].name).style.visibility = 'hidden';
			document.getElementById('layer_' + i).src = "img/yes-grey.png";
		}
		else {
			this.layers[i].visible = true;
			document.getElementById(this.layers[i].name).style.visibility = 'visible';
			document.getElementById('layer_' + i).src = "img/yes.png";
		}
		this.layer_renew();
		GUI.redraw_preview();
	};

	this.layer_move_active = function (x, y) {
		var distance = 10;
		if (EVENTS.ctrl_pressed == true)
			distance = 50;
		if (EVENTS.shift_pressed == true)
			distance = 1;

		//move
		dx = x * distance;
		dy = y * distance;
		var tmp = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
		canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
		canvas_active().putImageData(tmp, dx, dy);
	};
	this.select_layer = function (i) {
		if (LAYER.layer_active != i) {
			LAYER.layer_active = parseInt(i);	//select
			this.layer_renew();
		}
		LAYER.shake(i);
	};
	this.layer_renew = function () {
		var html = '';
		for (var i in this.layers) {
			//create
			if (LAYER.layer_active == i)
				html += '<div class="layer active">';
			else
				html += '<div class="layer">';
			var title = this.layers[i].title;
			html += '<span class="layer_title" ondblclick="LAYER.layer_rename();" onclick="LAYER.select_layer(\'' + i + '\')">' + HELPER.escapeHtml(title) + '</span>';
			html += '<a class="layer_visible" onclick="EDIT.save_state();LAYER.layer_remove(\'' + i + '\');return false;" title="delete" href="#"></a>';
			//hide
			if (this.layers[i].visible == true)
				html += '<a class="layer_delete" id="layer_' + i + '" onclick="LAYER.layer_visibility(\'' + i + '\');return false;" title="hide" href="#"></a>';
			else
				html += '<a class="layer_delete layer_unvisible" id="layer_' + i + '" onclick="LAYER.layer_visibility(\'' + i + '\');return false;" title="show" href="#"></a>';

			html += '</div>';
			//show
			document.getElementById('layers').innerHTML = html;
		}
		if(this.layers.length == 0)
			document.getElementById('layers').innerHTML = '';
	};
	this.shake = function (i, nr) {
		var step = 3;
		var n = 10;

		if (nr == undefined) {
			//begin
			nr = 0;
			canvas_front.drawImage(canvas_active(true), 0, 0);
		}
		var dx = step * (nr % 2);
		if (dx == 0)
			dx = -step;

		var element = document.getElementById('canvas_front');
		element.style.marginLeft = dx + "px";
		if (nr < n)
			setTimeout(function () {
				LAYER.shake(i, nr + 1);
			}, 15);
		else {
			//finish shaking
			element.style.marginLeft = "0px";
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
		}
	};
	this.update_info_block = function () {
		//show size
		document.getElementById('mouse_info_size').innerHTML = WIDTH + "x" + HEIGHT;
		
		//show mouse position
		var x = 0;
		var y = 0;
		if (EVENTS.mouse != undefined) {
			x = EVENTS.mouse.x;
			y = EVENTS.mouse.y;
		}
		if(EVENTS.mouse.valid == true){
			document.getElementById('mouse_info_mouse').innerHTML = x + "x" + y;
		}
		else{
			//mouse is not inside canvas
			document.getElementById('mouse_info_mouse').innerHTML = '';
		}
		
		//show selected area info
		if (DRAW.select_data != false) {
			document.getElementById('mouse_info_xy').innerHTML = DRAW.select_data.x + ", " + DRAW.select_data.y;
			document.getElementById('mouse_info_area').innerHTML = DRAW.select_data.w + ", " + DRAW.select_data.h;
			
			document.getElementById('mouse_info_selected').style.display = 'block';
		}
		else{
			document.getElementById('mouse_info_xy').innerHTML = '';
			document.getElementById('mouse_info_area').innerHTML = '';
			document.getElementById('mouse_info_selected').style.display = 'none';
		}
	};
	this.set_canvas_size = function (repaint) {
		var ratio = WIDTH/HEIGHT;
		var W = Math.round(WIDTH);
		var H = Math.round(W / ratio);

		this.resize_canvas("canvas_back");
		GUI.draw_background(canvas_back, WIDTH, HEIGHT);
		this.resize_canvas("canvas_front", false);
		this.resize_canvas("canvas_grid", true);
		for (var i in this.layers) {
			if (repaint === false)
				this.resize_canvas(this.layers[i].name, false);
			else
				this.resize_canvas(this.layers[i].name, true);
		}

		GUI.draw_grid();

		document.getElementById('resize-w').style.marginLeft = W + "px";
		document.getElementById('resize-w').style.marginTop = Math.round(H / 2) + "px";
		document.getElementById('resize-h').style.marginLeft = Math.round(W / 2) + "px";
		document.getElementById('resize-h').style.marginTop = H + "px";
		document.getElementById('resize-wh').style.marginLeft = W + "px";
		document.getElementById('resize-wh').style.marginTop = H + "px";

		this.update_info_block();
		GUI.redraw_preview();
		GUI.zoom();
	};
	this.resize_canvas = function (canvas_name, repaint) {
		var ratio = WIDTH/HEIGHT;
		var W = Math.round(WIDTH);
		var H = Math.round(W / ratio);
		var canvas = document.getElementById(canvas_name);
		var ctx = canvas.getContext("2d");

		if (repaint == false) {
			canvas.width = W;
			canvas.height = H;
		}
		else {
			//save
			var buffer = document.createElement('canvas');
			buffer.width = WIDTH;
			buffer.height = HEIGHT;
			buffer.getContext('2d').drawImage(canvas, 0, 0);

			canvas.width = W;
			canvas.height = H;

			//restore
			ctx.drawImage(buffer, 0, 0);
		}
	};
	this.set_alpha = function () {
		var _this = this;
		if (this.layers[LAYER.layer_active].opacity == undefined)
			this.layers[LAYER.layer_active].opacity = 1;
		POP.add({name: "param1", title: "Alpha:", value: this.layers[LAYER.layer_active].opacity, range: [0, 1], step: 0.01});
		POP.show(
			'Opacity',
			function (user_response) {
				var param1 = parseFloat(user_response.param1);
				_this.layers[LAYER.layer_active].opacity = param1;
				canvas_active().globalAlpha = param1;

				var img = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var imgData = img.data;
				var new_alpha = 255 * param1;
				if (new_alpha < 10)
					new_alpha = 10;
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				for (var y = 0; y < img.height; y++) {
					for (var x = 0; x < img.width; x++) {
						var k = ((y * (img.width * 4)) + (x * 4));
						if (imgData[k + 3] > 0)
							imgData[k + 3] = new_alpha;
					}
				}
				canvas_active().putImageData(img, 0, 0);

				GUI.zoom();
			}
		);
	};
	this.canvas_active = function (base) {
		if (base == undefined)
			return document.getElementById(LAYER.layers[LAYER.layer_active].name).getContext("2d");
		else
			return document.getElementById(LAYER.layers[LAYER.layer_active].name);
	};
	
	this.calc_differences = function (sensitivity, canvas_preview, w, h) {
		vlayer_active = parseInt(LAYER.layer_active);
		//first layer
		var img1 = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
		var imgData1 = img1.data;

		//second layer
		var context2 = document.getElementById(this.layers[vlayer_active + 1].name).getContext("2d");
		var img2 = context2.getImageData(0, 0, WIDTH, HEIGHT);
		var imgData2 = img2.data;

		//result layer
		if (canvas_preview == undefined) {
			//add differences layer
			LAYER.layer_add();
			canvas_active().rect(0, 0, WIDTH, HEIGHT);
			canvas_active().fillStyle = "#ffffff";
			canvas_active().fill();
			var img3 = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
		}
		else {
			//work on preview layer
			var canvas_tmp = document.createElement("canvas");
			canvas_tmp.width = WIDTH;
			canvas_tmp.height = HEIGHT;
			var img3 = canvas_tmp.getContext("2d").getImageData(0, 0, WIDTH, HEIGHT);
		}
		var imgData3 = img3.data;
		for (var xx = 0; xx < WIDTH; xx++) {
			for (var yy = 0; yy < HEIGHT; yy++) {
				var x = (xx + yy * WIDTH) * 4;
				if (Math.abs(imgData1[x] - imgData2[x]) > sensitivity
					|| Math.abs(imgData1[x + 1] - imgData2[x + 1]) > sensitivity
					|| Math.abs(imgData1[x + 2] - imgData2[x + 2]) > sensitivity
					|| Math.abs(imgData1[x + 3] - imgData2[x + 3]) > sensitivity) {
					imgData3[x] = 255;
					imgData3[x + 1] = 0;
					imgData3[x + 2] = 0;
					imgData3[x + 3] = 255;
				}
			}
		}
		if (canvas_preview == undefined)
			canvas_active().putImageData(img3, 0, 0);
		else {
			canvas_tmp.getContext("2d").rect(0, 0, WIDTH, HEIGHT);
			canvas_tmp.getContext("2d").fillStyle = "#ffffff";
			canvas_tmp.getContext("2d").fill();
			canvas_tmp.getContext("2d").putImageData(img3, 0, 0);
			canvas_preview.clearRect(0, 0, w, h);

			canvas_preview.save();
			canvas_preview.scale(w / WIDTH, h / HEIGHT);
			canvas_preview.drawImage(canvas_tmp, 0, 0);
			canvas_preview.restore();
		}
	};

	/**
	 * exports all layers to canvas for saving
	 * 
	 * @param {canvas.context} ctx
	 * @param {string} type
	 * @param {boolean} only_one_layer
	 */
	this.export_layers_to_canvas = function (ctx, type, only_one_layer){
		//handle transparency
		if (GUI.TRANSPARENCY == false || type == 'JPG') {
			ctx.beginPath();
			ctx.rect(0, 0, WIDTH, HEIGHT);
			ctx.fillStyle = "#ffffff";
			ctx.fill();
		}

		//take data
		for(var i = LAYER.layers.length-1; i >=0; i--){
			if (LAYER.layers[i].visible == false)
				continue;
			if (only_one_layer == true && type != 'JSON' && i != LAYER.layer_active)
				continue;
			ctx.drawImage(document.getElementById(LAYER.layers[i].name), 0, 0, WIDTH, HEIGHT);
		}
	};
}

function canvas_active(base) {
	return LAYER.canvas_active(base);
}
