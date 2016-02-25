/* global FILE, EDIT, HELPER, POP, MAIN, EVENTS, LAYER, IMAGE, GUI, DRAW */
/* global canvas_active, canvas_front, WIDTH, HEIGHT, EXIF */

var EVENTS = new EVENTS_CLASS();

//keyboard handlers
document.onkeydown = function(e) {	return EVENTS.on_keyboard_action(e); };
document.onkeyup = function(e) {return EVENTS.on_keyboardup_action(e); };
//mouse
window.ondrop = function(e) { EVENTS.upload_drop(e); };		//drop
window.ondragover = function(e) { e.preventDefault(); };
window.onresize = function(e){ EVENTS.on_resize(); };		//window resize
document.onmousedown = EVENTS.mouse_click;	//mouse click
document.onmousemove = EVENTS.mouse_move;	//mouse move
document.onmouseup = EVENTS.mouse_release;	//mouse resease
document.addEventListener("mousewheel", EVENTS.mouse_wheel_handler, false);	//mouse scroll
document.addEventListener("DOMMouseScroll", EVENTS.mouse_wheel_handler, false);	//mouse scroll
document.oncontextmenu = function (e) { return EVENTS.mouse_right_click(e); };	//mouse right click
document.getElementById('color_hex').onkeyup = function (e) { GUI.set_color_manual(e); };	//on main color type
document.getElementById('color_hex').onpaste = function (e) { GUI.set_color_manual(e); }; // on paste in main color input

/**
 * all events handling
 * 
 * @author ViliusL
 */
