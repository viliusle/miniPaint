/* global HELPER, EVENTS, LAYER, POP, FILE, GUI, DRAW */
/* global WIDTH, HEIGHT, canvas_main, canvas_back, canvas_grid, COLOR, ALPHA  */

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
			POP.height_mini = Math.round(POP.width_mini * HEIGHT / WIDTH);
		}
		EVENTS.autosize = true;
		FILE.EXIF = false;
		DRAW.select_data = false;
		
		for (i = 1; i < LAYER.layers.length; i++)
			LAYER.layer_remove(i);
		LAYER.layers = [];
		canvas_main.clearRect(0, 0, WIDTH, HEIGHT);
		LAYER.layer_add("Background");
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
		
		//detect color support
		if (HELPER.chech_input_color_support('main_colour') == true)
			document.getElementById("main_colour").value = COLOR; //supported
		else {
			//not supported
			document.getElementById("main_colour").style.display = 'none';
			document.getElementById("main_colour_alt").style.display = '';
			document.getElementById("main_colour_alt").style.backgroundColor = COLOR;
		}
		canvas_grid.globalAlpha = 0.8;
	};
}
