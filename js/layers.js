var LAYER = new LAYER_CLASS();

function LAYER_CLASS(){
	this.layer_active = 0;
	var imageData_tmp;
	
	//create layer
	this.layer_add = function(name, data, type){
		tmp = new Array();
		if(data == undefined){
			//empty layer
			if(name==undefined)
				name = 'Layer #'+(LAYERS.length+1);
			tmp.name = name;
			tmp.visible = true;
			tmp.opacity = 1;
			if(LAYERS.length==0)
				tmp.primary = 1;
			else
				LAYER.create_canvas(name);
			LAYERS.push(tmp);
			}
		else{
			var img = new Image();
			img.onload = function(){
				//image
				var new_name = name;
				
				//check size
				var size_increased = false;
				if(img.width > WIDTH || img.height > HEIGHT){
					if(img.width > WIDTH)
						WIDTH = img.width;
					if(img.height > HEIGHT)
						HEIGHT = img.height;
					RATIO = WIDTH/HEIGHT;
					LAYER.set_canvas_size();
					size_increased = true;
					}
				if(LAYERS.length == 1 && CON.autosize == true && size_increased == false){
					var trim_info = DRAW.trim_info(document.getElementById("Background"));
					if(trim_info.left == WIDTH){
						WIDTH = img.width;
						HEIGHT = img.height;
						RATIO = WIDTH/HEIGHT;
						LAYER.set_canvas_size(false);
						}
					}
				
				for(var i in LAYERS){
					if(LAYERS[i].name == new_name)
						new_name = 'Layer #'+(LAYERS.length+1);
					}
				LAYER.create_canvas(new_name);
				LAYERS.push({
					name: new_name, 
					visible: true,
					opacity: 1,
					});
				LAYER.layer_active = LAYERS.length-1;

				document.getElementById(new_name).getContext("2d").globalAlpha = 1;
				document.getElementById(new_name).getContext('2d').drawImage(img, 0, 0);
				LAYER.layer_renew();
				DRAW.zoom();
				}
			img.src = data;
			}
		LAYER.layer_active = LAYERS.length-1;
		document.getElementById(LAYERS[LAYER.layer_active].name).getContext("2d").globalAlpha = 1;
		this.layer_renew();
		}
	this.create_canvas = function(canvas_id){
		var new_canvas = document.createElement('canvas');
		new_canvas.setAttribute('id', canvas_id);
	
		document.getElementById('canvas_more').appendChild(new_canvas);
		document.getElementById(canvas_id).width = WIDTH;
		document.getElementById(canvas_id).height = HEIGHT;
		document.getElementById(canvas_id).getContext("2d").mozImageSmoothingEnabled = false;
		document.getElementById(canvas_id).getContext("2d").webkitImageSmoothingEnabled = false;
		//document.getElementById(canvas_id).getContext("2d").scale(ZOOM/100, ZOOM/100);
		}
	this.move_layer = function(direction){
		if(LAYERS.length < 2) return false;
		if(LAYERS[LAYER.layer_active].primary == 1) return false;
		LAYER.layer_active = parseInt(LAYER.layer_active);
		
		var layer_from = LAYERS[LAYER.layer_active];
		var content = document.getElementById(LAYERS[LAYER.layer_active].name);
		var parent = content.parentNode;
		
		
		if(direction == 'up'){
			if(LAYERS[LAYER.layer_active-1] == undefined) return false;
			if(LAYERS[LAYER.layer_active-1].primary == 1) return false;
			var layer_to = LAYERS[LAYER.layer_active-1];
			parent.insertBefore(content, parent.firstChild);
			}
		else{
			if(LAYERS[LAYER.layer_active+1] == undefined) return false;
			var layer_to = LAYERS[LAYER.layer_active+1];
			var content = document.getElementById(LAYERS[LAYER.layer_active+1].name);
			parent.insertBefore(content, parent.firstChild);
			}
		
		//switch name
		var tmp = layer_to.name;
		layer_to.name = layer_from.name;
		layer_from.name = tmp;
		//switch visible
		var tmp = layer_to.visible;
		layer_to.visible = layer_from.visible;
		layer_from.visible = tmp;
		//switch opacity
		var tmp = layer_to.opacity;
		layer_to.opacity = layer_from.opacity;
		layer_from.opacity = tmp;
		
		LAYER.layer_active = LAYERS.length-1;
		for(i in LAYERS){
			if(LAYERS[i].name == layer_to.name){
				LAYER.layer_active = i;
				break;
				}
			}
		this.layer_renew();
		DRAW.zoom();
		return true;
		}
	this.layer_visibility = function(i){
		if(LAYERS[i].visible == true){
			LAYERS[i].visible = false;
			document.getElementById(LAYERS[i].name).style.visibility = 'hidden'; 
			document.getElementById('layer_'+i).src = "img/yes-grey.png";
			}
		else{
			LAYERS[i].visible = true;
			document.getElementById(LAYERS[i].name).style.visibility = 'visible';
			document.getElementById('layer_'+i).src = "img/yes.png";
			}
		this.layer_renew();
		DRAW.redraw_preview();
		}
	this.layer_remove = function(i){
		element = document.getElementById(LAYERS[i].name);
		element.getContext("2d").clearRect(0, 0, WIDTH, HEIGHT);
		element.parentNode.removeChild(element);
		
		LAYERS.splice(i, 1);
		if(LAYER.layer_active >= LAYERS.length)
			LAYER.layer_active = LAYERS.length-1;
		this.layer_renew();
		DRAW.redraw_preview();
		}
	this.layer_move_active = function(x, y){
		var distance = 10;
		if(CON.ctrl_pressed == true)
			distance = 50;
		if(CON.shift_pressed == true)
			distance = 1;
		//move
		dx = x*distance;
		dy = y*distance;
		
		//save
		var buffer = document.createElement('canvas');
		buffer.width = WIDTH;
		buffer.height = HEIGHT;
		buffer.getContext('2d').drawImage(canvas_active(true), 0, 0);
		
		//move
		canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
		canvas_active().drawImage(buffer, dx, dy);
		}
	this.select_layer = function(i){
		if(LAYER.layer_active != i)
			LAYER.layer_active = i;	//select
		else
			LAYER.layer_active = 0;	//remove select
		this.layer_renew();
		}
	this.layer_renew = function(){	
		var html = '';
		for(i in LAYERS){
			//create
			if(LAYER.layer_active==i)
				html += '<div class="layer active">';
			else
				html += '<div class="layer">';
			var title = LAYERS[i].name;
			html += '<span class="layer_title" onclick="LAYER.select_layer(\''+i+'\')">'+title+'</span>';
			if(LAYERS[i].primary != 1){
				html += '<a class="layer_visible" onclick="LAYER.layer_remove(\''+i+'\');return false;" title="delete" href="#"></a>';
				}
			else
				html += '<a style="visibility:hidden;" class="layer_visible" href="#"></a>';
			//hide
			if(LAYERS[i].visible == true)
				html += '<a class="layer_delete" id="layer_'+i+'" onclick="LAYER.layer_visibility(\''+i+'\');return false;" title="hide" href="#"></a>';
			else
				html += '<a class="layer_delete layer_unvisible" id="layer_'+i+'" onclick="LAYER.layer_visibility(\''+i+'\');return false;" title="show" href="#"></a>';
	
			html += '</div>';
			//show
			document.getElementById('layers').innerHTML = html;
			}
		}
	this.update_info_block = function(){
		var html = '';
		html += '<span style="font-weight:bold;min-width:45px;display:block;float:left;">Size:</span> '+WIDTH+"x"+HEIGHT+"<br />";
		var x = 0;
		var y = 0;
		if(CON.mouse != undefined){
			x = CON.mouse.x;
			y = CON.mouse.y;
			}
		html += '<span style="font-weight:bold;min-width:45px;display:block;float:left;">Mouse:</span> '+x+", "+y+"<br />";
		if(TOOLS.select_data != false){
			html += '<span style="font-weight:bold;min-width:45px;display:block;float:left;">XY:</span> '+TOOLS.select_data.x+", "+TOOLS.select_data.y+"<br />";
			html += '<span style="font-weight:bold;min-width:45px;display:block;float:left;">Area:</span> '+TOOLS.select_data.w+", "+TOOLS.select_data.h+"<br />";
			}
		
		document.getElementById('info').innerHTML = html;
		}
	this.set_canvas_size = function(repaint){
		var W = round(WIDTH);
		var H = round(W / RATIO);
		
		this.resize_canvas("canvas_back");
		DRAW.draw_background(canvas_back, WIDTH, HEIGHT);
		this.resize_canvas("canvas_front", false);
		for(i in LAYERS){
			if(repaint === false)
				this.resize_canvas(LAYERS[i].name, false);
			else
				this.resize_canvas(LAYERS[i].name, true);
			}
		
		document.getElementById('resize-w').style.marginLeft = (106+W)+"px";
		document.getElementById('resize-w').style.marginTop = (1+H/2)+"px";
		document.getElementById('resize-h').style.marginLeft = (106+W/2)+"px";
		document.getElementById('resize-h').style.marginTop = (1+H)+"px";
		document.getElementById('resize-wh').style.marginLeft = (106+W)+"px";
		document.getElementById('resize-wh').style.marginTop = (1+H)+"px";
		
		this.update_info_block();
		CON.calc_preview_auto();
		DRAW.zoom();
		}
	this.resize_canvas = function(canvas_name, repaint){
		var W = round(WIDTH );
		var H = round(W / RATIO);
		var canvas = document.getElementById(canvas_name);
		var ctx = canvas.getContext("2d");
	
		if(repaint==false){
			canvas.width = W;
			canvas.height = H;
			}
		else{
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
		}
	this.set_alpha = function(){
		POP.add({name: "param1",	title: "Alpha:",	value: LAYERS[LAYER.layer_active].opacity,	range: [0, 1], step: 0.01 });
		POP.show('Opacity', function(user_response){
			var param1 = parseFloat(user_response.param1);
			LAYERS[LAYER.layer_active].opacity = param1;
			canvas_active().globalAlpha = param1;
			
			var img = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
			var imgData = img.data;
			var new_alpha = 255*param1;
			if(new_alpha < 10)
				new_alpha = 10;
			canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
			for(var y = 0; y < img.height; y++){
				for(var x = 0; x < img.width; x++){
					var k = ((y * (img.width * 4)) + (x * 4));
					if(imgData[k+3] > 0)
						imgData[k+3] = new_alpha;
					}
				}
			canvas_active().putImageData(img, 0, 0);
			
			DRAW.zoom();
			});
		}
	this.canvas_active = function(base){	log('canvas_active():  '+LAYER.layer_active);
		for(i in LAYERS){
			if(LAYER.layer_active==i){
				if(base == undefined)
					return document.getElementById(LAYERS[i].name).getContext("2d");
				else
					return document.getElementById(LAYERS[i].name);
				}
			}				log('error.........');
		}
	}

function canvas_active(base){
	for(i in LAYERS){
		if(LAYER.layer_active==i){
			if(base == undefined)
				return document.getElementById(LAYERS[i].name).getContext("2d");
			else
				return document.getElementById(LAYERS[i].name);
			}
		}
	}
