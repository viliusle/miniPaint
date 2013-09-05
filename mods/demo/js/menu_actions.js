var MENU = new MENU_CLASS();

function MENU_CLASS(){
	this.last_menu = '';
	var PASTE_DATA = false;
	
	this.do_menu = function(name){
		MENU.last_menu = name;

		//===== File ===========================================================
		
		//new
		if(name == 'file_new'){
			//ZOOM = 100;
			//MAIN.init();
			
			POP.add({name: "width",		title: "Width:",	value: WIDTH,	});
			POP.add({name: "height",	title: "Height:",	value: HEIGHT,	});	
			POP.add({name: "transparency",	title: "Transparent:", 	values: ['Yes', 'No'],});
			POP.show('New file...', function(response){
				var width = parseInt(response.width);
				var height = parseInt(response.height);
				var transparency = response.transparency;
				
				if(response.transparency == 'Yes')
					MAIN.TRANSPARENCY = true;
				else
					MAIN.TRANSPARENCY = false;
				//DRAW.draw_background(canvas_back, WIDTH, HEIGHT);
				
				ZOOM = 100;
				WIDTH = width;
				HEIGHT = height;
				RATIO = WIDTH/HEIGHT;
				MAIN.init();
				});
			}
		//open
		else if(name == 'file_open'){
			MENU.open();
			}
		//save
		else if(name == 'file_save'){
			POP.add({name: "name",		title: "File name:",	value: ["example"],	});
			POP.add({name: "type",		title: "Save as type:",	values: SAVE_TYPES,	});	
			POP.add({name: "quality",	title: "Quality (1-100) (optional):",	value: 92, range: [1, 100],	});
			POP.show('Save as ...', MENU.save);
			}
		//print
		else if(name == 'file_print'){
			window.print();
			}
			
		//===== Edit ===========================================================
		
		//undo
		else if(name == 'edit_undo'){
			MAIN.undo();
			}
		//cut
		else if(name == 'edit_cut'){
			MAIN.save_state();
			if(TOOLS.select_data != false){
				this.copy_to_clipboard();
				canvas_active().clearRect(TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h);
				TOOLS.select_data = false;
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				}
			}
		//copy
		else if(name == 'edit_copy'){
			if(TOOLS.select_data != false)
				this.copy_to_clipboard();
			}
		//paste
		else if(name == 'edit_paste'){
			MAIN.save_state();
			this.paste('menu');
			}

		//select all
		else if(name == 'edit_select'){
			TOOLS.select_data = {
				x: 	0,
				y: 	0,
				w: 	WIDTH,
				h: 	HEIGHT,
				};
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			HELPER.dashedRect(canvas_front, 0, 0, WIDTH, HEIGHT);
			}
		//clear selection
		else if(name == 'edit_clear'){
			TOOLS.select_data = false;
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			}
		
		//===== Image ==========================================================
		
		//information
		else if(name == 'image_information'){
			var colors = TOOLS.unique_colors_count(canvas_active(true));
			colors = HELPER.format("#,##0.####", colors);
			
			POP.add({title: "Width:",	value: WIDTH,	});
			POP.add({title: "Height:",	value: HEIGHT,	});
			POP.add({title: "Unique colors:",	value: colors,	});
			POP.show('Information', '');
			}
		//size
		else if(name == 'image_size'){
			POP.add({name: "width",		title: "Width:",	value: WIDTH,	});
			POP.add({name: "height",	title: "Height:",	value: HEIGHT,	});	
			POP.show('Attributes', this.resize_custom);
			}
		//trim
		else if(name == 'image_trim'){
			MAIN.save_state();
			DRAW.trim();
			}
		//crop
		else if(name == 'image_crop'){
			MAIN.save_state();
			if(TOOLS.select_data == false){
				POP.add({title: "Error:",	value: 'Select are first',	});
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
				}
			}	
		//resize
		else if(name == 'image_resize')
			MENU.resize_box();
		//rotate left
		else if(name == 'image_rotate_left'){
			MAIN.save_state();
			MENU.rotate_layer({angle: 270}, canvas_active(), WIDTH, HEIGHT);
			}
		//rotate right
		else if(name == 'image_rotate_right'){
			MAIN.save_state();
			MENU.rotate_layer({angle: 90}, canvas_active(), WIDTH, HEIGHT);
			}
		//rotate
		else if(name == 'image_rotate'){
			POP.add({name: "angle", 	title: "Enter angle (0-360):",	value: 0, range: [0, 360],	});
			POP.show('Rotate', function(response){
					MAIN.save_state();
					MENU.rotate_resize_doc(response.angle, WIDTH, HEIGHT); 
					MENU.rotate_layer(response, canvas_active(), WIDTH, HEIGHT); 
					},
				function(response, canvas_preview, w, h){
					MENU.rotate_layer(response, canvas_preview, w, h); 
					});
			}
		//vertical flip
		else if(name == 'image_vflip'){
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
			}
		//horizontal flip
		else if(name == 'image_hflip'){
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
			}
		//auto adjust colors
		else if(name == 'image_auto_adjust'){
			MAIN.save_state();
			DRAW.auto_adjust(canvas_active(), WIDTH, HEIGHT);
			}
		//enchance colors
		else if(name == 'image_decrease_colors'){
			POP.add({name: "param1",	title: "Colors:",	value: "10",	range: [2, 100], });
			POP.add({name: "param2",	title: "Dithering:",	values: ["Yes", "No"], });
			POP.add({name: "param3",	title: "Greyscale:",	values: ["Yes", "No"], value: "No", });
			POP.show('Decrease colors', function(user_response){
				MAIN.save_state();
				var param1 = parseInt(user_response.param1);
				if(user_response.param2 == 'Yes') param2 = true; else param2 = false;
				if(user_response.param3 == 'Yes') param3 = true; else param3 = false;

				DRAW.decrease_colors(canvas_active(), WIDTH, HEIGHT, param1, param2, param3);
				DRAW.zoom();
				});
			}	
		//negative
		else if(name == 'image_negative'){
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
				canvas_active().putImageData(imageData, TOOLS.select_data.x, TOOLS.select_data.y)
			}
		//grid
		else if(name == 'image_grid'){
			if(MAIN.grid == false){
				POP.add({name: "gap_x",		title: "Horizontal gap:",	value: "50",	});
				POP.add({name: "gap_y",		title: "Vertical gap:",	value: "50",	});	
				POP.show('Grid', function(response){
					gap_x = response.gap_x;
					gap_y = response.gap_y;
					MAIN.grid = true;
					DRAW.draw_grid(canvas_back, gap_x, gap_y);
					DRAW.zoom();
					});
				}
			else{
				MAIN.grid = false;
				canvas_back.clearRect(0, 0, WIDTH, HEIGHT);
				DRAW.draw_background(canvas_back, WIDTH, HEIGHT);
				}
			}
		//histogram
		else if(name == 'image_histogram'){
			TOOLS.histogram();
			}
			
		//===== Layer ==========================================================
		
		//new layer
		else if(name == 'layer_new'){
			MAIN.save_state();
			LAYER.layer_add();
			}
		//dublicate
		else if(name == 'layer_dublicate'){
			MAIN.save_state();
			//copy
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
		//show / hide
		else if(name == 'layer_show_hide'){
			LAYER.layer_visibility(LAYER.layer_active);
			}
		//delete
		else if(name == 'layer_delete'){
			MAIN.save_state();
			LAYER.layer_remove(LAYER.layer_active);
			}
		//move up
		else if(name == 'layer_move_up'){
			MAIN.save_state();
			LAYER.move_layer('up');
			}
		//move down
		else if(name == 'layer_move_down'){
			MAIN.save_state();
			LAYER.move_layer('down');
			}
		//opacity
		else if(name == 'layer_opacity'){
			LAYER.set_alpha();
			}
		//trim
		else if(name == 'layer_trim'){
			MAIN.save_state();
			DRAW.trim(LAYERS[LAYER.layer_active].name, true);
			}
		//resize
		else if(name == 'layer_resize')
			MENU.resize_box();
		//clear
		else if(name == 'layer_clear'){
			MAIN.save_state();
			canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
			}
		//show differences
		else if(name == 'layer_differences'){
			if(parseInt(LAYER.layer_active) + 1 >= LAYERS.length){
				POP.add({title: "Error:",	value: 'This can not be last layer',	});
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
			}	
		//merge
		else if(name == 'layer_merge_down'){
			var compositions = ["source-over", "source-in", "source-out", "source-atop", 
						"destination-over", "destination-in", "destination-out", "destination-atop",
						"lighter", "darker", "copy", "xor"];
			
			if(parseInt(LAYER.layer_active) + 1 >= LAYERS.length){
				POP.add({title: "Error:",	value: 'This can not be last layer',	});
				POP.show('Error', '');
				return false;
				}
			POP.add({name: "param1", 	title: "Composition:",	values: compositions,	 });
			POP.show('Merge', function(response){
					var param1 = response.param1;
					
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
					LAYER.canvas_active().globalCompositeOperation = param1;
					LAYER.canvas_active().drawImage(tmp_data, 0, 0);
					LAYER.canvas_active().restore();
					
					//remove next layer
					LAYER.layer_remove(LAYER.layer_active+1);
					LAYER.layer_renew();
					},
				function(response, canvas_preview, w, h){
					var param1 = response.param1;
					
					//copy
					LAYER.layer_active++;
					var tmp_data = document.createElement("canvas");
					tmp_data.width = w;
					tmp_data.height = h;
					tmp_data.getContext("2d").drawImage(LAYER.canvas_active(true), 0, 0, WIDTH, HEIGHT, 0, 0, w, h);
					
					//paste
					LAYER.layer_active--;
					canvas_preview.save();
					canvas_preview.globalCompositeOperation = param1;
					canvas_preview.drawImage(tmp_data, 0, 0);
					canvas_preview.restore();
					});
			}
		//flatten all
		else if(name == 'layer_flatten'){
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
			}
		//sprites
		else if(name == 'layer_sprites'){
			POP.add({name: "param1", 	title: "Offset:",	value: "50",	values: ["0", "10", "50", "100"] });
			POP.show('Sprites', function(response){
				MAIN.save_state();
				var param1 = parseInt(response.param1);
				TOOLS.generate_sprites(param1);
				});
			}
			
		//===== Effects ========================================================
		
		else if(name == 'effects_bw'){
			POP.add({name: "param1",	title: "Level:",	value: "125",	range: [0, 255], });
			POP.show('Black and White', function(user_response){
					MAIN.save_state();
					var param1 = parseInt(user_response.param1);

					DRAW.effect_bw(canvas_active(), WIDTH, HEIGHT, param1);
					DRAW.zoom();
					},
				function(user_response, canvas_preview, w, h){
					var param1 = parseInt(user_response.param1);
					
					DRAW.effect_bw(canvas_preview, w, h, param1);
					});
			}
		else if(name == 'effects_colorize'){
			var colorize_data;
			
			POP.add({name: "param1",	title: "Power:",	value: "3",	range: [1, 10], });
			POP.add({name: "param2",	title: "Limit:",	value: "30",	range: [10, 200], });
			POP.add({name: "param3",	title: "Dithering:",	values: ["Yes", "No"], });
			POP.add({title: "Shortcut:",	value: "C", });
			POP.preview_in_main = true;
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
					var param1 = parseInt(user_response.param1);
					var param2 = parseInt(user_response.param2);
					if(user_response.param3 == 'Yes') param3 = true; else param3 = false;
					
					colorize_data = DRAW.colorize(canvas_preview, WIDTH, HEIGHT, param1, param2, param3, true);
					canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
					canvas_front.drawImage(canvas_active(true), 0, 0);
					DRAW.colorize(canvas_front, WIDTH, HEIGHT, param1, param2, param3, colorize_data);
					});
			}
		else if(name == 'effects_GrayScale'){
			MAIN.save_state();
			DRAW.effect_greyscale(canvas_active(), WIDTH, HEIGHT);
			DRAW.zoom();
			}
		
		//===== Help ===========================================================
		
		//shortcuts
		else if(name == 'help_shortcuts'){
			POP.add({title: "C",		value: 'Colorize',	});
			POP.add({title: "Del",		value: 'Delete selection',	});
			POP.add({title: "F",		value: 'Auto adjust colors',	});
			POP.add({title: "G",		value: 'Grid on/off',	});
			POP.add({title: "L",		value: 'Rotate left',	});
			POP.add({title: "O",		value: 'Open file(s)',	});
			POP.add({title: "R",		value: 'Resize',	});
			POP.add({title: "S",		value: 'Save',	});
			POP.add({title: "T",		value: 'Trim',	});
			POP.add({title: "-",	value: 'Zoom out',	});
			POP.add({title: "+",	value: 'Zoom in',	});
			POP.add({title: "CTRL + Z",	value: 'Undo',	});
			POP.add({title: "CTRL + A",	value: 'Select all',	});
			POP.add({title: "CTRL + X",	value: 'Cut',	});
			POP.add({title: "CTRL + C",	value: 'Copy',	});
			POP.add({title: "CTRL + V",	value: 'Paste',	});
			POP.add({title: "Arrow keys",	value: 'Move active layer by 10px',	});
			POP.add({title: "CTRL + Arrow keys",	value: 'Move active layer by 50px',	});
			POP.add({title: "SHIFT + Arrow keys",value: 'Move active layer by 1px',	});
			POP.add({title: "Drag & Drop",	value: 'Imports images/xml data',	});
			POP.show('Keyboard Shortcuts', '');
			}
		//about	
		else if(name == 'help_about'){
			POP.add({title: "Name:",	value: "mPaint Demo "+VERSION,	});
			POP.add({title: "Description:",	value: 'online image editor',	});
			POP.add({title: "Author:",	value: AUTHOR+" - "+EMAIL,	});
			POP.show('About', '');
			}
		
		//======================================================================
		
		//close menu
		$('.menu').find('.active').removeClass('active');
		DRAW.zoom();
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
				POP.add({title: "Error:",	value: 'Empty data',	});
				POP.add({title: "Notice:",	value: 'To paste from clipboard, use Ctrl-V.',	});
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
		POP.add({name: "width",	title: "Enter new width:",	value: WIDTH,});
		POP.add({name: "height",title: "Enter new height:",	value: HEIGHT});
		POP.add({name: "mode",	title: "Mode:",	value: "Resample - Hermite", values: ["Resize", "Resample - Hermite"],});
		POP.add({name: "ratio",title: "Preserve ratio:",	values: ["Yes", "No"]});
		POP.show('Resize', MENU.resize_layer);
		};
	this.resize_layer = function(user_response){
		MAIN.save_state();
		var width = parseInt(user_response.width);
		var height = parseInt(user_response.height);
		var ratio_mode = user_response.ratio;
		var preblur = user_response.preblur;
		var sharpen = user_response.sharpen;
		if(isNaN(width) || width<1) return false;
		if(isNaN(height) || height<1) return false;
		
		//if increasing size - use simple way - its good enough
		if(width > WIDTH || height > HEIGHT)
			user_response.mode = "Resize";
		
		//Hermite - good and fast
		if(user_response.mode == "Resample - Hermite"){
			if(ratio_mode == 'Yes'){
				if(width / height > RATIO)
					width = Math.round(height * RATIO);
				else
					height = Math.round(width / RATIO);
					}
			if(width == WIDTH && height == HEIGHT) return false;
			if(width > WIDTH || height > HEIGHT) return false;
			
			DRAW.resample_hermite(canvas_active(true), WIDTH, HEIGHT, width, height);
			if(MENU.last_menu != 'layer_resize')
				DRAW.trim();
			DRAW.zoom();
			}
		//simple resize	
		else if(user_response.mode == "Resize"){
			//simple resize - FAST
			if(ratio_mode == 'Yes'){
				if(width / height > RATIO)
					width = round(height * RATIO);
				else
					height = round(width / RATIO);
					}		
			
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
		};
	this.save = function(user_response){
		fname = user_response.name;
		var tempCanvas = document.createElement("canvas");
		var tempCtx = tempCanvas.getContext("2d");
		tempCanvas.width = WIDTH;
		tempCanvas.height = HEIGHT;
		if(MAIN.TRANSPARENCY == false){
			tempCtx.beginPath();
			tempCtx.rect(0, 0, WIDTH, HEIGHT);
			tempCtx.fillStyle = "#ffffff";
			tempCtx.fill();
			}
		for(var i in LAYERS){
			if(LAYERS[i].visible == false) continue;
			tempCtx.drawImage(document.getElementById(LAYERS[i].name), 0, 0, WIDTH, HEIGHT);
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
				quality = 92;
			quality = quality/100;
			var data = tempCanvas.toDataURL('image/jpeg', quality);
			var data_header = "image/jpeg";
			if(HELPER.strpos(fname, '.jpg')==false)
				fname = fname+".jpg";
			}
		else if(user_response.type == 'BMP'){
			//bmp - lets hope user really needs this - disabled - chrome dod not supprot it
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
			POP.add({title: "Error:",	value: "Your browser do not support "+user_response.type,	});
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
		for (var i = 0, f; f = files[i]; i++){
			if(!f.type.match('image.*') && f.type != 'text/xml') continue;
			
			var FR = new FileReader();
			FR.file = e.target.files[i];
			
			FR.onload = function(event){
				if(this.file.type != 'text/xml'){
					//image
					LAYER.layer_add(this.file.name, event.target.result, this.file.type);
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
