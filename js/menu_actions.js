var MENU = new MENU_CLASS();

function MENU_CLASS(){
	this.last_menu = '';
	var PASTE_DATA = false;
	var fx_filter = fx.canvas();
	
	this.do_menu = function(name){
		$('#main_menu').find('.selected').click(); //close menu
		MENU.last_menu = name;
		
		//exec
		MENU[name]();
		
		DRAW.zoom();
		};
	
	//===== File ===========================================================
	
	//new
	this.file_new = function(){
		POP.add({name: "width",		title: "Width:",	value: WIDTH	});
		POP.add({name: "height",	title: "Height:",	value: HEIGHT	});	
		POP.add({name: "transparency",	title: "Transparent:", 	values: ['Yes', 'No']});
		POP.show('New file...', function(response){
			var width = parseInt(response.width);
			var height = parseInt(response.height);
			var transparency = response.transparency;

			if(response.transparency == 'Yes')
				MAIN.TRANSPARENCY = true;
			else
				MAIN.TRANSPARENCY = false;

			ZOOM = 100;
			WIDTH = width;
			HEIGHT = height;
			RATIO = WIDTH/HEIGHT;
			MAIN.init();
			});
		};
	//open
	this.file_open = function(){
		MENU.open();
		};
	//save
	this.file_save = function(){
		MENU.save_dialog();
		};
	//print
	this.file_print = function(){
		window.print();
		};

	//===== Edit ===========================================================

	//undo
	this.edit_undo = function(){
		MAIN.undo();
		};
	//cut
	this.edit_cut = function(){
		MAIN.save_state();
		if(TOOLS.select_data != false){
			this.copy_to_clipboard();
			canvas_active().clearRect(TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h);
			TOOLS.select_data = false;
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			}
		};
	//copy
	this.edit_copy = function(){
		if(TOOLS.select_data != false)
			this.copy_to_clipboard();
		};
	//paste
	this.edit_paste = function(){
		MAIN.save_state();
		this.paste('menu');
		};
	//select all
	this.edit_select = function(){
		TOOLS.select_data = {
			x: 	0,
			y: 	0,
			w: 	WIDTH,
			h: 	HEIGHT
			};
		canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
		TOOLS.draw_selected_area();
		};
	//clear selection
	this.edit_clear = function(){
		TOOLS.select_data = false;
		canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
		};

	//===== Image ==========================================================

	//information
	this.image_information = function(){
		var colors = TOOLS.unique_colors_count(canvas_active(true));
		colors = HELPER.number_format(colors, 0);

		POP.add({title: "Width:",	value: WIDTH	});
		POP.add({title: "Height:",	value: HEIGHT	});
		POP.add({title: "Unique colors:",	value: colors	});
		//exif
		for(var i in TOOLS.EXIF)
			POP.add({title: i+":",	value: TOOLS.EXIF[i]	});
		POP.show('Information', '');
		};
	//size
	this.image_size = function(){
		POP.add({name: "width",		title: "Width:",	value: WIDTH	});
		POP.add({name: "height",	title: "Height:",	value: HEIGHT	});	
		POP.show('Attributes', this.resize_custom);
		};
	//trim
	this.image_trim = function(){
		MAIN.save_state();
		DRAW.trim();
		};
	//crop
	this.image_crop = function(){
		MAIN.save_state();
		if(TOOLS.select_data == false){
			POP.add({html: 'Select area first'	});
			POP.show('Error', '');
			}
		else{
			for(var i in LAYERS){
				var layer = document.getElementById(LAYERS[i].name).getContext("2d");

				var tmp = layer.getImageData(TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h);
				layer.clearRect(0, 0, WIDTH, HEIGHT);
				layer.putImageData(tmp, 0, 0);
				}

			//resize
			MAIN.save_state();
			WIDTH = TOOLS.select_data.w;
			HEIGHT = TOOLS.select_data.h;
			RATIO = WIDTH/HEIGHT;
			LAYER.set_canvas_size();

			TOOLS.select_data = false;
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			}
		};
	//resize
	this.image_resize = function(){
		MENU.resize_box();
		};
	//rotate left
	this.image_rotate_left = function(){
		MAIN.save_state();
		MENU.rotate_resize_doc(270, WIDTH, HEIGHT); 
		MENU.rotate_layer({angle: 270}, canvas_active(), WIDTH, HEIGHT);
		};
	//rotate right
	this.image_rotate_right = function(){
		MAIN.save_state();
		MENU.rotate_resize_doc(90, WIDTH, HEIGHT); 
		MENU.rotate_layer({angle: 90}, canvas_active(), WIDTH, HEIGHT);
		};
	//rotate
	this.image_rotate = function(){
		POP.add({name: "angle", 	title: "Enter angle (0-360):",	value: 0, range: [0, 360]	});
		POP.show('Rotate', function(response){
				MAIN.save_state();
				MENU.rotate_resize_doc(response.angle, WIDTH, HEIGHT); 
				MENU.rotate_layer(response, canvas_active(), WIDTH, HEIGHT); 
				},
			function(response, canvas_preview, w, h){
				MENU.rotate_layer(response, canvas_preview, w, h); 
				});
		};
	//vertical flip
	this.image_vflip = function(){
		MAIN.save_state();
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
	this.image_hflip = function(){
		MAIN.save_state();
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
	this.image_colors = function(){
		POP.add({name: "param1",	title: "Brightness:",	value: "0",	range: [-100, 100] });
		POP.add({name: "param2",	title: "Contrast:",	value: "0",	range: [-100, 100] });
		POP.add({name: "param_red",	title: "Red channel:",	value: "0",	range: [-255, 255] });
		POP.add({name: "param_green",	title: "Green channel:",	value: "0",	range: [-255, 255] });
		POP.add({name: "param_blue",	title: "Blue channel:",	value: "0",	range: [-255, 255] });
		POP.add({name: "param_h",	title: "Hue:",		value: "0",	range: [-180, 180] });
		POP.add({name: "param_s",	title: "Saturation:",	value: "0",	range: [-100, 100] });
		POP.add({name: "param_l",	title: "Luminance:",	value: "0",	range: [-100, 100] });

		POP.show('Brightness Contrast', function(user_response){
				MAIN.save_state();
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
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
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
				});
		};
	//auto adjust colors
	this.image_auto_adjust = function(){
		MAIN.save_state();
		DRAW.auto_adjust(canvas_active(), WIDTH, HEIGHT);
		};
	//convert to grayscale
	this.image_GrayScale = function(){
		MAIN.save_state();
		var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
		var filtered = ImageFilters.GrayScale(imageData);	//add effect
		canvas_active().putImageData(filtered, 0, 0);
		};
	//enchance colors
	this.image_decrease_colors = function(){
		POP.add({name: "param1",	title: "Colors:",	value: "10",	range: [2, 100] });
		POP.add({name: "param2",	title: "Dithering:",	values: ["No", "Yes"],  });
		POP.add({name: "param3",	title: "Greyscale:",	values: ["No", "Yes"],  });
		POP.show('Decrease colors', function(user_response){
				MAIN.save_state();
				var param1 = parseInt(user_response.param1);
				if(user_response.param2 == 'Yes') param2 = true; else param2 = false;
				if(user_response.param3 == 'Yes') param3 = true; else param3 = false;

				DRAW.decrease_colors(canvas_active(true), canvas_active(true), WIDTH, HEIGHT, param1, param2, param3);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseInt(user_response.param1);
				if(user_response.param2 == 'Yes') param2 = true; else param2 = false;
				if(user_response.param3 == 'Yes') param3 = true; else param3 = false;

				DRAW.decrease_colors(canvas_active(true), document.getElementById("pop_post"), w, h, param1, param2, param3);
				});
		};	
	//negative
	this.image_negative = function(){
		MAIN.save_state();
		if(TOOLS.select_data == false)
			var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
		else
			var imageData = canvas_active().getImageData(TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h);
		var pixels = imageData.data;
		for (var i = 0; i < pixels.length; i += 4){
			pixels[i]   = 255 - pixels[i];   // red
			pixels[i+1] = 255 - pixels[i+1]; // green
			pixels[i+2] = 255 - pixels[i+2]; // blue
			}
		//save
		if(TOOLS.select_data == false)
			canvas_active().putImageData(imageData, 0, 0);
		else
			canvas_active().putImageData(imageData, TOOLS.select_data.x, TOOLS.select_data.y);
		};
	//grid
	this.image_grid = function(){
		POP.add({name: "visible",	title: "Visible:",	value: "Yes", values: ["Yes", "No"]	});
		POP.add({name: "gap_x",		title: "Horizontal gap:",	value: DRAW.grid_size[0]	});
		POP.add({name: "gap_y",		title: "Vertical gap:",	value: DRAW.grid_size[1]	});	
		POP.show('Grid', function(response){
			if(response.visible == "Yes"){
				MAIN.grid = true;
				gap_x = response.gap_x;
				gap_y = response.gap_y;
				DRAW.draw_grid(gap_x, gap_y);
				}
			else{
				MAIN.grid = false;
				DRAW.draw_grid();
				}
			});
		};
	//histogram
	this.image_histogram = function(){
		TOOLS.histogram();
		};

	//===== Layer ==========================================================

	//new layer
	this.layer_new = function(){
		MENU.add_layer();
		};
	//dublicate
	this.layer_dublicate = function(){
		MAIN.save_state();
		if(TOOLS.select_data != false){
			//selection
			this.copy_to_clipboard();
			TOOLS.select_data = false;
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			var tmp = LAYER.layer_active;
			this.paste('menu');
			LAYER.layer_active = tmp;
			LAYER.layer_renew();
			}
		else{
			//copy all layer
			tmp_data = document.createElement("canvas");
			tmp_data.width = WIDTH;
			tmp_data.height = HEIGHT;
			tmp_data.getContext("2d").drawImage(canvas_active(true), 0, 0);

			//create
			var new_name = 'Layer #'+(LAYERS.length+1);
			LAYER.create_canvas(new_name);
			LAYERS.push({name: new_name, visible: true});
			LAYER.layer_active = LAYERS.length-1;
			canvas_active().drawImage(tmp_data, 0, 0);
			LAYER.layer_renew();
			}
		};
	//show / hide
	this.layer_show_hide = function(){
		LAYER.layer_visibility(LAYER.layer_active);
		};
	//crop
	this.layer_crop = function(){
		MAIN.save_state();
		if(TOOLS.select_data == false){
			POP.add({html: 'Select area first'});
			POP.show('Error', '');
			}
		else{
			var layer = LAYER.canvas_active();

			var tmp = layer.getImageData(TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h);
			layer.clearRect(0, 0, WIDTH, HEIGHT);
			layer.putImageData(tmp, 0, 0);

			TOOLS.select_data = false;
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			}
		};
	//delete
	this.layer_delete = function(){
		MAIN.save_state();
		LAYER.layer_remove(LAYER.layer_active);
		};
	//move up
	this.layer_move_up = function(){
		MAIN.save_state();
		LAYER.move_layer('up');
		};
	//move down
	this.layer_move_down = function(){
		MAIN.save_state();
		LAYER.move_layer('down');
		};
	//opacity
	this.layer_opacity = function(){
		LAYER.set_alpha();
		};
	//trim
	this.layer_trim = function(){
		MAIN.save_state();
		DRAW.trim(LAYERS[LAYER.layer_active].name, true);
		};
	//resize
	this.layer_resize = function(){
		MENU.resize_box();
		};
	//clear
	this.layer_clear = function(){
		MAIN.save_state();
		canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
		};
	//show differences
	this.layer_differences = function(){
		if(parseInt(LAYER.layer_active) + 1 >= LAYERS.length){
			POP.add({html: 'This can not be last layer'	});
			POP.show('Error', '');
			return false;
			}

		POP.add({name: "param1", 	title: "Sensitivity:",	value: "0",	range: [0, 255] });
		POP.show('Differences', function(response){
				var param1 = parseInt(response.param1);
				TOOLS.calc_differences(param1);
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseInt(user_response.param1);
				TOOLS.calc_differences(param1, canvas_preview, w, h);
				});
		};
	//merge
	this.layer_merge_down = function(){
		var compositions = ["source-over", "source-in", "source-out", "source-atop", 
				"destination-over", "destination-in", "destination-out", "destination-atop",
				"lighter", "darker", "copy", "xor"];
		
		var blend_modes = ["normal", "multiply", "screen", "overlay", "darken", "lighten", 
			"color-dodge", "color-burn", "hard-light", "soft-light", "difference", 
			"exclusion", "hue", "saturation", "color", "luminosity"];

		if(parseInt(LAYER.layer_active) + 1 >= LAYERS.length){
			POP.add({html: 'This can not be last layer.'	});
			POP.show('Error', '');
			return false;
			}
		POP.add({name: "param1", 	title: "Composition:",	values: compositions	 });
		POP.add({name: "param2", 	title: "Blend:",	values: blend_modes	 });
		POP.add({name: "param3", 	title: "Mode:",	values: ["Composite", "Blend"]	 });
		POP.show('Merge', function(response){
				var param1 = response.param1;
				var param2 = response.param2;
				var param3 = response.param3;

				MAIN.save_state();
				//copy
				LAYER.layer_active++;
				var tmp_data = document.createElement("canvas");
				tmp_data.width = WIDTH;
				tmp_data.height = HEIGHT;
				tmp_data.getContext("2d").drawImage(LAYER.canvas_active(true), 0, 0);

				//paste
				LAYER.layer_active--;
				LAYER.canvas_active().save();
				if(param3 == "Composite")
					LAYER.canvas_active().globalCompositeOperation = param1;
				else
					LAYER.canvas_active().globalCompositeOperation = param2;
				LAYER.canvas_active().drawImage(tmp_data, 0, 0);
				LAYER.canvas_active().restore();

				//remove next layer
				LAYER.layer_remove(LAYER.layer_active+1);
				LAYER.layer_renew();
				},
			function(response, canvas_preview, w, h){
				var param1 = response.param1;
				var param2 = response.param2;
				var param3 = response.param3;

				//copy
				LAYER.layer_active++;
				var tmp_data = document.createElement("canvas");
				tmp_data.width = w;
				tmp_data.height = h;
				tmp_data.getContext("2d").drawImage(LAYER.canvas_active(true), 0, 0, WIDTH, HEIGHT, 0, 0, w, h);

				//paste
				LAYER.layer_active--;
				canvas_preview.save();
				if(param3 == "Composite")
					canvas_preview.globalCompositeOperation = param1;
				else
					canvas_preview.globalCompositeOperation = param2;
				canvas_preview.drawImage(tmp_data, 0, 0);
				canvas_preview.restore();
				});
		};
	//flatten all
	this.layer_flatten = function(){
		MAIN.save_state();
		if(LAYERS.length == 1) return false;
		tmp_data = document.createElement("canvas");
		tmp_data.width = WIDTH;
		tmp_data.height = HEIGHT;
		for(var i=1; i < LAYERS.length; i++){
			//copy
			LAYER.layer_active = i;
			tmp_data.getContext("2d").clearRect(0, 0, WIDTH, HEIGHT);
			tmp_data.getContext("2d").drawImage(canvas_active(true), 0, 0);

			//paste
			LAYER.layer_active = 0;
			canvas_active().drawImage(tmp_data, 0, 0);
			}
		for(var i=LAYERS.length - 1; i > 0; i--){
			//delete layer
			LAYER.layer_active = i;
			LAYER.layer_remove(LAYER.layer_active);
			}
		LAYER.layer_renew();
		};

	//===== Tools ==========================================================

	//sprites
	this.tools_sprites = function(){
		POP.add({name: "param1", 	title: "Offset:",	value: "50",	values: ["0", "10", "50", "100"] });
		POP.show('Sprites', function(response){
			MAIN.save_state();
			var param1 = parseInt(response.param1);
			TOOLS.generate_sprites(param1);
			});
		};
	//show keypoints
	this.tools_keypoints = function(){
		SIFT.generate_keypoints(canvas_active(true), true);
		};
	//create panorama
	this.tools_panorama = function(){
		SIFT.panorama();
		};
	//extract alpha channel
	this.tools_color2alpha = function(){
		POP.add({name: "param1",	title: "Color:",	value: COLOUR,	type: 'color' });
		POP.show('Color to alpha', function(user_response){
				MAIN.save_state();
				var param1 = user_response.param1;
				TOOLS.convert_color_to_alpha(canvas_active(), WIDTH, HEIGHT, param1);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = user_response.param1;
				TOOLS.convert_color_to_alpha(canvas_preview, w, h, param1);
				});
		};
	//expands colors
	this.tools_color_zoom = function(){
		POP.add({name: "param1",	title: "Zoom:",		value: "2", range: [2, 20], });
		POP.add({name: "param2",	title: "Center:",	value: "128",	range: [0, 255] });
		POP.show('Color Zoom', function(user_response){
				MAIN.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);

				TOOLS.color_zoom(canvas_active(), WIDTH, HEIGHT, param1, param2);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);

				TOOLS.color_zoom(canvas_preview, w, h, param1, param2);
				});
		};
	//recover alpha channel values
	this.tools_restore_alpha = function(){
		POP.add({name: "param",	title: "Level:",	value: "128",	range: [0, 255] });
		POP.show('Recover alpha', function(user_response){
				MAIN.save_state();
				var param = parseInt(user_response.param);

				TOOLS.recover_alpha(canvas_active(), WIDTH, HEIGHT, param);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param = parseInt(user_response.param);

				TOOLS.recover_alpha(canvas_preview, w, h, param);
				});
		};
	//adds borders
	this.tools_borders = function(){
		POP.add({name: "param1",	title: "Color:",	value: COLOUR,	type: 'color' });
		POP.add({name: "param2",	title: "Size:",	value: "5",	range: [1, 100] });
		POP.show('Borders', function(user_response){
				MAIN.save_state();
				var param1 = user_response.param1;
				var param2 = parseInt(user_response.param2);
				
				MENU.add_layer();
				TOOLS.add_borders(canvas_active(), WIDTH, HEIGHT, param1, param2);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = user_response.param1;
				var param2 = parseInt(user_response.param2);
				
				TOOLS.add_borders(canvas_preview, w, h, param1, param2);
				});
		};

	//===== Effects ========================================================

	this.effects_bw = function(){
		var default_level = TOOLS.thresholding('otsu', canvas_active(), WIDTH, HEIGHT, true);
		POP.add({name: "param1",	title: "Level:",	value: default_level,	range: [0, 255] });
		POP.add({name: "param2",	title: "Dithering:",	values: ['No', 'Yes'], onchange: "MENU.effects_bw_onchange()" });
		POP.effects = true;
		POP.show('Black and White', function(user_response){
				MAIN.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = false;
				if(user_response.param2 == 'Yes')
					param2 = true;

				DRAW.effect_bw(canvas_active(), WIDTH, HEIGHT, param1, param2);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseInt(user_response.param1);
				var param2 = false;
				if(user_response.param2 == 'Yes')
					param2 = true;

				DRAW.effect_bw(canvas_preview, w, h, param1, param2);
				});
		};
	this.effects_bw_onchange = function(){
		var levels = document.getElementById("pop_data_param1");
		var dithering_no = document.getElementById("pop_data_param2_poptmp0");
		var dithering_yes = document.getElementById("pop_data_param2_poptmp1");
		
		if(dithering_no.checked == true)	levels.disabled = false;
		else if(dithering_yes.checked == true)	levels.disabled = true;
		
		POP.view();
		};
	this.effects_BoxBlur = function(){
		POP.add({name: "param1",	title: "H Radius:",	value: "3",	range: [1, 20] });
		POP.add({name: "param2",	title: "V Radius:",	value: "3",	range: [1, 20] });
		POP.add({name: "param3",	title: "Quality:",	value: "2",	range: [1, 10] });
		POP.effects = true;
		POP.show('Blur-Box', function(user_response){
				MAIN.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.BoxBlur(imageData, param1, param2, param3);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.BoxBlur(imageData, param1, param2, param3);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_GaussianBlur = function(){
		POP.add({name: "param1",	title: "Strength:",	value: "2",	range: [1, 4], step: 0.1 });
		POP.effects = true;
		POP.show('Blur-Gaussian', function(user_response){
				MAIN.save_state();
				var param1 = parseFloat(user_response.param1);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.GaussianBlur(imageData, param1);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseFloat(user_response.param1);

				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.GaussianBlur(imageData, param1);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_StackBlur = function(){
		POP.add({name: "param1",	title: "Radius:",	value: "6",	range: [1, 40] });
		POP.effects = true;
		POP.show('Blur-Stack', function(user_response){
				MAIN.save_state();
				var param1 = parseInt(user_response.param1);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.StackBlur(imageData, param1);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseInt(user_response.param1);
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.StackBlur(imageData, param1);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_zoomblur = function(){
		POP.add({name: "param1",	title: "Strength:",	value: "0.3",	range: [0, 1], step: 0.01 });
		POP.add({name: "param2",	title: "Center x:",	value: round(WIDTH/2),	range: [0, WIDTH] });
		POP.add({name: "param3",	title: "Center y:",	value: round(HEIGHT/2),	range: [0, HEIGHT] });
		POP.effects = true;
		POP.show('Blur-Zoom', function(user_response){
				MAIN.save_state();
				var param1 = parseFloat(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).zoomBlur(param2, param3, param1).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseFloat(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);

				//recalc param by size
				param2 = param2 / WIDTH * w;
				param3 = param3 / HEIGHT * h;

				var texture = fx_filter.texture(canvas_preview.getImageData(0, 0, w, h));
				fx_filter.draw(texture).zoomBlur(param2, param3, param1).update();	//effect
				canvas_preview.drawImage(fx_filter, 0, 0);

				//draw circle
				canvas_preview.beginPath();
				canvas_preview.strokeStyle = "#ff0000";
				canvas_preview.lineWidth = 1;
				canvas_preview.beginPath();
				canvas_preview.arc(param2, param3, 5, 0,Math.PI*2,true);
				canvas_preview.stroke();
				});
		};
	this.effects_bulge_pinch = function(){
		POP.add({name: "param1",	title: "Strength:",	value: 1,	range: [-1, 1],  step: 0.1 });
		var default_value = Math.min(WIDTH, HEIGHT);
		default_value = round(default_value/2);
		POP.add({name: "param2",	title: "Radius:",	value: default_value,	range: [0, 600] });
		POP.effects = true;
		POP.show('Bulge/Pinch', function(user_response){
				MAIN.save_state();
				var param1 = parseFloat(user_response.param1);
				var param2 = parseInt(user_response.param2);

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).bulgePinch(round(WIDTH/2), round(HEIGHT/2), param2, param1).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseFloat(user_response.param1);
				var param2 = parseInt(user_response.param2);

				//recalc param by size
				param2 = param2 / Math.min(WIDTH, HEIGHT) * Math.min(w, h);

				var texture = fx_filter.texture(canvas_preview.getImageData(0, 0, w, h));
				fx_filter.draw(texture).bulgePinch(round(w/2), round(h/2), param2, param1).update();	//effect
				canvas_preview.drawImage(fx_filter, 0, 0);
				});
		};
	this.effects_colorize = function(){
		var colorize_data;

		POP.add({name: "param1",	title: "Power:",	value: "3",	range: [1, 10] });
		POP.add({name: "param2",	title: "Limit:",	value: "30",	range: [10, 200] });
		POP.add({name: "param3",	title: "Dithering:",	values: ["Yes", "No"] });
		POP.preview_in_main = true;
		POP.effects = true;
		POP.show('Auto colorize', function(user_response){
				MAIN.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				if(user_response.param3 == 'Yes') param3 = true; else param3 = false;

				DRAW.colorize(canvas_active(), WIDTH, HEIGHT, param1, param2, param3, colorize_data);
				DRAW.zoom();
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				},
			function(user_response){
				POP.preview_in_main = true;
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				if(user_response.param3 == 'Yes') 
					param3 = true; 
				else 
					param3 = false;

				colorize_data = DRAW.colorize(false, WIDTH, HEIGHT, param1, param2, param3, true);
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				canvas_front.drawImage(canvas_active(true), 0, 0);
				DRAW.colorize(canvas_front, WIDTH, HEIGHT, param1, param2, param3, colorize_data);
				});
		};
	this.effects_denoise = function(){
		POP.add({name: "param1",	title: "Exponent:",	value: "20",	range: [0, 50]  });
		POP.effects = true;
		POP.show('Denoise', function(user_response){
				MAIN.save_state();
				var param1 = parseFloat(user_response.param1);

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).denoise(param1).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseFloat(user_response.param1);

				var texture = fx_filter.texture(canvas_preview.getImageData(0, 0, w, h));
				fx_filter.draw(texture).denoise(param1).update();	//effect
				canvas_preview.drawImage(fx_filter, 0, 0);
				});
		};
	this.effects_Desaturate = function(){
		POP.effects = true;
		POP.show('Desaturate', function(user_response){
				MAIN.save_state();
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Desaturate(imageData);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Desaturate(imageData);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_Dither = function(){
		POP.add({name: "param1",	title: "Levels:",	value: "8",	range: [2, 32] });
		POP.effects = true;
		POP.show('Dither', function(user_response){
				MAIN.save_state();
				var param1 = parseInt(user_response.param1);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Dither(imageData, param1);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseInt(user_response.param1);
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Dither(imageData, param1);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_dot_screen = function(){
		POP.add({name: "param2",	title: "Size:",	value: "3",	range: [1, 20] });
		POP.effects = true;
		POP.show('Dot Screen', function(user_response){
				MAIN.save_state();
				var param2 = parseInt(user_response.param2);

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).dotScreen(round(WIDTH/2), round(HEIGHT/2), 0, param2).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param2 = parseInt(user_response.param2);

				var texture = fx_filter.texture(canvas_preview.getImageData(0, 0, w, h));
				fx_filter.draw(texture).dotScreen(round(w/2), round(h/2), 0, param2).update();	//effect
				canvas_preview.drawImage(fx_filter, 0, 0);
				});
		};
	this.effects_Edge = function(){
		POP.effects = true;
		POP.show('Edge', function(user_response){
				MAIN.save_state();
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Edge(imageData);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Edge(imageData);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_Emboss = function(){
		POP.effects = true;
		POP.show('Emboss', function(user_response){
				MAIN.save_state();
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Emboss(imageData);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Emboss(imageData);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_Enrich = function(){
		POP.effects = true;
		POP.show('Enrich', function(user_response){
				MAIN.save_state();
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Enrich(imageData);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Enrich(imageData);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_Gamma = function(){
		POP.add({name: "param1",	title: "Gamma:",	value: "1",	range: [0, 3], step: 0.1 });
		POP.effects = true;
		POP.show('Gamma', function(user_response){
				MAIN.save_state();
				var param1 = parseFloat(user_response.param1);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Gamma(imageData, param1);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseFloat(user_response.param1);

				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Gamma(imageData, param1);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_Grains = function(){
		POP.effects = true;
		POP.add({name: "param1",	title: "Level:",		value: "30",	range: [0, 50] });
		POP.show('Grains', function(user_response){
				var param1 = parseInt(user_response.param1);
				MAIN.save_state();
				TOOLS.grains_effect(canvas_active(), WIDTH, HEIGHT, param1);
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseInt(user_response.param1);
				TOOLS.grains_effect(canvas_preview, w, h, param1);
				});
		};
	this.effects_heatmap = function(){
		POP.effects = true;
		POP.show('Heatmap', function(user_response){
				MAIN.save_state();
				TOOLS.heatmap_effect(canvas_active(), WIDTH, HEIGHT);
				},
			function(user_response, canvas_preview, w, h){
				TOOLS.heatmap_effect(canvas_preview, w, h);
				});
		};
	this.effects_HSLAdjustment = function(){
		POP.add({name: "param1",	title: "Hue:",	value: "0",	range: [-180, 180] });
		POP.add({name: "param2",	title: "Saturation:",	value: "0",	range: [-100, 100] });
		POP.add({name: "param3",	title: "Luminance:",	value: "0",	range: [-100, 100] });
		POP.effects = true;
		POP.show('HSL Adjustment', function(user_response){
				MAIN.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.HSLAdjustment(imageData, param1, param2, param3);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.HSLAdjustment(imageData, param1, param2, param3);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	//ages photo saving it to jpg many times
	this.effects_jpg_vintage = function(){
		POP.add({name: "param1",	title: "Quality:",	value: 80, range: [1, 100] });
		POP.effects = true;
		POP.show('JPG Compression', function(user_response){
				MAIN.save_state();
				var quality = parseInt(user_response.param1);
				if(quality>100 || quality < 1 || isNaN(quality)==true)
					quality = 80;
				quality = quality/100;
				var data = canvas_active(true).toDataURL('image/jpeg', quality);
				var img = new Image;
				img.onload = function(){
					canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
					canvas_active().drawImage(img, 0, 0);
					};
				img.src = data;
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var quality = parseInt(user_response.param1);
				if(quality>100 || quality < 1 || isNaN(quality)==true)
					quality = 80;
				quality = quality/100;
				var canvas_container = document.getElementById("pop_post");
				var data = canvas_container.toDataURL('image/jpeg', quality);
				var img = new Image;				
				img.onload = function(){
					canvas_preview.clearRect(0, 0, w, h);	
					canvas_preview.drawImage(img, 0, 0);
					};
				img.src = data;
				});
		};
	this.effects_Mosaic = function(){
		POP.add({name: "param1",	title: "Size:",	value: "10",	range: [1, 100] });
		POP.effects = true;
		POP.show('Mosaic', function(user_response){
				MAIN.save_state();
				var param1 = parseInt(user_response.param1);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Mosaic(imageData, param1);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseInt(user_response.param1);
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Mosaic(imageData, param1);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_Oil = function(){
		POP.add({name: "param1",	title: "Range:",	value: "2",	range: [1, 5] });
		POP.add({name: "param2",	title: "Levels:",	value: "32",	range: [1, 256] });
		POP.effects = true;
		POP.show('Oil', function(user_response){
				MAIN.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Oil(imageData, param1, param2);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Oil(imageData, param1, param2);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_perspective = function(){
		POP.add({name: "param1",	title: "X1:",	value: WIDTH/4,		range: [0, WIDTH]  });
		POP.add({name: "param2",	title: "Y1:",	value: HEIGHT/4,	range: [0, HEIGHT]  });
		POP.add({name: "param3",	title: "X2:",	value: WIDTH*3/4,	range: [0, WIDTH]  });
		POP.add({name: "param4",	title: "Y2:",	value: HEIGHT/4,	range: [0, HEIGHT]  });
		POP.add({name: "param5",	title: "X3:",	value: WIDTH*3/4,	range: [0, WIDTH]  });
		POP.add({name: "param6",	title: "Y3:",	value: HEIGHT*3/4,	range: [0, HEIGHT]  });
		POP.add({name: "param7",	title: "X4:",	value: WIDTH/4,		range: [0, WIDTH]  });
		POP.add({name: "param8",	title: "Y4:",	value: HEIGHT*3/4,	range: [0, HEIGHT]  });
		POP.preview_in_main = true;
		POP.effects = true;
		POP.show('Perspective', function(user_response){
				MAIN.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);
				var param4 = parseInt(user_response.param4);
				var param5 = parseInt(user_response.param5);
				var param6 = parseInt(user_response.param6);
				var param7 = parseInt(user_response.param7);
				var param8 = parseInt(user_response.param8);

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).perspective([WIDTH/4, HEIGHT/4, WIDTH*3/4, HEIGHT/4, WIDTH*3/4, HEIGHT*3/4, WIDTH/4, HEIGHT*3/4], [param1,param2,param3,param4,param5,param6,param7,param8]).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);
				DRAW.zoom();
				},
			function(user_response){
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);
				var param4 = parseInt(user_response.param4);
				var param5 = parseInt(user_response.param5);
				var param6 = parseInt(user_response.param6);
				var param7 = parseInt(user_response.param7);
				var param8 = parseInt(user_response.param8);

				canvas_front.rect(0, 0, WIDTH, HEIGHT);
				canvas_front.fillStyle = "#ffffff";
				canvas_front.fill();

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).perspective([WIDTH/4, HEIGHT/4, WIDTH*3/4, HEIGHT/4, WIDTH*3/4, HEIGHT*3/4, WIDTH/4, HEIGHT*3/4], [param1,param2,param3,param4,param5,param6,param7,param8]).update();	//effect
				canvas_front.drawImage(fx_filter, 0, 0);

				pers_square(param1, param2);
				pers_square(param3, param4);
				pers_square(param5, param6);
				pers_square(param7, param8);
				});

		function pers_square(x, y){
			canvas_front.beginPath();
			canvas_front.rect(x-round(CON.sr_size/2), y-round(CON.sr_size/2), CON.sr_size, CON.sr_size);
			canvas_front.fillStyle = "#0000c8";
			canvas_front.fill();
			}
		};
	this.effects_Posterize = function(){
		POP.add({name: "param1",	title: "Levels:",	value: "8",	range: [2, 32] });
		POP.effects = true;
		POP.show('Posterize', function(user_response){
				MAIN.save_state();
				var param1 = parseInt(user_response.param1);

				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Posterize(imageData, param1);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseInt(user_response.param1);
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Posterize(imageData, param1);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_Sepia = function(){
		POP.effects = true;
		POP.show('Sepia', function(user_response){
				MAIN.save_state();
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Sepia(imageData);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				},
			function(user_response, canvas_preview, w, h){
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Sepia(imageData);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_Sharpen = function(){
		POP.add({name: "param1",	title: "Factor:",	value: "3",	range: [1, 10], step: 0.1 });
		POP.effects = true;
		POP.show('Sharpen', function(user_response){
				MAIN.save_state();
				var param1 = parseFloat(user_response.param1);
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Sharpen(imageData, param1);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseFloat(user_response.param1);
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Sharpen(imageData, param1);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_Solarize = function(){
		POP.effects = true;
		POP.show('Solarize', function(user_response){
				MAIN.save_state();
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Solarize(imageData);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				},
			function(user_response, canvas_preview, w, h){
				var imageData = canvas_preview.getImageData(0, 0, w, h);
				var filtered = ImageFilters.Solarize(imageData);	//add effect
				canvas_preview.putImageData(filtered, 0, 0);
				});
		};
	this.effects_tilt_shift = function(){
		//extra
		POP.add({name: "param7",	title: "Saturation:",	value: "5",	range: [0, 100] });
		POP.add({name: "param8",	title: "Sharpen:",	value: "2",	range: [1, 10] });		
		//main
		POP.add({name: "param1",	title: "Blur Radius:",	value: "15",	range: [0, 50] });
		POP.add({name: "param2",	title: "Gradient Radius:",	value: "200",	range: [0, 400] });
		//startX, startY, endX, endY
		POP.add({name: "param3",	title: "X start:",	value: "0",	range: [0, WIDTH] });
		POP.add({name: "param4",	title: "Y start:",	value: round(HEIGHT/2),	range: [0, HEIGHT] });
		POP.add({name: "param5",	title: "X end:",	value: WIDTH,	range: [0, WIDTH] });
		POP.add({name: "param6",	title: "Y end:",	value: round(HEIGHT/2),	range: [0, HEIGHT] });
		POP.effects = true;
		POP.show('Tilt Shift', function(user_response){
				MAIN.save_state();
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);
				var param4 = parseInt(user_response.param4);
				var param5 = parseInt(user_response.param5);
				var param6 = parseInt(user_response.param6);
				var param7 = parseInt(user_response.param7);
				var param8 = parseInt(user_response.param8);

				//main effect
				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).tiltShift(param3, param4, param5, param6, param1, param2).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);

				//saturation
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.HSLAdjustment(imageData, 0, param7, 0);
				canvas_active().putImageData(filtered, 0, 0);

				//sharpen
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.Sharpen(imageData, param8);
				canvas_active().putImageData(filtered, 0, 0);

				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseInt(user_response.param1);
				var param2 = parseInt(user_response.param2);
				var param3 = parseInt(user_response.param3);
				var param4 = parseInt(user_response.param4);
				var param5 = parseInt(user_response.param5);
				var param6 = parseInt(user_response.param6);
				var param7 = parseInt(user_response.param7);
				var param8 = parseInt(user_response.param8);

				//recalc param by size
				var param3 = param3 / WIDTH * w;
				var param4 = param4 / HEIGHT * h;
				var param5 = param5 / WIDTH * w;
				var param6 = param6 / HEIGHT * h;

				//main effect
				var texture = fx_filter.texture(canvas_preview.getImageData(0, 0, w, h));
				fx_filter.draw(texture).tiltShift(param3, param4, param5, param6, param1, param2).update();	//effect
				canvas_preview.drawImage(fx_filter, 0, 0);

				//draw line
				canvas_preview.beginPath();
				canvas_preview.strokeStyle = "#ff0000";
				canvas_preview.lineWidth = 1;
				canvas_preview.moveTo(param3 + 0.5, param4 + 0.5);
				canvas_preview.lineTo(param5 + 0.5, param6 + 0.5);
				canvas_preview.stroke();
				});
		};
	this.effects_vignette = function(){
		POP.add({name: "param1",	title: "Size:",	value: "0.5",	range: [0, 1], step: 0.01 });
		POP.add({name: "param2",	title: "Amount:",	value: "0.5",	range: [0, 1], step: 0.01 });
		POP.effects = true;
		POP.show('Vignette', function(user_response){
				MAIN.save_state();
				var param1 = parseFloat(user_response.param1);
				var param2 = parseFloat(user_response.param2);

				var texture = fx_filter.texture(canvas_active(true));
				fx_filter.draw(texture).vignette(param1, param2).update();	//effect
				canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
				canvas_active().drawImage(fx_filter, 0, 0);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var param1 = parseFloat(user_response.param1);
				var param2 = parseFloat(user_response.param2);

				var texture = fx_filter.texture(canvas_preview.getImageData(0, 0, w, h));
				fx_filter.draw(texture).vignette(param1, param2).update();	//effect
				canvas_preview.drawImage(fx_filter, 0, 0);
				});
		};
	this.effects_vintage = function(){
		POP.add({name: "red_offset",	title: "Color adjust:",		value: "70",	range: [0, 200] });
		POP.add({name: "contrast",	title: "Contrast:",		value: "15",	range: [0, 50] });
		POP.add({name: "blur",		title: "Blur:",			value: "0",	range: [0, 2], step: 0.1 });
		POP.add({name: "light_leak",	title: "Light leak:",		value: "90",	range: [0, 150] });
		POP.add({name: "de_saturation",	title: "Desaturation:",		value: "40",	range: [0, 100] });
		POP.add({name: "exposure",	title: "Exposure level:",	value: "80",	range: [0, 150] });
		POP.add({name: "grains",	title: "Grains level:",		value: "20",	range: [0, 50] });
		POP.add({name: "big_grains",	title: "Big grains level:",	value: "20",	range: [0, 50] });
		POP.add({name: "vignette1",	title: "Vignette size:",	value: "0.3",	range: [0, 0.5], step: 0.01 });
		POP.add({name: "vignette2",	title: "Vignette amount:",	value: "0.5",	range: [0, 0.7], step: 0.01 });
		POP.add({name: "dust_level",	title: "Dusts level:",		value: "70",	range: [0, 100]  });
		POP.effects = true;
		POP.show('Vintage', function(user_response){
				MAIN.save_state();
				var red_offset = parseInt(user_response.red_offset);
				var contrast = parseInt(user_response.contrast);
				var blur = parseFloat(user_response.blur);
				var light_leak = parseInt(user_response.light_leak);
				var de_saturation = parseInt(user_response.de_saturation);
				var exposure = parseInt(user_response.exposure);
				var grains = parseInt(user_response.grains);
				var big_grains = parseInt(user_response.big_grains);
				var vignette1 = parseFloat(user_response.vignette1);
				var vignette2 = parseFloat(user_response.vignette2);
				var dust_level = parseInt(user_response.dust_level);

				VINTAGE.adjust_color(canvas_active(), WIDTH, HEIGHT, red_offset);
				VINTAGE.lower_contrast(canvas_active(), WIDTH, HEIGHT, contrast);
				VINTAGE.blur(canvas_active(), WIDTH, HEIGHT, blur);
				VINTAGE.light_leak(canvas_active(), WIDTH, HEIGHT, light_leak);
				VINTAGE.chemicals(canvas_active(), WIDTH, HEIGHT, de_saturation);
				VINTAGE.exposure(canvas_active(), WIDTH, HEIGHT, exposure);
				VINTAGE.grains(canvas_active(), WIDTH, HEIGHT, grains);
				VINTAGE.grains_big(canvas_active(), WIDTH, HEIGHT, big_grains);
				VINTAGE.optics(canvas_active(), WIDTH, HEIGHT, vignette1, vignette2);
				VINTAGE.dusts(canvas_active(), WIDTH, HEIGHT, dust_level);
				DRAW.zoom();
				},
			function(user_response, canvas_preview, w, h){
				var red_offset = parseInt(user_response.red_offset);
				var contrast = parseInt(user_response.contrast);
				var blur = parseFloat(user_response.blur);
				var light_leak = parseInt(user_response.light_leak);
				var de_saturation = parseInt(user_response.de_saturation);
				var exposure = parseInt(user_response.exposure);
				var grains = parseInt(user_response.grains);
				var big_grains = parseInt(user_response.big_grains);
				var vignette1 = parseFloat(user_response.vignette1);
				var vignette2 = parseFloat(user_response.vignette2);
				var dust_level = parseInt(user_response.dust_level);

				VINTAGE.adjust_color(canvas_preview, w, h, red_offset);
				VINTAGE.lower_contrast(canvas_preview, w, h, contrast);
				VINTAGE.blur(canvas_preview, w, h, blur);
				VINTAGE.light_leak(canvas_preview, w, h, light_leak);
				VINTAGE.chemicals(canvas_preview, w, h, de_saturation);
				VINTAGE.exposure(canvas_preview, w, h, exposure);
				VINTAGE.grains(canvas_preview, w, h, grains);
				VINTAGE.grains_big(canvas_preview, w, h, big_grains);
				VINTAGE.optics(canvas_preview, w, h, vignette1, vignette2);
				VINTAGE.dusts(canvas_preview, w, h, dust_level);
				});
		};

	//===== Help ===========================================================

	//shortcuts
	this.help_shortcuts = function(){
		POP.add({title: "D",		value: 'Dublicate'	});
		POP.add({title: "Del",		value: 'Delete selection'	});
		POP.add({title: "F",		value: 'Auto adjust colors'	});
		POP.add({title: "G",		value: 'Grid on/off'	});
		POP.add({title: "L",		value: 'Rotate left'	});
		POP.add({title: "N",		value: 'New layer'	});
		POP.add({title: "O",		value: 'Open file(s)'	});
		POP.add({title: "R",		value: 'Resize'	});
		POP.add({title: "S",		value: 'Save'	});
		POP.add({title: "T",		value: 'Trim'	});
		POP.add({title: "-",	value: 'Zoom out'	});
		POP.add({title: "+",	value: 'Zoom in'	});
		POP.add({title: "CTRL + Z",	value: 'Undo'	});
		POP.add({title: "CTRL + A",	value: 'Select all'	});
		POP.add({title: "CTRL + V",	value: 'Paste'	});
		POP.add({title: "Arrow keys",	value: 'Move active layer by 10px'	});
		POP.add({title: "CTRL + Arrow keys",	value: 'Move active layer by 50px'	});
		POP.add({title: "SHIFT + Arrow keys",value: 'Move active layer by 1px'	});
		POP.add({title: "Drag & Drop",	value: 'Imports images/xml data'	});
		POP.show('Keyboard Shortcuts', '');
		};
	//credits
	this.help_credits = function(){
		for(var i in CREDITS){
			if(CREDITS[i].link != undefined)
				POP.add({title: CREDITS[i].title,	html: '<a href="'+CREDITS[i].link+'">'+CREDITS[i].name+'</a>'	});
			else
				POP.add({title: CREDITS[i].title,	html: CREDITS[i].name	});
			}
		POP.show('Credits', '');
		};
	//about
	this.help_about = function(){
		POP.add({title: "Name:",	value: "miniPaint "+VERSION	});
		POP.add({title: "Description:",	value: 'online image editor'	});
		POP.add({title: "Author:",	value: AUTHOR	});
		POP.add({title: "Email:",	html: '<a href="mailto:'+EMAIL+'">'+EMAIL+'</a>'	});
		POP.add({title: "Source:",	html: '<a href="https://github.com/viliusle/miniPaint">github.com/viliusle/miniPaint</a>'	});
		POP.show('About', '');
		};

	//======================================================================

	this.save_dialog = function(e){
		//find default format
		var save_default = SAVE_TYPES[0];	//png
		if(HELPER.getCookie('save_default') == 'jpg')
			save_default = SAVE_TYPES[1]; //jpg
		
		POP.add({name: "name",		title: "File name:",		value: [SAVE_NAME]	});
		POP.add({name: "type",		title: "Save as type:",		values: SAVE_TYPES, value: save_default	});	
		POP.add({name: "quality",	title: "Quality (1-100):",	value: 90,		range: [1, 100]	});
		POP.add({name: "layers",	title: "Save layers:",		values: ['All', 'Selected']		});
		POP.add({name: "trim",		title: "Trim:",			values: ['No', 'Yes']		});
		POP.show('Save as ...', MENU.save);
		document.getElementById("pop_data_name").select();
		if(e != undefined)
			e.preventDefault();
		};
	this.add_layer = function(){
		MAIN.save_state();
		
		var tmp = false;
		var last_layer = LAYER.layer_active;
		if(TOOLS.select_data != false){
			tmp = document.createElement("canvas");
			tmp.width = TOOLS.select_data.w;
			tmp.height = TOOLS.select_data.h;
			tmp.getContext("2d").drawImage(canvas_active(true), TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h, 0, 0, TOOLS.select_data.w, TOOLS.select_data.h);
			}
		
		//crete layer
		LAYER.layer_add();
		
		if(TOOLS.select_data != false){
			//copy user selected data to new layer
			canvas_active().drawImage(tmp, 0, 0);
			LAYER.layer_renew();	
			
			//clear selection
			TOOLS.select_data = false;
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			
			//switch back to old layer
			LAYER.layer_active = last_layer;
			LAYER.layer_renew();
			}
		
		};
	this.resize_custom = function(user_response){
		MAIN.save_state();
		CON.autosize = false;
		if(user_response.width != WIDTH || user_response.height != HEIGHT){
			WIDTH = user_response.width;
			HEIGHT = user_response.height;
			RATIO = WIDTH/HEIGHT;
			LAYER.set_canvas_size();
			}
		};
	//prepare rotation - increase doc dimensions if needed
	this.rotate_resize_doc = function(angle, w, h){
		var o = angle*Math.PI/180;
		var new_x = w * Math.abs(Math.cos(o)) + h * Math.abs(Math.sin(o));
		var new_y = w * Math.abs(Math.sin(o)) + h * Math.abs(Math.cos(o));
		new_x = Math.ceil(round(new_x*1000)/1000);
		new_y = Math.ceil(round(new_y*1000)/1000);
		
		if(WIDTH != new_x || HEIGHT != new_y){
			MAIN.save_state();
			var dx = 0;
			var dy = 0;
			if(new_x > WIDTH){
				dx = Math.ceil(new_x - WIDTH)/2;
				WIDTH = new_x;
				}
			if(new_y > HEIGHT){
				dy = Math.ceil(new_y - HEIGHT)/2;
				HEIGHT = new_y;
				}
			RATIO = WIDTH/HEIGHT;
			LAYER.set_canvas_size();
			
			for(var i in LAYERS){
				var layer = document.getElementById(LAYERS[i].name).getContext("2d");
				
				var tmp = layer.getImageData(0, 0, WIDTH, HEIGHT);
				layer.clearRect(0, 0, WIDTH, HEIGHT);
				layer.putImageData(tmp, dx, dy);
				}			
			}
		};
	//rotate layer
	this.rotate_layer = function(user_response, canvas, w, h){
		var TO_RADIANS = Math.PI/180;
		angle = user_response.angle;
		var tempCanvas = document.createElement("canvas");
		var tempCtx = tempCanvas.getContext("2d");
		tempCanvas.width = w;
		tempCanvas.height = h;
		var imageData = canvas.getImageData(0, 0, w, h);
		tempCtx.putImageData(imageData, 0, 0);
		
		//rotate
		canvas.clearRect(0, 0, w, h);
		canvas.save();
		canvas.translate(round(w/2), round(h/2));	
		canvas.rotate(angle * TO_RADIANS);
		canvas.drawImage(tempCanvas, -round(w/2), -round(h/2));
		canvas.restore();
		if(w == WIDTH)	//if main canvas
			DRAW.zoom();
		};
	this.copy_to_clipboard = function(){
		PASTE_DATA = false;
		PASTE_DATA = document.createElement("canvas");
		PASTE_DATA.width = TOOLS.select_data.w;
		PASTE_DATA.height = TOOLS.select_data.h;
		PASTE_DATA.getContext("2d").drawImage(canvas_active(true), TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h, 0, 0, TOOLS.select_data.w, TOOLS.select_data.h);
		};
	this.paste = function(type){
		if(PASTE_DATA == false){
			if(type == 'menu'){
				POP.add({title: "Error:",	value: 'Empty data'	});
				POP.add({title: "Notice:",	value: 'To paste from clipboard, use Ctrl-V.'	});
				POP.show('Notice', '');
				}
			return false;
			}
		
		tmp = new Array();
		var new_name = 'Layer #'+(LAYERS.length+1);
		LAYER.create_canvas(new_name);
		LAYERS.push({name: new_name, visible: true});
		LAYER.layer_active = LAYERS.length-1;
		canvas_active().drawImage(PASTE_DATA, 0, 0);
		LAYER.layer_renew();
		};
	this.resize_box = function(){
		POP.add({name: "width",	title: "Enter new width:",	value: '', placeholder:WIDTH });
		POP.add({name: "height",title: "Enter new height:",	value: '', placeholder:HEIGHT });
		POP.add({name: "mode",	title: "Mode:",	value: "Resample - Hermite", values: ["Resize", "Resample - Hermite"]});
		POP.add({name: "preblur",title: "Pre-Blur:",	values: ["Yes", "No"], value: "No" });
		POP.add({name: "sharpen",title: "Apply sharpen:",	values: ["Yes", "No"], value: "No" });
		POP.show('Resize', MENU.resize_layer);
		};
	this.resize_layer = function(user_response){
		MAIN.save_state();
		var width = parseInt(user_response.width);
		var height = parseInt(user_response.height);
		var preblur = user_response.preblur;
		var sharpen = user_response.sharpen;
		if( (isNaN(width) || width<1) && (isNaN(height) || height<1) ) return false;
		if(width == WIDTH && height == HEIGHT) return false;
		
		//if only 1 dimension was provided
		if(isNaN(width) || isNaN(height)){
			if(isNaN(width) || width<1)
				width = Math.round(height * RATIO);
			if(isNaN(height) || height<1)
				height = Math.round(width / RATIO);
			}
		
		//if increasing size - use simple way - its good enough
		if(width > WIDTH || height > HEIGHT)
			user_response.mode = "Resize";
		
		//anti-artifacting?
		if(preblur == 'Yes'){
			var ratio_w = WIDTH / width;
			var ratio_h = HEIGHT / height;
			var ratio_avg = Math.max(ratio_w, ratio_h);
			var power = ratio_avg * 0.3;
			if(power > 0.6){
				var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
				var filtered = ImageFilters.GaussianBlur(imageData, power);	//add effect
				canvas_active().putImageData(filtered, 0, 0);
				}
			}
		if(width > WIDTH || height > HEIGHT)
			user_response.mode = "Resize";
		//Hermite - good and fast
		if(user_response.mode == "Resample - Hermite"){
			DRAW.resample_hermite(canvas_active(true), WIDTH, HEIGHT, width, height);
			if(MENU.last_menu != 'layer_resize'){
				WIDTH = width;
				HEIGHT = height;
				if(WIDTH<1) WIDTH = 1;
				if(HEIGHT<1) HEIGHT = 1;
				RATIO = WIDTH/HEIGHT;
				LAYER.set_canvas_size();
				}
			DRAW.zoom();
			}
		//simple resize	
		if(user_response.mode == "Resize"){
			//simple resize - FAST
			tmp_data = document.createElement("canvas");
			tmp_data.width = WIDTH;
			tmp_data.height = HEIGHT;
			tmp_data.getContext("2d").drawImage(canvas_active(true), 0, 0);
		
			canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
			if(width <= WIDTH){
				canvas_active().drawImage(tmp_data, 0, 0, width, height);
				}
			else{
				WIDTH = round(width);
				HEIGHT = round(height);	
				RATIO = WIDTH/HEIGHT;
				LAYER.set_canvas_size();
				canvas_active().drawImage(tmp_data, 0, 0, width, height);
				}
			if(MENU.last_menu != 'layer_resize')
				DRAW.trim();
			DRAW.zoom();
			}
		//sharpen after?
		if(sharpen == 'Yes'){
			var imageData = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
			var filtered = ImageFilters.Sharpen(imageData, 1);	//add effect
			canvas_active().putImageData(filtered, 0, 0);
			}
		};
	this.save = function(user_response){
		fname = user_response.name;
		var tempCanvas = document.createElement("canvas");
		var tempCtx = tempCanvas.getContext("2d");
		tempCanvas.width = WIDTH;
		tempCanvas.height = HEIGHT;
		
		//save choosen type
		var save_default = SAVE_TYPES[0];	//png
		if(HELPER.getCookie('save_default') == 'jpg')
			save_default = SAVE_TYPES[1]; //jpg
		if(user_response.type != save_default && user_response.type == SAVE_TYPES[0])
			HELPER.setCookie('save_default', 'png' , 30);
		else if(user_response.type != save_default && user_response.type == SAVE_TYPES[1])
			HELPER.setCookie('save_default', 'jpg' , 30);
		else 
		
		if(MAIN.TRANSPARENCY == false){
			tempCtx.beginPath();
			tempCtx.rect(0, 0, WIDTH, HEIGHT);
			tempCtx.fillStyle = "#ffffff";
			tempCtx.fill();
			}
		
		//take data
		for(var i in LAYERS){
			if(LAYERS[i].visible == false) continue;
			if(user_response.layers == 'Selected' && user_response.type != 'XML' && i != LAYER.layer_active) continue;
			tempCtx.drawImage(document.getElementById(LAYERS[i].name), 0, 0, WIDTH, HEIGHT);
			}
		
		if(user_response.trim == 'Yes' && user_response.type != 'XML'){
			//trim
			var trim_info = DRAW.trim_info(tempCanvas);
			tmp_data = tempCtx.getImageData(0, 0, WIDTH, HEIGHT);
			tempCtx.clearRect(0, 0, WIDTH, HEIGHT);
			tempCanvas.width = WIDTH - trim_info.right - trim_info.left;
			tempCanvas.height = HEIGHT - trim_info.bottom - trim_info.top;
			tempCtx.putImageData(tmp_data, -trim_info.left, -trim_info.top);
			
			}
		
		//detect type
		var parts = user_response.type.split(" ");
		user_response.type = parts[0];
		
		//auto detect?
		if(HELPER.strpos(fname, '.png')==true)		user_response.type = 'PNG';
		else if(HELPER.strpos(fname, '.jpg')==true)	user_response.type = 'JPG';
		else if(HELPER.strpos(fname, '.xml')==true)	user_response.type = 'XML';
		else if(HELPER.strpos(fname, '.bmp')==true)	user_response.type = 'BMP';
		else if(HELPER.strpos(fname, '.webp')==true)	user_response.type = 'WEBP';
		
		//prepare data
		if(user_response.type == 'PNG'){
			//png - default format
			var data = tempCanvas.toDataURL("image/png");
			var data_header = "image/png";
			if(HELPER.strpos(fname, '.png')==false)
				fname = fname+".png";
			}
		else if(user_response.type == 'JPG'){
			//jpg
			var quality = parseInt(user_response.quality);
			if(quality>100 || quality < 1 || isNaN(quality)==true)
				quality = 90;
			quality = quality/100;
			var data = tempCanvas.toDataURL('image/jpeg', quality);
			var data_header = "image/jpeg";
			if(HELPER.strpos(fname, '.jpg')==false)
				fname = fname+".jpg";
			}
		else if(user_response.type == 'BMP'){
			//bmp - lets hope user really needs this - chrome do not support it
			var data = tempCanvas.toDataURL("image/bmp");
			var data_header = "image/bmp";
			if(HELPER.strpos(fname, '.bmp')==false)
				fname = fname+".bmp";
			}
		else if(user_response.type == 'WEBP'){
			//WEBP - new format for chrome only
			if(HELPER.strpos(fname, '.webp')==false)
				fname = fname+".webp";
			var data_header = "image/webp";
			var data = tempCanvas.toDataURL("image/webp");
			}
		else if(user_response.type == 'XML'){
			//xml - full data with layers
			if(HELPER.strpos(fname, '.xml')==false)
				fname = fname+".xml";
			var data_header = "text/plain";
			
			var XML = '';
			//basic info
			XML += "<xml>\n";
			XML += "	<info>\n";
			XML += "		<width>"+WIDTH+"</width>\n";
			XML += "		<height>"+HEIGHT+"</height>\n";
			XML += "	</info>\n";
			//add layers info
			XML += "	<layers>\n";
			for(var i in LAYERS){			
				XML += "		<layer>\n";
				XML += "			<name>"+LAYERS[i].name+"</name>\n";
				if(LAYERS[i].visible == true)
					XML += "			<visible>1</visible>\n";
				else
					XML += "			<visible>0</visible>\n";
				XML += "			<opacity>"+LAYERS[i].opacity+"</opacity>\n";
				XML += "		</layer>\n";
				}
			XML += "	</layers>\n";
			//add data ???
			XML += "	<image_data>\n";
			for(var i in LAYERS){
				var data_tmp = document.getElementById(LAYERS[i].name).toDataURL("image/png");	
				XML += "		<data>\n";
				XML += "			<name>"+LAYERS[i].name+"</name>\n";
				XML += "			<data>"+data_tmp+"</data>\n";
				XML += "		</data>\n";
				}
			XML += "	</image_data>\n";
			XML += "</xml>\n";
				
			var bb = new Blob([XML], {type: data_header});
			var data = window.URL.createObjectURL(bb);
			}
		else
			return false;
		
		//check support
		var actualType = data.replace(/^data:([^;]*).*/, '$1');
		if(data_header != actualType && data_header != "text/plain"){
			//error - no support
			POP.add({title: "Error:",	value: "Your browser do not support "+user_response.type	});
			POP.show('Sorry', '');
			return false;
			}
			
		//push data to user
		window.URL = window.webkitURL || window.URL;
		var a = document.createElement('a');
		if (typeof a.download != "undefined"){
			//a.download is supported
			a.setAttribute("id", "save_data");
			a.download = fname;
			a.href = data;
			a.textContent = 'Downloading...';
			document.getElementById("tmp").appendChild(a);
			
			//release memory
			a.onclick = function(e){
				MENU.save_cleanup(this);
				};
			//force click
			document.querySelector('#save_data').click();
			}
		else{
			//poor browser or poor user - not sure here. No support
			if(user_response.type == 'PNG')
				window.open(data);
			else if(user_response.type == 'JPG')
				window.open(data, quality);
			}
		};
	this.save_cleanup = function(a){
		a.textContent = 'Downloaded';
		setTimeout(function(){
			a.href = '';
			var element = document.getElementById("save_data");
			element.parentNode.removeChild(element);
			}, 1500);
		};
	this.open = function(){
		document.getElementById("tmp").innerHTML = '';
		var a = document.createElement('input');
		a.setAttribute("id", "file_open");
		a.type = 'file';
		a.multiple = 'multiple ';
		document.getElementById("tmp").appendChild(a);
		document.getElementById('file_open').addEventListener('change', MENU.open_handler, false);
		
		//force click
		document.querySelector('#file_open').click();
		};
	this.open_handler = function(e){
		var files = e.target.files; 
		for (var i = 0, f; i < files.length; i++){
			f = files[i];
			if(!f.type.match('image.*') && f.type != 'text/xml') continue;
			if(files.length == 1)
				SAVE_NAME = f.name.split('.')[f.name.split('.').length - 2];
			
			var FR = new FileReader();
			FR.file = e.target.files[i];
			
			FR.onload = function(event){
				if(this.file.type != 'text/xml'){
					//image
					LAYER.layer_add(this.file.name, event.target.result, this.file.type);
					EXIF.getData(this.file, TOOLS.save_EXIF);
					}
				else{
					//xml
					var responce = MAIN.load_xml(event.target.result);
					if(responce === true)
						return false;
					}
				
				//finish progress
				var progress = document.getElementById('uploadprogress');
				progress.value = progress.innerHTML = 100;
				progress.style.display='none';
				};		
			FR.onprogress = (function(e){
				return function(e){
				 	var complete = (e.loaded / e.total * 100 | 0);
				 	var progress = document.getElementById('uploadprogress');
					progress.value = progress.innerHTML = complete;
					};
				})(f);
			if(f.type == "text/plain")
				FR.readAsText(f);
			else if(f.type == "text/xml")
				FR.readAsText(f);	
			else
				FR.readAsDataURL(f);
			}
		};	
	}
