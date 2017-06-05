/* global FILE, EDIT, HELPER, POP, MAIN, EVENTS, LAYER, IMAGE, GUI, DRAW, EL */
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

//windows touch
document.addEventListener('MSPointerDown', EVENTS.mouse_click, false);
document.addEventListener('MSPointerMove', EVENTS.mouse_move, false);
document.addEventListener('MSPointerUp', EVENTS.mouse_release, false);

//touch and drag
document.addEventListener("touchstart", EVENTS.mouse_click, false);
document.addEventListener("touchend", EVENTS.mouse_release, false);
document.addEventListener("touchmove", EVENTS.mouse_move, false);
//document.addEventListener("touchcancel", handleCancel, false);

/**
 * all events handling
 * 
 * @author ViliusL
 */
function EVENTS_CLASS() {
	
	/**
	 * mouse data, like positions, clicks
	 */
	this.mouse = {};
	
	/**
	 * if user is holding ctrl
	 */
	this.ctrl_pressed = false;
	
	/**
	 * if user is holding command key
	 */
	this.command_pressed = false;
	
	/**
	 * if use is holding shift
	 */
	this.shift_pressed = false; //16
	
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
	 * popup position for dragable ability
	 */
	var popup_pos = [0, 0];
	
	/**
	 * if popup is dragged
	 */
	var popup_dragable = false;
	
	var mouse_average_speed = 0;

	//keyboard actions
	this.on_keyboard_action = function (event) {
		k = event.keyCode;	//console.log(k);

		if (k != 27) {
			//we can not touch these events!
			if (POP != undefined && POP.active == true){
				//dialog active
				return true;
			}
			if (document.activeElement.type == 'text' || document.activeElement.type == 'number'){
				//text input selected
				return true;
			}
		}
		
		//ctrl
		if (event.ctrlKey == true) {
			EVENTS.ctrl_pressed = true;
		}
		//command
		if(event.metaKey == true){
			EVENTS.command_pressed = true;
			EVENTS.ctrl_pressed = true;
		}
		
		//F9
		if (k == 120) {
			FILE.file_quicksave();
		}
		
		//F10
		if (k == 121) {
			FILE.file_quickload();
		}
		
		//up
		if (k == 38) {
			if (DRAW.active_tool == 'select_tool') {
				EDIT.save_state();
				LAYER.layer_move_active(0, -1);
				GUI.zoom();
				return false;
			}
		}
		//down
		else if (k == 40) {
			if (DRAW.active_tool == 'select_tool') {
				EDIT.save_state();
				LAYER.layer_move_active(0, 1);
				GUI.zoom();
				return false;
			}
		}
		//right
		else if (k == 39) {
			if (DRAW.active_tool == 'select_tool') {
				EDIT.save_state();
				LAYER.layer_move_active(1, 0);
				GUI.zoom();
				return false;
			}
		}
		//left
		else if (k == 37) {
			if (DRAW.active_tool == 'select_tool') {
				EDIT.save_state();
				LAYER.layer_move_active(-1, 0);
				GUI.zoom();
				return false;
			}
		}
		//esc
		else if (k == 27) {
			if (POP != undefined && POP.active == true)
				POP.hide();
			DRAW.last_line = [];
			
			DRAW.curve_points = [];
			if (DRAW.select_data != false) {
				EDIT.edit_clear();
			}
		}
		//z - undo
		else if (k == 90) {
			//undo
			if (EVENTS.ctrl_pressed == true){
				EDIT.undo();
			}
		}
		//t - trim
		else if (k == 84) {
			EDIT.save_state();
			IMAGE.trim();
		}
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
		else if (k == 16){
			EVENTS.shift_pressed = true;
		}
		//d
		else if (k == 68) {
			call_menu(LAYER, 'layer_duplicate');
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
		//minus
		else if (k == 109){
			GUI.zoom(-1);
		}
		//plus
		else if (k == 107){
			GUI.zoom(+1);
		}
		//n - new layer
		else if (k == 78){
			EDIT.save_state();
			LAYER.layer_add();
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
		else if (event.ctrlKey == false && EVENTS.ctrl_pressed == true) {
			EVENTS.ctrl_pressed = false;
		}
		//command
		else if(event.metaKey == false && EVENTS.command_pressed == true){
			EVENTS.command_pressed = false;
			EVENTS.ctrl_pressed = false;
		}
	};
	// mouse_x, mouse_y, event.pageX, event.pageY
	this.get_mouse_position = function (event) {
		if(event.changedTouches){
			//using touch events
			event = event.changedTouches[0];
		}
		var valid = true;
		var abs_x = event.pageX;
		var abs_y = event.pageY;
		
		var bodyRect = document.body.getBoundingClientRect();
		var canvas_el = document.getElementById('canvas_front').getBoundingClientRect();
		var canvas_offset_x = canvas_el.left - bodyRect.left;
		var canvas_offset_y = canvas_el.top - bodyRect.top;
		
		var mouse_x = event.pageX - canvas_offset_x;
		var mouse_y = event.pageY - canvas_offset_y;
		
		if (event.target.id != "canvas_front") {
			//outside canvas
			valid = false;
		}
		
		if (event.target.id == "canvas_preview") {
			//in preview area - relative pos
			var canvas_preview_el = document.getElementById('canvas_preview').getBoundingClientRect();
			var canvas_preview_el_x = canvas_preview_el.left - bodyRect.left;
			var canvas_preview_el_y = canvas_preview_el.top - bodyRect.top;
			
			mouse_x = event.pageX - canvas_preview_el_x;
			mouse_y = event.pageY - canvas_preview_el_y;
		}
		
		if (event.target.id != "canvas_preview" && GUI.ZOOM != 100) {
			//we are in zoom mode - recalculate
			mouse_x = Math.floor(mouse_x / GUI.ZOOM * 100);
			mouse_y = Math.floor(mouse_y / GUI.ZOOM * 100);
		}
		
		//save
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
			abs_y: abs_y,
		};
	};
	//mouse right click
	this.mouse_right_click = function (event) {
		if (POP != undefined && POP.active == true)
			return true;

		EVENTS.get_mouse_position(event);
		
		if(EVENTS.mouse.x != EVENTS.mouse.click_x && EVENTS.mouse.y != EVENTS.mouse.click_y){
			//disable long click on mobile
			event.preventDefault();
			event.stopPropagation();
			return false;
		}
		
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
		
		//reset avg speed
		mouse_average_speed = 0;

		EVENTS.get_mouse_position(event);
		mouse_click_pos[0] = EVENTS.mouse.x;
		mouse_click_pos[1] = EVENTS.mouse.y;
		if (event.which == 3){
			return true;
		}
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
		
		//calc average speed
		var avg_speed_max = 20;
		var avg_speed_changing_power = 2;
		
		var dx = Math.abs(EVENTS.mouse.x - EVENTS.mouse.last_x);
		var dy = Math.abs(EVENTS.mouse.y - EVENTS.mouse.last_y);
		var delta = Math.sqrt(dx*dx + dy*dy);
		if(delta > avg_speed_max/2)
			mouse_average_speed += avg_speed_changing_power;
		else
			mouse_average_speed -= avg_speed_changing_power;
		mouse_average_speed = Math.max(0, mouse_average_speed); //min 0
		mouse_average_speed = Math.min(avg_speed_max, mouse_average_speed); //max 30
		EVENTS.mouse.speed_average = mouse_average_speed;
		
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
		EVENTS.get_mouse_position(event);
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
			EDIT.save_state();
			EVENTS.autosize = false;
			document.body.style.cursor = "auto";
			if (resize_all == "w")
				WIDTH = EVENTS.mouse.x;
			else if (resize_all == "h")
				HEIGHT = EVENTS.mouse.y;
			else if (resize_all == "wh") {
				WIDTH = EVENTS.mouse.x;
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
		FILE.open_handler(e);
	};
	this.mouse_wheel_handler = function (e) {
		if(POP.active == true)
			return;
		e.preventDefault();
		//zoom
		if (EVENTS.ctrl_pressed == true) {
			var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
			if(delta > 0)
				GUI.zoom(+1, true);
			else
				GUI.zoom(-1, true);
			
			return false;
		}
	};
	this.scroll_window = function() {
		var canvas_wrapper = document.querySelector('#canvas_wrapper');
		var visible_w = canvas_wrapper.clientWidth / GUI.ZOOM * 100;
		var visible_h = canvas_wrapper.clientHeight / GUI.ZOOM * 100;
		
		if(this.mouse.valid == true){
			GUI.zoom_center = [this.mouse.x/WIDTH*100, this.mouse.y/HEIGHT*100];
		}
		
		//scroll to - convert center % coordinates to top/left px, and translate to current zoom
		if(this.mouse.valid == true){
			//using exact position
			xx = (GUI.zoom_center[0] * WIDTH / 100 - visible_w * GUI.zoom_center[0]/100) * GUI.ZOOM / 100;
			yy = (GUI.zoom_center[1] * HEIGHT / 100 - visible_h * GUI.zoom_center[1]/100) * GUI.ZOOM / 100;
		}
		else{
			//using center
			xx = (GUI.zoom_center[0] * WIDTH / 100 - visible_w / 2) * GUI.ZOOM / 100;
			yy = (GUI.zoom_center[1] * HEIGHT / 100 - visible_h / 2) * GUI.ZOOM / 100;
		}
		
		canvas_wrapper.scrollLeft = xx;
		canvas_wrapper.scrollTop = yy;

	};
	this.calc_preview_by_mouse = function (mouse_x, mouse_y) {
		GUI.zoom_center[0] = mouse_x / GUI.PREVIEW_SIZE.w * 100;
		GUI.zoom_center[1] = mouse_y / GUI.PREVIEW_SIZE.h * 100;
		
		GUI.zoom(undefined, true);
		return true;
	};
	this.on_resize = function(){
		GUI.redraw_preview();
		POP.reset_position();
		
		document.querySelector('#sidebar_left').classList.remove("active");
		document.querySelector('#sidebar_right').classList.remove("active");
	};
}

function call_menu(class_name, function_name, parameter) {
	//close menu
	var menu = document.querySelector('#main_menu .selected');
	if(menu != undefined){
		menu.click(); 
	}
	GUI.last_menu = function_name;

	//exec
	class_name[function_name](parameter);

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
	var command_pressed = false;
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
		if (POP.active == true || e.target.type == 'text')
			return true;
		
		paste_mode = '';
		pasteCatcher.innerHTML = '';
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
		//ctrl
		if (event.ctrlKey == false && ctrl_pressed == true) {
			ctrl_pressed = false;
		}
		//command
		else if(event.metaKey == false && command_pressed == true){
			command_pressed = false;
			ctrl_pressed = false;
		}
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
