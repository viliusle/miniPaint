/* global MAIN, POP, LAYER, DRAW, GUI */
/* global WIDTH, HEIGHT, canvas_active, canvas_front */

var EDIT = new EDIT_CLASS();

/** 
 * manages edit actions
 * 
 * @author ViliusL
 */
function EDIT_CLASS() {
	
	/**
	 * used to store internal copied objects data
	 */
	var PASTE_DATA = false;
	
	/**
	 * latest 3 saved states of all layers for undo
	 */
	var layers_archive = [{}, {}, {}];
	
	/**
	 * on undo, current data index in layers_archive array
	 */
	var undo_level = 0;
	
	//undo
	this.edit_undo = function () {
		this.undo();
	};

	//cut
	this.edit_cut = function () {
		this.save_state();
		if (DRAW.select_data != false) {
			this.copy_to_clipboard();
			canvas_active().clearRect(DRAW.select_data.x, DRAW.select_data.y, DRAW.select_data.w, DRAW.select_data.h);
			DRAW.select_data = false;
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
		}
	};

	//copy
	this.edit_copy = function () {
		if (DRAW.select_data != false) {
			this.copy_to_clipboard();
		}
	};

	//paste
	this.edit_paste = function () {
		this.save_state();
		this.paste('menu');		
	};

	//select all
	this.edit_select = function () {
		DRAW.select_data = {
			x: 0,
			y: 0,
			w: WIDTH,
			h: HEIGHT
		};
		canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
		GUI.draw_selected_area();
	};

	//clear selection
	this.edit_clear = function () {
		DRAW.select_data = false;
		canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
		DRAW.select_square_action = '';
	};

	this.copy_to_clipboard = function () {
		PASTE_DATA = false;
		PASTE_DATA = document.createElement("canvas");
		PASTE_DATA.width = DRAW.select_data.w;
		PASTE_DATA.height = DRAW.select_data.h;
		PASTE_DATA.getContext("2d").drawImage(canvas_active(true), DRAW.select_data.x, DRAW.select_data.y, DRAW.select_data.w, DRAW.select_data.h, 0, 0, DRAW.select_data.w, DRAW.select_data.h);
	};

	this.paste = function (type) {
		if (PASTE_DATA == false) {
			if (type == 'menu') {
				POP.add({title: "Error:", value: 'Empty data'});
				POP.add({title: "Notice:", value: 'To paste from clipboard, use Ctrl-V.'});
				POP.show('Notice', '');
			}
			return false;
		}

		tmp = new Array();
		var new_name = LAYER.generate_layer_name();
		LAYER.create_canvas(new_name);
		LAYER.layers.unshift({name: new_name, title: new_name, visible: true});
		LAYER.layer_active = 0;
		canvas_active().drawImage(PASTE_DATA, 0, 0);
		LAYER.layer_renew();
		EDIT.edit_clear();
	};
	
	this.save_state = function () {
		undo_level = 0;
		j = 0;

		//move previous
		layers_archive[2] = layers_archive[1];
		layers_archive[1] = layers_archive[0];

		//save last state
		layers_archive[j] = {};
		layers_archive[j].width = WIDTH;
		layers_archive[j].height = HEIGHT;
		layers_archive[j].layer_active = LAYER.layer_active;
		
		//layers
		layers_archive[j].layers = [];
		for(var i = LAYER.layers.length-1; i >=0; i--){
			var layer = {
				name: LAYER.layers[i].name,
				title: LAYER.layers[i].title, 
				visible: 1,
				opacity: LAYER.layers[i].opacity,
			};
			if (LAYER.layers[i].visible == false)
				layer.visible = 0;
			layers_archive[j].layers.push(layer);
		}
		
		layers_archive[j].data = {};
		for (var i in LAYER.layers) {
			layers_archive[j].data[LAYER.layers[i].name] = document.createElement('canvas');
			layers_archive[j].data[LAYER.layers[i].name].width = WIDTH;
			layers_archive[j].data[LAYER.layers[i].name].height = HEIGHT;
			layers_archive[j].data[LAYER.layers[i].name].getContext('2d').drawImage(document.getElementById(LAYER.layers[i].name), 0, 0);
		}								
	};
	//supports 3 levels undo system - more levels requires more memory
	this.undo = function () {
		if (layers_archive.length == 0){
			//not saved yet
			return false;
		}
		j = undo_level;
		undo_level++;
		if (layers_archive[j] == undefined || layers_archive[j].width == undefined){
			//no such data
			return false;
		}
		
		LAYER.remove_all_layers();
		
		if (WIDTH != layers_archive[j].width || HEIGHT != layers_archive[j].height) {
			WIDTH = layers_archive[j].width;
			HEIGHT = layers_archive[j].height;
			LAYER.set_canvas_size(true);
		}
		
		//add layers
		for(var i in layers_archive[j].layers){
			var layer = layers_archive[j].layers[i];
			var name = layer.name;
			var title = layer.title;
			var visible = parseInt(layer.visible);
			var opacity = parseInt(layer.opacity);

			LAYER.layer_add(name);
			//update attributes
			LAYER.layers[LAYER.layer_active].title = title;
			if (visible == 0)
				LAYER.layer_visibility(LAYER.layer_active);
			LAYER.layers[LAYER.layer_active].opacity = opacity;
		}
		LAYER.layer_active = layers_archive[j].layer_active;
		LAYER.layer_renew();

		//undo
		for (var i = LAYER.layers.length-1; i >= 0; i--) {
			//restore data
			document.getElementById(LAYER.layers[i].name).getContext("2d").clearRect(0, 0, WIDTH, HEIGHT);
			document.getElementById(LAYER.layers[i].name).getContext("2d").drawImage(layers_archive[j].data[LAYER.layers[i].name], 0, 0);
		}
		
		GUI.zoom();
	};
}
