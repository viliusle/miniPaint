/* global HELPER, EVENTS, LAYER, POP, FILE, GUI, HELP, DRAW */
/* global WIDTH, HEIGHT, canvas_back, canvas_grid, COLOR, ALPHA */

var MAIN = new MAIN_CLASS();
document.onload = MAIN.init(true);

/**
 * main class - initialize app
 * 
 * @author ViliusL
 */
function MAIN_CLASS() {
	this.init = function (first_load) {
		if (first_load === true) {
			GUI.draw_helpers();
			GUI.autodetect_dimensions();
			POP.height_mini = Math.round(POP.width_mini * HEIGHT / WIDTH);
		}
		EVENTS.autosize = true;
		FILE.file_info = {
			general: [],
			exif: [],
		};
		DRAW.select_data = false;
		
		LAYER.remove_all_layers();
		LAYER.layers = [];
		LAYER.layer_add();
		LAYER.set_canvas_size();
		GUI.draw_background(canvas_back, WIDTH, HEIGHT);
		document.getElementById("canvas_preview").width = GUI.PREVIEW_SIZE.w;
		document.getElementById("canvas_preview").height = GUI.PREVIEW_SIZE.h;
		var color_rgb = HELPER.hex2rgb(COLOR);
		document.getElementById("rgb_r").value = color_rgb.r;
		document.getElementById("rgb_g").value = color_rgb.g;
		document.getElementById("rgb_b").value = color_rgb.b;
		document.getElementById("rgb_a").value = ALPHA;
		GUI.redraw_preview();
		GUI.show_action_attributes();
		
		//detect color support
		if (HELPER.chech_input_color_support('main_color') == true)
			document.getElementById("main_color").value = COLOR; //supported
		else {
			//not supported
			document.getElementById("main_color").style.display = 'none';
			document.getElementById("main_color_alt").style.display = '';
			document.getElementById("main_color_alt").style.backgroundColor = COLOR;
		}
		canvas_grid.globalAlpha = 0.8;
		
		//init translation
		var lang_cookie = HELPER.getCookie('language');
		if(lang_cookie != '')
			LANG = lang_cookie.replace(/([^a-z]+)/gi, '');
		HELP.help_translate(LANG);
	};
}