function EVENTS_CLASS() {
	
	/**
	 * mouse data, like positions, clicks
	 */
	this.mouse;
	
	/**
	 * if user is holding ctrl
	 */
	this.ctrl_pressed = false; //17
	
	/**
	 * if use is holding shift
	 */
	this.shift_pressed = false; //16
	
	/**
	 * active area start position in preview canvas in right sidebar
	 */
	this.ZOOM_POS = [0, 0];
	
	/**
	 * active area dimensions in preview canvas in right sidebar
	 */
	this.mini_rect_data = {w: 0, h: 0};
	
	/**
	 * if use is draging
	 */
	this.isDrag = false;
	
	/**
	 * selected area resize rect. size (controlls, where you can resize area)
	 */
	this.sr_size = 8;
	
	/**
	 * if false, font canvas is not cleared on mouse release
	 */
	this.clear_front_on_release = true;
	
	/**
	 * if canvas size was not changed - autosize possible
	 */
	var autosize = true;
	
	/**
	 * mouse click positions
	 */
	var mouse_click_pos = [false, false];
	
	/**
	 * last mouse move position
	 */
	var mouse_move_last = [false, false];
	
	/**
	 * main canvas resize action
	 */
	var resize_all = false;
	
	/**
	 * if mouse was click on canvas
	 */
	var mouse_click_valid = false;
	
	/**
	 * mouse click position of popup drag start
	 */
	var last_pop_click = [0, 0];
	
	/**
	 * popup position for drgable ability
	 */
	var popup_pos = [0, 0];
	
	/**
	 * if popup is dragged
	 */
	var popup_dragable = false;

	//keyboard actions
	this.on_keyboard_action = function (event) {
		k = event.keyCode;	//console.log(k);

		if (k != 27) {
			if (POP != undefined && POP.active == true)
				return true; //dialog active
			if (document.activeElement.type == 'text')
				return true; //text input selected
		}

		//up
		if (k == 38) {
			if (DRAW.active_tool == 'select_tool') {
				EDIT.save_state();
				LAYER.layer_move_active(0, -1);
				return false;
			}
		}
		//down
		else if (k == 40) {
			if (DRAW.active_tool == 'select_tool') {
				EDIT.save_state();
				LAYER.layer_move_active(0, 1);
				return false;
			}
		}
		//left
		else if (k == 39) {
			if (DRAW.active_tool == 'select_tool') {
				EDIT.save_state();
				LAYER.layer_move_active(1, 0);
				return false;
			}
		}
		//right
		else if (k == 37) {
			if (DRAW.active_tool == 'select_tool') {
				EDIT.save_state();
				LAYER.layer_move_active(-1, 0);
				return false;
			}
		}
		//esc
		else if (k == 27) {
			if (POP != undefined && POP.active == true)
				POP.hide();
			DRAW.last_line = [false, false];
			
			DRAW.curve_points = [];
			if (DRAW.select_data != false) {
				DRAW.select_data = false;
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				DRAW.select_square_action = '';
			}
		}
		//z - undo
		else if (k == 90) {
			//undo
			if (EVENTS.ctrl_pressed == true)
				EDIT.undo();
		}
		//t - trim
		else if (k == 84) {
			EDIT.save_state();
			IMAGE.trim();
		}
		//o - open
		else if (k == 79)
			FILE.open();
		//s - save
		else if (k == 83) {
			if (POP != undefined)
				FILE.save_dialog(event);
		}
		//l - rotate left
		else if (k == 76) {
			EDIT.save_state();
			IMAGE.rotate_resize_doc(270, WIDTH, HEIGHT);
			IMAGE.rotate_layer({angle: 270}, canvas_active(), WIDTH, HEIGHT);
		}
		//r - resize
		else if (k == 82)
			IMAGE.resize_box();
		//grid
		else if (k == 71) {
			if (GUI.grid == false)
				GUI.grid = true;
			else
				GUI.grid = false;
			GUI.draw_grid();
		}
		//del
		else if (k == 46) {
			if (DRAW.select_data != false) {
				EDIT.save_state();
				canvas_active().clearRect(DRAW.select_data.x, DRAW.select_data.y, DRAW.select_data.w, DRAW.select_data.h);
				DRAW.select_data = false;
				DRAW.select_square_action = '';
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			}
		}
		//shift
		else if (k == 16)
			EVENTS.shift_pressed = true;
		//ctrl
		else if (k == 17) {
			if (EVENTS.ctrl_pressed == false)
				EVENTS.ctrl_pressed = true;
		}
		//d
		else if (k == 68) {
			call_menu(LAYER, 'layer_dublicate');
		}
		//a
		else if (k == 65) {
			if (EVENTS.ctrl_pressed == true) {
				DRAW.select_data = {
					x: 0,
					y: 0,
					w: WIDTH,
					h: HEIGHT
				};
				GUI.draw_selected_area();
				return false;
			}
		}
		//v
		else if (k == 86) {
			EDIT.save_state();
			if (EVENTS.ctrl_pressed == true)
				EDIT.paste();
		}
		//f - fix images
		else if (k == 70) {
			EDIT.save_state();
			IMAGE.auto_adjust(canvas_active(), WIDTH, HEIGHT);
		}
		//h - histogram	
		else if (k == 72) {
			IMAGE.histogram();
		}
		//-
		else if (k == 109)
			GUI.zoom(-1);
		//+
		else if (k == 107)
			GUI.zoom(+1);
		//n - new layer
		else if (k == 78)
			LAYER.add_layer();

		//mac support - ctrl
		if (k == 17 || event.metaKey || event.ctrlKey) {
			if (EVENTS.ctrl_pressed == false)
				EVENTS.ctrl_pressed = true;
		}

		GUI.zoom();
		return true;
	};
	//keyboard release
	this.on_keyboardup_action = function (event) {
		k = event.keyCode;
		//shift
		if (k == 16)
			EVENTS.shift_pressed = false;
		//ctrl
		else if (k == 17)
			EVENTS.ctrl_pressed = false;
		//mac support - ctrl
		if (event.metaKey || event.ctrlKey || event.key == 'Meta')
			EVENTS.ctrl_pressed = false;
	};
	// mouse_x, mouse_y, event.pageX, event.pageY
	this.get_mouse_position = function (event) {
		var valid = true;
		if (event.offsetX) {
			mouse_rel_x = event.offsetX;
			mouse_rel_y = event.offsetY;
		}
		else if (event.layerX) {
			mouse_rel_x = event.layerX;
			mouse_rel_y = event.layerY;
		}
		else
			return false;
		mouse_x = event.pageX;
		mouse_y = event.pageY;
		var abs_x = event.pageX;
		var abs_y = event.pageY;

		if (event.target.id == "canvas_front") {
			//in canvas area - relative pos
			mouse_x = mouse_rel_x;
			mouse_y = mouse_rel_y;
			if (GUI.ZOOM != 100) {
				mouse_x = Math.floor(mouse_x / GUI.ZOOM * 100);
				mouse_y = Math.floor(mouse_y / GUI.ZOOM * 100);
			}
		}
		else {
			//outside canvas - absolute pos - canvas offset
			mouse_x = mouse_x - 109;
			mouse_y = mouse_y - 34;
			valid = false;
		}
		if (event.target.id == "canvas_preview") {
			//in preview area - relative pos
			mouse_x = mouse_rel_x;
			mouse_y = mouse_rel_y;
		}

		//save - other place will use it too
		EVENTS.mouse = {
			x: mouse_x,
			y: mouse_y,
			click_x: mouse_click_pos[0],
			click_y: mouse_click_pos[1],
			last_x: mouse_move_last[0],
			last_y: mouse_move_last[1],
			valid: valid,
			click_valid: mouse_click_valid,
			abs_x: abs_x,
			abs_y: abs_y
		};
	};
	//mouse right click
	this.mouse_right_click = function (event) {
		if (POP != undefined && POP.active == true)
			return true;
		EVENTS.get_mouse_position(event);
		mouse_click_pos[0] = EVENTS.mouse.x;
		mouse_click_pos[1] = EVENTS.mouse.y;

		for (var i in DRAW) {
			if (i == DRAW.active_tool) {
				return DRAW[i]('right_click', EVENTS.mouse, event);
				break;
			}
		}
	};
	//mouse click
	this.mouse_click = function (event) {
		EVENTS.isDrag = true;
		if (POP != undefined && POP.active == true) {
			EVENTS.get_mouse_position(event);
			last_pop_click[0] = EVENTS.mouse.abs_x;
			last_pop_click[1] = EVENTS.mouse.abs_y;
			popup = document.getElementById('popup');
			popup_pos[0] = parseInt(popup.style.top);
			popup_pos[1] = parseInt(popup.style.left);
			
			if (event.target.id == "popup_drag")
				popup_dragable = true;
			else
				popup_dragable = false;
			return true;
		}
		if (event.which == 3)
			return true;
		EVENTS.get_mouse_position(event);
		mouse_click_pos[0] = EVENTS.mouse.x;
		mouse_click_pos[1] = EVENTS.mouse.y;
		if (EVENTS.mouse.valid == false)
			mouse_click_valid = false;
		else
			mouse_click_valid = true;


		//check tools functions
		for (var i in DRAW) {
			if (i == DRAW.active_tool) {
				DRAW[i]('click', EVENTS.mouse, event);
				break;
			}
		}

		if (event.target.id == "canvas_preview")
			EVENTS.calc_preview_by_mouse(EVENTS.mouse.x, EVENTS.mouse.y);

		//main window resize
		resize_all = false;
		if (GUI.ZOOM == 100) {
			if (event.target.id == "resize-w")
				resize_all = "w";
			else if (event.target.id == "resize-h")
				resize_all = "h";
			else if (event.target.id == "resize-wh")
				resize_all = "wh";
		}
	};
	//mouse move
	this.mouse_move = function (event) {
		if (POP != undefined && POP.active == true) {
			//drag popup
			if (EVENTS.isDrag == true && popup_dragable == true) {
				EVENTS.get_mouse_position(event);
				popup = document.getElementById('popup');
				popup.style.top = (popup_pos[0] + EVENTS.mouse.abs_y - last_pop_click[1]) + 'px';
				popup.style.left = (popup_pos[1] + EVENTS.mouse.abs_x - last_pop_click[0]) + 'px';
			}
			return true;
		}
		EVENTS.get_mouse_position(event);
		if (event.target.id == "canvas_preview" && EVENTS.isDrag == true)
			EVENTS.calc_preview_by_mouse(EVENTS.mouse.x, EVENTS.mouse.y);
		LAYER.update_info_block();

		//main window resize
		if (GUI.ZOOM == 100) {
			if (event.target.id == "resize-w")
				document.body.style.cursor = "w-resize";
			else if (event.target.id == "resize-h")
				document.body.style.cursor = "n-resize";
			else if (event.target.id == "resize-wh")
				document.body.style.cursor = "nw-resize";
			else
				document.body.style.cursor = "auto";
			if (resize_all != false && EVENTS.isDrag == true) {
				document.body.style.cursor = "auto";
				if (resize_all == "w") {
					new_w = EVENTS.mouse.x;
					new_h = HEIGHT;
				}
				else if (resize_all == "h") {
					new_w = WIDTH;
					new_h = EVENTS.mouse.y;
				}
				else if (resize_all == "wh") {
					new_w = EVENTS.mouse.x;
					new_h = EVENTS.mouse.y;
				}
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				canvas_front.lineWidth = 1;
				canvas_front.fillStyle = "#ff0000";
				EL.rectangle_dashed(canvas_front, 0, 0, new_w - 1, new_h - 1);
				event.preventDefault();
				HELPER.remove_selection();
				return false;
			}
		}
		//check tools functions
		if (EVENTS.isDrag === false) {
			for (i in DRAW) {
				if (i == DRAW.active_tool) {
					DRAW[i]('move', EVENTS.mouse, event);
					break;
				}
			}
		}


		if (EVENTS.isDrag === false)
			return false;	//only drag now

		//check tools functions
		for (var i in DRAW) {
			if (i == DRAW.active_tool) {
				DRAW[i]('drag', EVENTS.mouse, event);
				break;
			}
		}

		if (DRAW.active_tool != 'select_square')
			DRAW.select_square_action = '';

		mouse_move_last[0] = EVENTS.mouse.x;
		mouse_move_last[1] = EVENTS.mouse.y;
	};
	//release mouse click
	this.mouse_release = function (event) {
		EVENTS.isDrag = false;
		if (POP != undefined && POP.active == true)
			return true;
		var mouse = EVENTS.get_mouse_position(event);
		mouse_move_last[0] = false;
		mouse_move_last[1] = false;
		if (DRAW.select_square_action == '' && EVENTS.mouse.valid == true)
			DRAW.select_data = false;

		//check tools functions
		if (EVENTS.clear_front_on_release == true)
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
		GUI.draw_selected_area();
		for (var i in DRAW) {
			if (i == DRAW.active_tool) {
				DRAW[i]('release', EVENTS.mouse, event);
				break;
			}
		}

		//main window resize
		if (resize_all != false && GUI.ZOOM == 100 && EVENTS.mouse.x > 0 && EVENTS.mouse.y > 0) {
			EVENTS.autosize = false;
			document.body.style.cursor = "auto";
			if (resize_all == "w")
				WIDTH = EVENTS.mouse.x;
			else if (resize_all == "h")
				HEIGHT = EVENTS.mouse.y;
			else if (resize_all == "wh") {
				WIDTH = mouse_x;
				HEIGHT = EVENTS.mouse.y;
			}
			LAYER.set_canvas_size();
			GUI.zoom();
		}
		resize_all = false;
		GUI.zoom();
	};
	//upload drop zone
	this.upload_drop = function (e) {
		e.preventDefault();
		EDIT.save_state();
		var n_valid = 0;
		for (var i = 0, f; i < e.dataTransfer.files.length; i++) {
			f = e.dataTransfer.files[i];
			if (!f.type.match('image.*') && f.type != 'text/xml')
				continue;
			n_valid++;

			var FR = new FileReader();
			FR.file = e.dataTransfer.files[i];

			if (e.dataTransfer.files.length == 1)
				FILE.SAVE_NAME = f.name.split('.')[f.name.split('.').length - 2];

			FR.onload = function (event) {
				if (this.file.type != 'text/xml') {
					//image
					LAYER.layer_add(this.file.name, event.target.result, this.file.type);
					EXIF.getData(this.file, FILE.save_EXIF);
				}
				else {
					//xml
					var responce = MAIN.load_xml(event.target.result);
					if (responce === true)
						return false;
				}
			};
			if (f.type == "text/plain")
				FR.readAsText(f);
			else if (f.type == "text/xml")
				FR.readAsText(f);
			else
				FR.readAsDataURL(f);
		}
	};
	this.mouse_wheel_handler = function (e) {	//return true;
		var step = 100;
		e.preventDefault();
		//zoom
		if (EVENTS.ctrl_pressed == true) {
			var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
			if (GUI.ZOOM <= 100 && delta < 0)
				step = 10;
			if (GUI.ZOOM < 100 && delta > 0)
				step = 10;
			delta = delta * step;
			if (GUI.ZOOM + delta > 0) {
				GUI.ZOOM = GUI.ZOOM + delta;
				EVENTS.calc_preview_auto();
				GUI.zoom();
			}
			if (GUI.action_data().name == 'zoom') {
				GUI.action_data().attributes.zoom = GUI.ZOOM;
				show_action_attributes();
			}
			EVENTS.scroll_window();

			//disable page scroll if ctrl pressed
			e.preventDefault();
			return false;
		}
	};
	this.scroll_window = function () {
		var total_w = (WIDTH * GUI.ZOOM / 100);
		var total_h = (HEIGHT * GUI.ZOOM / 100);

		xx = total_w * EVENTS.ZOOM_POS[0] / (GUI.PREVIEW_SIZE.w);
		yy = total_h * EVENTS.ZOOM_POS[1] / (GUI.PREVIEW_SIZE.h);

		var canvas_wrapper = document.querySelector('#canvas_wrapper');
		canvas_wrapper.scrollTop = yy;
		canvas_wrapper.scrollLeft = xx;
	};
	this.calc_preview_by_mouse = function (mouse_x, mouse_y) {
		EVENTS.ZOOM_POS[0] = mouse_x - EVENTS.mini_rect_data.w / 2;
		EVENTS.ZOOM_POS[1] = mouse_y - EVENTS.mini_rect_data.h / 2;
		if (EVENTS.ZOOM_POS[0] < 0)
			EVENTS.ZOOM_POS[1] = 0;
		if (EVENTS.ZOOM_Y < 0)
			EVENTS.ZOOM_Y = 0;

		GUI.zoom(undefined, true);
		return true;
	};
	this.calc_preview_auto = function () {
		var canvas_wrapper = document.querySelector('#canvas_wrapper');
		var page_w = canvas_wrapper.clientWidth;	
		var page_h = canvas_wrapper.clientHeight;
		
		var total_w = (WIDTH * GUI.ZOOM / 100);
		var total_h = (HEIGHT * GUI.ZOOM / 100);
		
		EVENTS.mini_rect_data.w = Math.round(page_w * GUI.PREVIEW_SIZE.w / total_w);
		EVENTS.mini_rect_data.h = Math.round(page_h * GUI.PREVIEW_SIZE.h / total_h);

		GUI.redraw_preview();
	};
	this.on_resize = function(){
		EVENTS.calc_preview_auto();
		
		//recalc popup position
		var dim = HELPER.get_dimensions();
		popup = document.getElementById('popup');
		popup.style.top = 150 + 'px';
		popup.style.left = Math.round(dim[0] / 2) + 'px';
	};
}

