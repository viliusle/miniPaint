var MAIN = new MAIN_CLASS();
document.onload = MAIN.init(true);

function MAIN_CLASS(){
	this.grid = false;
	this.TRANSPARENCY = true;
	var LAYERS_ARCHIVE = [{}, {}, {}];	
	var undo_level = 0;
	
	this.init = function(first_load){
		if(first_load===true){
			TOOLS.draw_helpers();
			POP.height_mini = Math.round(POP.width_mini * HEIGHT / WIDTH);
			}
		CON.autosize = true;
		TOOLS.EXIF = false;
		TOOLS.select_data = false;
		for(i=1; i<LAYERS.length; i++)
			LAYER.layer_remove(i);
		LAYERS = [];
		canvas_main.clearRect(0, 0, WIDTH, HEIGHT);
		LAYER.layer_add("Background");
		LAYER.set_canvas_size();
		DRAW.draw_background(canvas_back, WIDTH, HEIGHT);
		document.getElementById("canvas_preview").width = DRAW.PREVIEW_SIZE.w;
		document.getElementById("canvas_preview").height = DRAW.PREVIEW_SIZE.h;
		var color_rgb = HELPER.hex2rgb(COLOUR);
		document.getElementById("rgb_r").value = color_rgb.r;
		document.getElementById("rgb_g").value = color_rgb.g;
		document.getElementById("rgb_b").value = color_rgb.b;
		document.getElementById("rgb_a").value = ALPHA;
		DRAW.redraw_preview();
		//detect color support
		if(HELPER.chech_input_color_support('main_colour') == true)
			document.getElementById("main_colour").value = COLOUR; //supported
		else{
			//not supported
			document.getElementById("main_colour").style.display = 'none';
			document.getElementById("main_colour_alt").style.display = '';
			document.getElementById("main_colour_alt").style.backgroundColor = COLOUR;
			}
		canvas_grid.globalAlpha = 0.8;
		};
	this.save_state = function(){
		undo_level = 0;
		j = 0;
		
		//move previous
		LAYERS_ARCHIVE[2] = LAYERS_ARCHIVE[1];
		LAYERS_ARCHIVE[1] = LAYERS_ARCHIVE[0];
		
		//save last state
		LAYERS_ARCHIVE[j] = {};
		LAYERS_ARCHIVE[j].width = WIDTH;
		LAYERS_ARCHIVE[j].height = HEIGHT;
		LAYERS_ARCHIVE[j].data = {};
		for(var i in LAYERS){
			LAYERS_ARCHIVE[j].data[LAYERS[i].name] = document.createElement('canvas');
			LAYERS_ARCHIVE[j].data[LAYERS[i].name].width = WIDTH;
			LAYERS_ARCHIVE[j].data[LAYERS[i].name].height = HEIGHT;
			LAYERS_ARCHIVE[j].data[LAYERS[i].name].getContext('2d').drawImage(document.getElementById(LAYERS[i].name), 0, 0);
			}
		return true;
		};
	//supports 3 levels undo system - more levels requires more memory - max 1 gb?
	this.undo = function(){	
		if(LAYERS_ARCHIVE.length == 0) return false;
		j = undo_level;
		undo_level++;
		if(LAYERS_ARCHIVE[j] == undefined || LAYERS_ARCHIVE[j].width == undefined) return false;
		if(WIDTH != LAYERS_ARCHIVE[j].width || HEIGHT != LAYERS_ARCHIVE[j].height){
			WIDTH = LAYERS_ARCHIVE[j].width;
			HEIGHT = LAYERS_ARCHIVE[j].height;
			RATIO = WIDTH/HEIGHT;
			LAYER.set_canvas_size(true);
			return true;	//size changed, cant undo
			}
		
		//undo
		for(var i in LAYERS){
			if(LAYERS_ARCHIVE[j].data[LAYERS[i].name] != undefined){
				document.getElementById(LAYERS[i].name).getContext("2d").clearRect(0, 0, WIDTH, HEIGHT);
				document.getElementById(LAYERS[i].name).getContext("2d").drawImage(LAYERS_ARCHIVE[j].data[LAYERS[i].name], 0, 0);
				}
			}
		DRAW.zoom();
		return true;
		};
	this.load_xml = function(data){
		var xml = $.parseXML(data);
		w = $(xml).find("width").text();
		h = $(xml).find("height").text();
		
		//delete old layers
		for(var i in LAYERS)
			LAYER.layer_remove(i);
		
		//init new file
		ZOOM = 100;
		MAIN.init();
		
		//set attributes
		WIDTH = w;
		HEIGHT = h;
		RATIO = WIDTH/HEIGHT;
		LAYER.set_canvas_size();
		
		//add layers
		$('layer', xml).each(function(i){
			var name = $(this).find("name").text();
			var visible = $(this).find("visible").text();
			var opacity = $(this).find("opacity").text();
			
			if(i > 0){	//first layer exists by default - Background
				LAYER.layer_add(name);
				//update attributes
				LAYERS[LAYER.layer_active].name = name;
				if(visible == 0)
					LAYER.layer_visibility(LAYER.layer_active);
				LAYERS[LAYER.layer_active].opacity = opacity;
				}
			});
		LAYER.layer_renew();
		
		//add data
		$('data', xml).each(function(i){
			var name = $(this).find("name").text();
			var data = $(this).find("data").text();
			
			var img = new Image();
			img.src = data;
			img.onload = function(){
				document.getElementById(name).getContext('2d').drawImage(img, 0, 0);
				
				LAYER.layer_renew();
				DRAW.zoom();
				};
			});
		};
	}
