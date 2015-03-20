var CON = new CONTROLLS_CLASS();

//keyboard handlers
document.onkeydown = function(e) {return CON.on_keyboard_action(e); };
document.onkeyup = function(e) {return CON.on_keyboardup_action(e); };
//mouse
window.ondrop = function(e){ CON.upload_drop(e); };		//drop
window.ondragover = function(e){e.preventDefault();  };
document.onmousedown = CON.mouse_click;	//mouse click
document.onmousemove = CON.mouse_move;	//mouse move
document.onmouseup = CON.mouse_release;	//mouse resease
document.addEventListener("mousewheel", CON.mouse_wheel_handler, false);	//mouse scroll
document.addEventListener("DOMMouseScroll", CON.mouse_wheel_handler, false);	//mouse scroll
window.onresize = CON.calc_preview_auto;					//window resize
document.oncontextmenu = function(e) {return CON.mouse_right_click(e); };	//mouse right click

function CONTROLLS_CLASS(){
	this.mouse;
	this.ctrl_pressed = false; //17
	this.shift_pressed = false; //16
	this.ZOOM_X = 0;
	this.ZOOM_Y = 0;
	this.mini_rect_data = { w: 0, h:0 };
	this.isDrag = false;
	this.sr_size = 8;	//selected area resize rects size
	this.clear_front_on_release = true;
	var autosize = true;
	var mouse_click_x = false;
	var mouse_click_y = false;
	var mouse_x_move_last = false;
	var mouse_y_move_last = false;
	var resize_all = false;
	var mouse_click_valid = false;
	var last_pop_click = [0, 0];
	var popup_pos_top = 0;
	var popup_pos_left = 0;
	var popup_dragable = false;
	
	//keyboard actions
	this.on_keyboard_action = function(event){
		k = event.keyCode;	//console.log(k);
		
		if(POP != undefined && POP.active==true && k != 27) return true;
		if(document.activeElement.type == 'text') return true;
		
		//up
		if(k == 38){
			if(ACTION=='select_tool'){
				MAIN.save_state();
				LAYER.layer_move_active(0, -1);
				return false;
				}
			}
		//down
		else if(k == 40){
			if(ACTION=='select_tool'){
				MAIN.save_state();
				LAYER.layer_move_active(0, 1);
				return false;
				}
			}
		//left
		else if(k == 39){
			if(ACTION=='select_tool'){
				MAIN.save_state();
				LAYER.layer_move_active(1, 0);
				return false;
				}
			}
		//right
		else if(k == 37){
			if(ACTION=='select_tool'){
				MAIN.save_state();
				LAYER.layer_move_active(-1, 0);
				return false;
				}
			}
		//esc
		else if(k == 27){		
			if(POP != undefined && POP.active == true)
				POP.hide();
			delete TOOLS.last_line_x;
			delete TOOLS.last_line_y;
			TOOLS.curve_points = [];
			if(TOOLS.select_data != false){
				TOOLS.select_data = false;
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				TOOLS.select_square_action = '';
				}
			}
		//z - undo
		else if(k == 90){
			//undo
			if(CON.ctrl_pressed==true)
				MAIN.undo();
			}
		//t - trim
		else if(k == 84){
			MAIN.save_state();
			DRAW.trim();
			}
		//o - open
		else if(k == 79)
			MENU.open();
		//s - save
		else if(k == 83){
			if(POP != undefined)
				MENU.save_dialog(event);
			}
		//l - rotate left
		else if(k == 76){
			MAIN.save_state();
			MENU.rotate_resize_doc(270, WIDTH, HEIGHT); 
			MENU.rotate_layer({angle: 270}, canvas_active(), WIDTH, HEIGHT);
			}
		//r - resize
		else if(k == 82)
			MENU.resize_box();
		//grid
		else if(k==71){
			if(MAIN.grid == false)
				MAIN.grid = true;
			else
				MAIN.grid = false;
			DRAW.draw_grid();	
			}
		//del
		else if(k==46){
			if(TOOLS.select_data != false){
				MAIN.save_state();
				canvas_active().clearRect(TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h);
				TOOLS.select_data = false;
				TOOLS.select_square_action = '';
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				}
			}
		//shift
		else if(k==16)
			CON.shift_pressed = true; 
		//ctrl
		else if(k==17){
			if(CON.ctrl_pressed == false)
				CON.ctrl_pressed = true;
			}
		//d
		else if(k==68){
			MENU.do_menu(['layer_dublicate']);
			}
		//a
		else if(k==65){
			if(CON.ctrl_pressed == true){
				TOOLS.select_data = {
					x: 	0,
					y: 	0,
					w: 	WIDTH,
					h: 	HEIGHT
					};
				TOOLS.draw_selected_area();
				return false;
				}
			}
		//v
		else if(k==86){
			MAIN.save_state();
			if(CON.ctrl_pressed == true)
				MENU.paste();
			}
		//f - fix images
		else if(k==70){
			MAIN.save_state();
			DRAW.auto_adjust(canvas_active(), WIDTH, HEIGHT);
			}
		//h - histogram	
		else if(k==72){
			TOOLS.histogram();
			}
		//-
		else if(k==109)
			DRAW.zoom(-1);
		//+
		else if(k==107)
			DRAW.zoom(+1);
		//n - new layer
		else if(k==78)
			MENU.add_layer();
		
		//mac support - ctrl
		if(k==17 || event.metaKey || event.ctrlKey){
			if(CON.ctrl_pressed == false)
				CON.ctrl_pressed = true;
			}
		
		DRAW.zoom();
		return true;
		};
	//keyboard release
	this.on_keyboardup_action = function(event){
		k = event.keyCode;
		//shift
		if(k==16)
			CON.shift_pressed = false;
		//ctrl
		else if(k==17)
			CON.ctrl_pressed = false;
		//mac support - ctrl
		if(event.metaKey || event.ctrlKey || event.key == 'Meta')
			CON.ctrl_pressed = false;
		};
	// mouse_x, mouse_y, event.pageX, event.pageY
	this.get_mouse_position = function(event){
		var valid = true;
		if(event.offsetX) {
			mouse_rel_x = event.offsetX;
			mouse_rel_y = event.offsetY;
			}
		else if(event.layerX) {
			mouse_rel_x = event.layerX;
			mouse_rel_y = event.layerY;
			}
		else
			return false;
		mouse_x = event.pageX;
		mouse_y = event.pageY;
		var abs_x = event.pageX;
		var abs_y = event.pageY;
		
		if(event.target.id == "canvas_front"){
			//in canvas area - relative pos
			mouse_x = mouse_rel_x;
			mouse_y = mouse_rel_y;
			if(ZOOM != 100 ){
				mouse_x = Math.floor(mouse_x / ZOOM * 100);
				mouse_y = Math.floor(mouse_y / ZOOM * 100);
				}
			}
		else{
			//outside canvas - absolute pos - canvas offset
			mouse_x = mouse_x - 109;
			mouse_y = mouse_y - 34;
			valid = false;
			}
		if(event.target.id == "canvas_preview"){
			//in preview area - relative pos
			mouse_x = mouse_rel_x;
			mouse_y = mouse_rel_y;
			}

		//save - other place will use it too
		CON.mouse = {
			x: mouse_x,
			y: mouse_y, 
			click_x: mouse_click_x,
			click_y: mouse_click_y,
			last_x: mouse_x_move_last,
			last_y: mouse_y_move_last,
			valid: valid,
			click_valid: mouse_click_valid,
			abs_x: abs_x,
			abs_y: abs_y
			};
		};
	//mouse right click
	this.mouse_right_click = function(event){
		if(POP != undefined && POP.active==true) return true;
		CON.get_mouse_position(event);
		mouse_click_x = CON.mouse.x;
		mouse_click_y = CON.mouse.y;
		
		for (i in TOOLS){
			if(i == ACTION){
				return TOOLS[i]('right_click', CON.mouse, event);
				break;
				}
			}
		};
	//mouse click
	this.mouse_click = function(event){
		CON.isDrag = true;
		if(POP != undefined && POP.active==true){
			CON.get_mouse_position(event);
			last_pop_click[0] = CON.mouse.abs_x;
			last_pop_click[1] = CON.mouse.abs_y;
			popup = document.getElementById('popup');
			popup_pos_top = parseInt(popup.style.top);
			popup_pos_left = parseInt(popup.style.left);
			if(event.target.id == "popup_drag")
				popup_dragable = true;
			else
				popup_dragable = false;
			return true;
			}
		if(event.which == 3) return true;
		CON.get_mouse_position(event);
		mouse_click_x = CON.mouse.x;	
		mouse_click_y = CON.mouse.y;
		if(CON.mouse.valid == false)
			mouse_click_valid = false;
		else
			mouse_click_valid = true;
		
		
		//check tools functions
		for (i in TOOLS){
			if(i == ACTION){
				TOOLS[i]('click', CON.mouse, event);
				break;
				}
			}
			
		if(event.target.id == "canvas_preview") 
			CON.calc_preview_by_mouse(CON.mouse.x, CON.mouse.y);	
		
		//main window resize
		resize_all = false;
		if(ZOOM == 100){
			if(event.target.id == "resize-w")	resize_all = "w";
			else if(event.target.id == "resize-h")	resize_all = "h";
			else if(event.target.id == "resize-wh")	resize_all = "wh";
			}
		};
	//mouse move
	this.mouse_move = function(event){
		if(POP != undefined && POP.active==true){
			//drag popup
			if(CON.isDrag==true && popup_dragable == true){
				CON.get_mouse_position(event);
				popup = document.getElementById('popup');
				popup.style.top = (popup_pos_top + CON.mouse.abs_y - last_pop_click[1])+'px';
				popup.style.left = (popup_pos_left + CON.mouse.abs_x - last_pop_click[0])+'px';
				}
			return true;
			}
		CON.get_mouse_position(event);
		if(event.target.id == "canvas_preview" && CON.isDrag==true)
			CON.calc_preview_by_mouse(CON.mouse.x, CON.mouse.y);
		LAYER.update_info_block();
		
		//main window resize
		if(ZOOM == 100){
			if(event.target.id == "resize-w")	document.body.style.cursor = "w-resize";
			else if(event.target.id == "resize-h")	document.body.style.cursor = "n-resize";
			else if(event.target.id == "resize-wh")	document.body.style.cursor = "nw-resize";
			else					document.body.style.cursor = "auto";
			if(resize_all != false && CON.isDrag==true){
				document.body.style.cursor = "auto";
				if(resize_all == "w"){
					new_w = CON.mouse.x;
					new_h = HEIGHT;
					}
				else if(resize_all == "h"){
					new_w = WIDTH;
					new_h = CON.mouse.y;
					}
				else if(resize_all == "wh"){
					new_w = CON.mouse.x;
					new_h = CON.mouse.y;
					}
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				canvas_front.lineWidth = 1;
				canvas_front.fillStyle = "#ff0000";
				HELPER.dashedRect(canvas_front, 0, 0, new_w-1, new_h-1);
				event.preventDefault();
				HELPER.remove_selection();
				return false;
				}
			}
		//check tools functions
		if(CON.isDrag === false){
			for (i in TOOLS){
				if(i == ACTION){
					TOOLS[i]('move', CON.mouse, event);
					break;
					}
				}
			}
	

		if(CON.isDrag === false) return false;	//only drag now
		
		//check tools functions
		for (i in TOOLS){
			if(i == ACTION){
				TOOLS[i]('drag', CON.mouse, event);
				break;
				}
			}
			
		if(ACTION != 'select_square')
			TOOLS.select_square_action = '';
		
		mouse_x_move_last = CON.mouse.x;
		mouse_y_move_last = CON.mouse.y;
		};
	//release mouse click
	this.mouse_release = function(event){
		CON.isDrag = false;
		if(POP != undefined && POP.active==true) return true;
		var mouse = CON.get_mouse_position(event);
		mouse_x_move_last = false;
		mouse_y_move_last = false;
		if(TOOLS.select_square_action == '' && CON.mouse.valid == true)
			TOOLS.select_data = false;
		
		//check tools functions
		if(CON.clear_front_on_release == true)
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
		TOOLS.draw_selected_area();
		for (i in TOOLS){
			if(i == ACTION){
				TOOLS[i]('release', CON.mouse, event);
				break;
				}
			}
			
		//main window resize
		if(resize_all != false && ZOOM == 100 && CON.mouse.x > 0 && CON.mouse.y > 0){
			CON.autosize = false;
			document.body.style.cursor = "auto";
			if(resize_all == "w")
				WIDTH = CON.mouse.x;
			else if(resize_all == "h")
				HEIGHT = CON.mouse.y;
			else if(resize_all == "wh"){
				WIDTH = mouse_x;
				HEIGHT = CON.mouse.y;
				}
			RATIO = WIDTH/HEIGHT;
			LAYER.set_canvas_size();
			DRAW.zoom();
			}
		resize_all = false;
		DRAW.zoom();
		};
	//upload drop zone
	this.upload_drop = function(e){
		e.preventDefault();
		var progress = document.getElementById('uploadprogress');
		progress.style.display='block';
		progress.value = progress.innerHTML = 0;
		MAIN.save_state();
		var n_valid = 0;
		for (var i = 0, f; i < e.dataTransfer.files.length ; i++){
			f = e.dataTransfer.files[i];
			if(!f.type.match('image.*') && f.type != 'text/xml') continue;
			n_valid++;
		
			var FR = new FileReader();	
			FR.file = e.dataTransfer.files[i];
			
			if(e.dataTransfer.files.length == 1)
				SAVE_NAME = f.name.split('.')[f.name.split('.').length - 2];
						
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
		if(n_valid == 0)
			progress.style.display='none';
		document.getElementById("drop_zone").style.display='none';
		};
	this.mouse_wheel_handler = function(e){	//return true;
		var step = 100;		e.preventDefault();
		//zoom
		if(CON.ctrl_pressed==true){
			var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
			if(ZOOM <=100 && delta < 0)
				step = 10;
			if(ZOOM <100 && delta > 0)
				step = 10;
			delta = delta * step;
			if(ZOOM + delta > 0){
				ZOOM = ZOOM + delta;
				CON.calc_preview_auto();
				DRAW.zoom();
				}
			if(TOOLS.action_data().name == 'zoom'){
				TOOLS.action_data().attributes.zoom = ZOOM;
				show_action_attributes();
				}
				
			//disable page scroll if ctrl pressed
			e.preventDefault();
			return false;
			}
		};
	this.scroll_window = function(){
		var pad_left = 109;
		var pad_top = 34;
		var dim = HELPER.get_dimensions();
		var page_w = dim[0];
		var page_h = dim[1];
		var total_w = (WIDTH * ZOOM/100)  + pad_left;
		var total_h = (HEIGHT * ZOOM/100) + pad_top;
		var visible_w = page_w - 60;
		var visible_h = page_h - 60;
		
		var scrollbar_w = page_w * visible_w / total_w;
		var scrollbar_h = page_h * visible_h / total_h;
	
		xx = total_w * CON.ZOOM_X / (DRAW.PREVIEW_SIZE.w);
		yy = total_h * CON.ZOOM_Y / (DRAW.PREVIEW_SIZE.h );
		
		//minuus scrollbar size
		xx = xx - scrollbar_w/2;
		yy = yy - scrollbar_h/2;
		
		scrollTo(xx, yy);
		};
	this.calc_preview_by_mouse = function(mouse_x, mouse_y){
		CON.ZOOM_X = mouse_x - CON.mini_rect_data.w/2;
		CON.ZOOM_Y = mouse_y - CON.mini_rect_data.h/2;
		if(CON.ZOOM_X < 0) CON.ZOOM_X = 0;
		if(CON.ZOOM_Y < 0) CON.ZOOM_Y = 0;
	
		DRAW.zoom(undefined, true);
		return true;
		};
	this.calc_preview_auto = function(){
		var pad_left = 109;
		var pad_top = 34;
		var dim = HELPER.get_dimensions();
		var page_w = dim[0];
		var page_h = dim[1];
		var total_w = (WIDTH * ZOOM/100)  + pad_left;
		var total_h = (HEIGHT * ZOOM/100) + pad_top;
		var visible_w = page_w - 60;
		var visible_h = page_h - 60;		
		
		CON.mini_rect_data.w = round(visible_w * DRAW.PREVIEW_SIZE.w / total_w);	
		CON.mini_rect_data.h = round(visible_h * DRAW.PREVIEW_SIZE.h / total_h);
		
		DRAW.redraw_preview();
		};
	}

//=== Clipboard ================================================================

var CLIPBOARD = new CLIPBOARD_CLASS('cc');

function CLIPBOARD_CLASS(canvas_id){
	var _self = this;
	var ctrl_pressed = false;
	var reading_dom = false;
	var text_top = 15;
	var pasteCatcher;
	var paste_mode;
	
	//handlers
	document.addEventListener('keydown', function(e){ _self.on_keyboard_action(e); }, false);
	document.addEventListener('keyup', function(e){ _self.on_keyboardup_action(e); }, false);
	document.addEventListener('paste', function(e){ _self.paste_auto(e); }, false);

	//constructor - prepare
	this.init = function(){
		//if using auto
		if(window.Clipboard) return true;
		
		pasteCatcher = document.createElement("div");
		pasteCatcher.setAttribute("id", "paste_ff");
		pasteCatcher.setAttribute("contenteditable", "");
		pasteCatcher.style.cssText = 'opacity:0;position:fixed;top:0px;left:0px;';
		pasteCatcher.style.marginLeft = "-20px";
		pasteCatcher.style.width = "10px";
		document.body.appendChild(pasteCatcher);
		document.getElementById('paste_ff').addEventListener('DOMSubtreeModified', function(){
			reading_dom = false;
			if(paste_mode == 'auto' || ctrl_pressed == false) return true;
			//if paste handle failed - capture pasted object manually
			if(pasteCatcher.children.length == 1){
				if(pasteCatcher.firstElementChild.src != undefined){
					//image
					img = pasteCatcher.firstElementChild.src;
					_self.paste_createImage(pasteCatcher.firstElementChild.src);
					}
				else{
					//html
					/*setTimeout(function(){
						if(reading_dom == true) return false;
						_self.paste_createText(pasteCatcher.innerHTML, false);
						reading_dom = true;
						}, 10);*/
					}
				}
			/*else if(pasteCatcher.children.length == 0){
				//text
				setTimeout(function(){
					if(reading_dom == true) return false;
					_self.paste_createText(pasteCatcher.innerHTML, false);
					reading_dom = true;
					}, 10);
				}*/
			//register cleanup after some time.
			setTimeout(function(){
				pasteCatcher.innerHTML = '';
				}, 20);
			},false);
		}();
	//default paste action
	this.paste_auto = function(e){
		paste_mode = '';
		pasteCatcher.innerHTML = '';
		var plain_text_used = false;
		if(e.clipboardData){
			var items = e.clipboardData.items;
			if (items){
				paste_mode = 'auto';			
				//access data directly
				for (var i = 0; i < items.length; i++){
					if(items[i].type.indexOf("image") !== -1){
						//image
						var blob = items[i].getAsFile();
						var URLObj = window.URL || window.webkitURL;
						var source = URLObj.createObjectURL(blob);
						this.paste_createImage(source);
						}
					else if(items[i].type.indexOf("text") !== -1){
						//text or html
						/*if(plain_text_used == false)
							this.paste_createText(e.clipboardData.getData('text/plain'));
						plain_text_used = true;*/
						}
					}
				e.preventDefault();
				}
			else{
				//wait for DOMSubtreeModified event
				//https://bugzilla.mozilla.org/show_bug.cgi?id=891247
				}
			}
		};
	//on keyboard press
	this.on_keyboard_action = function(event){
		if(POP.active == true) return true;
		k = event.keyCode;
		//ctrl
		if(k==17 || event.metaKey || event.ctrlKey){	
			if(ctrl_pressed == false)
				ctrl_pressed = true;
			}
		//c
		if(k==86){
			if(ctrl_pressed == true && !window.Clipboard)
				pasteCatcher.focus();
			}
		};
	//on kaybord release
	this.on_keyboardup_action = function(event){
		k = event.keyCode;  
		//ctrl
		if(k==17 || event.metaKey || event.ctrlKey || event.key == 'Meta')
			ctrl_pressed = false;
		};
	//draw image
	this.paste_createImage = function(source){
		var pastedImage = new Image();
		pastedImage.onload = function(){
			LAYER.layer_add('Paste', source);
			};
		pastedImage.src = source;
		};
	//draw text
	this.paste_createText = function(text, parsed){
		var ctx = canvas_active();
		if(text == '') return false;
		if(parsed == false){
			text = text.replace(/<br\s*[\/]?>/gi, "\n");
			text = text.replace(/(<([^>]+)>)/g, "");
			text = text.replace(/&nbsp;/gi, " ");
			}
		ctx.font = '13px Tahoma';
		var lines = text.split("\n");
		for(var i in lines){
			ctx.fillText(lines[i], 10, text_top);
			text_top += 15;
			}
		text_top += 15;
		};
	};