function call_menu(class_name, function_name) {
	$('#main_menu').find('.selected').click(); //close menu
	GUI.last_menu = function_name;

	//exec
	class_name[function_name]();

	GUI.zoom();
}

//=== Clipboard ================================================================

var CLIPBOARD = new CLIPBOARD_CLASS('', false);

/**
 * image pasting into canvas
 * 
 * @param {string} canvas_id - canvas id
 * @param {boolean} autoresize - if canvas will be resized
 */
function CLIPBOARD_CLASS(canvas_id, autoresize) {
	var _self = this;
	if (canvas_id != ''){
		var canvas = document.getElementById(canvas_id);
		var ctx = document.getElementById(canvas_id).getContext("2d");
	}
	var ctrl_pressed = false;
	var reading_dom = false;
	var text_top = 15;
	var pasteCatcher;
	var paste_mode;

	//handlers
	document.addEventListener('keydown', function (e) {
		_self.on_keyboard_action(e);
	}, false); //firefox fix
	document.addEventListener('keyup', function (e) {
		_self.on_keyboardup_action(e);
	}, false); //firefox fix
	document.addEventListener('paste', function (e) {
		_self.paste_auto(e);
	}, false); //official paste handler

	//constructor - prepare
	this.init = function () {
		//if using auto
		if (window.Clipboard)
			return true;

		pasteCatcher = document.createElement("div");
		pasteCatcher.setAttribute("id", "paste_ff");
		pasteCatcher.setAttribute("contenteditable", "");
		pasteCatcher.style.cssText = 'opacity:0;position:fixed;top:0px;left:0px;';
		pasteCatcher.style.marginLeft = "-20px";
		pasteCatcher.style.width = "10px";
		document.body.appendChild(pasteCatcher);
		
		// create an observer instance
		var observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (paste_mode == 'auto' || ctrl_pressed == false || mutation.type != 'childList')
					return true;

				//if paste handle failed - capture pasted object manually
				if(mutation.addedNodes.length == 1) {
					if (mutation.addedNodes[0].src != undefined) {
						//image
						_self.paste_createImage(mutation.addedNodes[0].src);
					}
					//register cleanup after some time.
					setTimeout(function () {
						pasteCatcher.innerHTML = '';
					}, 20);
				}
			});
		});
		var target = document.getElementById('paste_ff');
		var config = { attributes: true, childList: true, characterData: true };
		observer.observe(target, config);
	}();
	//default paste action
	this.paste_auto = function (e) {
		paste_mode = '';
		pasteCatcher.innerHTML = '';
		var plain_text_used = false;
		if (e.clipboardData) {
			var items = e.clipboardData.items;
			if (items) {
				paste_mode = 'auto';
				//access data directly
				for (var i = 0; i < items.length; i++) {
					if (items[i].type.indexOf("image") !== -1) {
						//image
						var blob = items[i].getAsFile();
						var URLObj = window.URL || window.webkitURL;
						var source = URLObj.createObjectURL(blob);
						this.paste_createImage(source);
					}
				}
				e.preventDefault();
			}
			else {
				//wait for DOMSubtreeModified event
				//https://bugzilla.mozilla.org/show_bug.cgi?id=891247
			}
		}
	};
	//on keyboard press
	this.on_keyboard_action = function (event) {
		if (POP.active == true)
			return true;
		k = event.keyCode;
		//ctrl
		if (k == 17 || event.metaKey || event.ctrlKey) {
			if (ctrl_pressed == false)
				ctrl_pressed = true;
		}
		//v
		if (k == 86) {
			if (document.activeElement != undefined && document.activeElement.type == 'text') {
				//let user paste into some input
				return false;
			}

			if (ctrl_pressed == true && !window.Clipboard)
				pasteCatcher.focus();
		}
	};
	//on kaybord release
	this.on_keyboardup_action = function (event) {
		k = event.keyCode;
		//ctrl
		if (k == 17 || event.metaKey || event.ctrlKey || event.key == 'Meta')
			ctrl_pressed = false;
	};
	//draw image
	this.paste_createImage = function (source) {
		var pastedImage = new Image();
		pastedImage.onload = function () {
			if(canvas_id != ''){
				if(autoresize == true){
					//resize
					canvas.width = pastedImage.width;
					canvas.height = pastedImage.height;
				}
				else{
					//clear canvas
					ctx.clearRect(0, 0, canvas.width, canvas.height);
				}
			}
			LAYER.layer_add('Paste', source);
		};
		pastedImage.src = source;
	};
}
