var TOOLS = new TOOLS_CLASS();

function TOOLS_CLASS(){
	this.select_square_action = '';
	this.select_data = false;
	this.EXIF = false;
	
	var clone_data = false;
	var COLOUR_copy;
	
	this.draw_helpers = function(){
		//left menu
		var html = '';
		for(var i in ACTION_DATA){
			html += '<a title="'+ACTION_DATA[i].title+'"';
			html += ' style="background: #989898 url(\'img/'+ACTION_DATA[i].icon[0]+'\') no-repeat '+ACTION_DATA[i].icon[1]+'px '+ACTION_DATA[i].icon[2]+'px;"';
			if(ACTION_DATA[i].name==ACTION)
				html += ' class="active"';
			html += ' onclick="return TOOLS.action(\''+ACTION_DATA[i].name+'\');"';
			html += ' id="'+ACTION_DATA[i].name+'"';
			html += ' href="#"></a>'+"\n";
			}
		document.getElementById("menu_left_container").innerHTML = html;
		
		//draw colors
		var html = '';
		var colors_data = [
			['#ff0000', '#ff5b31', '#ffa500', '#ff007f', '#ff00ff'],	//red
			['#00ff00', '#008000', '#7fff00', '#00ff7f', '#8ac273'],	//green
			['#0000ff', '#007fff', '#37629c', '#000080', '#8000ff'],	//blue
			['#ffff00', '#ffff80', '#ddd06a', '#808000', '#bcb88a'],	//yellow
			['#ffffff', '#c0c0c0', '#808080', '#404040', '#000000'],	//grey
			];
		for(var i in colors_data){
			for(var j in colors_data[i]){
				html += '<div style="background-color:'+colors_data[i][j]+';" class="mini-color" onclick="TOOLS.set_color(this);"></div>'+"\n";
				}
			html += '<div style="clear:both;"></div>'+"\n";
			}
		document.getElementById("all_colors").innerHTML = html;
		}
	this.update_attribute = function(object, next_value){
		var max_value = 500;
		for(var k in this.action_data().attributes){
			if(k != object.id) continue;
			if(this.action_data().attributes[k]===true || this.action_data().attributes[k]===false){
				var value;
				if(next_value == 0)
					value=true;
				else
					value=false;
				//save
				this.action_data().attributes[k] = value;
				this.show_action_attributes();
				}
			else{
				if(next_value != undefined){
					object.value = parseInt(this.action_data().attributes[k]) + next_value;
					if(object.value < 0) object.value = 0;
					if(object.value > max_value) object.value = max_value;
					}
				else{
					if(object.value.length==0) return false;
					object.value = parseInt(object.value);
					object.value = Math.abs(object.value);
					if(object.value==0 || isNaN(object.value) || value > max_value)
						object.value = this.action_data().attributes[k];
					}
						
				//save
				this.action_data().attributes[k] = object.value;
				document.getElementById("main_colour").value = object.value;
				document.getElementById(k).value = object.value;
				}
			if(this.action_data().on_update != undefined)
				window[this.action_data().on_update](object.value);
			}
		}
	this.action = function(key){
		if(ACTION == key) return false;
		
		//change
		if(ACTION != '')
			document.getElementById(ACTION).className = "";
		ACTION = key;
		document.getElementById(key).className = "active";
		this.show_action_attributes();
	
		return false;
		}
	this.action_data = function(){	
		for(var i in ACTION_DATA){
			if(ACTION_DATA[i].name == ACTION)
				return ACTION_DATA[i];
			}
		}
	this.show_action_attributes = function(){
		html = '';
		var step = 5;
		for(var k in this.action_data().attributes){
			var title = k[0].toUpperCase() + k.slice(1);
			if(this.action_data().attributes[k]===true || this.action_data().attributes[k]===false){
				//select mode
				if(this.action_data().attributes[k]==true)
					html += '<div onclick="TOOLS.update_attribute(this, 1)" style="background-color:#5680c1;" class="attribute-area" id="'+k+'">'+title+'</div>';
				else
					html += '<div onclick="TOOLS.update_attribute(this, 0)" class="attribute-area" id="'+k+'">'+title+'</div>';
				}
			else{
				//number mode
				html += '<table style="width:100%;">';	//table for 100% width
				html += '<tr>';
				html += '<td style="font-weight:bold;padding-right:3px;">'+title+':</td>';
				html += '<td><input onKeyUp="TOOLS.update_attribute(this);" type="text" id="'+k+'" value="'+TOOLS.action_data().attributes[k]+'" /></td>';
				html += '</tr>';
				html += '</table>';	//78
				html += '<div style="float:left;width:32px;" onclick="TOOLS.update_attribute(this, '+(step)+')" class="attribute-area" id="'+k+'">+</div>';
				html += '<div style="margin-left:48px;margin-bottom:15px;" onclick="TOOLS.update_attribute(this, '+(-step)+')" class="attribute-area" id="'+k+'">-</div>';
				}
			}
		document.getElementById("action_attributes").innerHTML = html;
		}
	this.set_color = function(object){
		COLOUR = HELPER.rgb2hex_all(object.style.backgroundColor);
		COLOUR_copy = COLOUR;
		document.getElementById("main_colour").style.backgroundColor = COLOUR;
		document.getElementById("color_hex").value = COLOUR;
		var colours = HELPER.hex2rgb(COLOUR);
		document.getElementById("rgb_r").value = colours.r;
		document.getElementById("rgb_g").value = colours.g;
		document.getElementById("rgb_b").value = colours.b;
		}
	this.set_color_manual = function(object){
		if(object.value.length == 7){
			COLOUR = object.value;
			this.sync_colors();
			}
		else if(object.value.length > 7)
			object.value = COLOUR;
		}
	this.set_color_rgb = function(object, c){
		var colours = HELPER.hex2rgb(COLOUR);
		if(object.value.length > 3){
			object.value = colours[c];
			}
		else if(object.value.length > 0){
			value = object.value;
			value = parseInt(value);
			if(isNaN(value) || value != object.value || value > 255 || value < 0){
				object.value = colours[c];
				return false;
				}
			COLOUR = "#" + ("000000" + HELPER.rgbToHex(document.getElementById("rgb_r").value, document.getElementById("rgb_g").value, document.getElementById("rgb_b").value)).slice(-6);
			this.sync_colors();
			}
		}
	this.sync_colors = function(){
		document.getElementById("color_hex").value = COLOUR;
		document.getElementById("main_colour").style.backgroundColor = COLOUR;
		var colours = HELPER.hex2rgb(COLOUR);
		document.getElementById("rgb_r").value = colours.r;
		document.getElementById("rgb_g").value = colours.g;
		document.getElementById("rgb_b").value = colours.b;
		}
	this.toggle_color_select = function(){
		if(POP.active == false){
			POP.add({title: 'Colour:', function: function(){
				COLOUR_copy = COLOUR;
				
				var html = '<canvas style="position:relative;" id="c_all" width="175" height="187"></canvas>';
				html += '<br /><b>Lum:</b> <input oninput="TOOLS.change_lum(this.value)" type="range" value="0" min="-255" max="255" step="1">';
				return html;
				}});
			POP.show('Select colour', function(user_response){
				var param1 = parseInt(user_response.param1);
				}, undefined, this.toggle_color_select_onload);
			}
		else
			POP.hide();
		}
	this.change_lum = function(lumi){
		lumi = parseInt(lumi);
		var c3 = HELPER.hex2rgb(COLOUR_copy);
		c3.r += lumi;
		c3.g += lumi;
		c3.b += lumi;
		
		if(c3.r < 0) c3.r = 0;
		if(c3.g < 0) c3.g = 0;
		if(c3.b < 0) c3.b = 0;
		if(c3.r > 255) c3.r = 255;
		if(c3.g > 255) c3.g = 255;
		if(c3.b > 255) c3.b = 255;
		
		COLOUR = "#" + ("000000" + HELPER.rgbToHex(c3.r, c3.g, c3.b)).slice(-6);
		this.sync_colors();
		}
	this.toggle_color_select_onload = function(){
		var img = new Image();
		img.onload = function(){
			document.getElementById("c_all").getContext("2d").drawImage(img, 0, 0);
			document.getElementById("c_all").onmousedown = function(event){
				if(event.offsetX) {
					mouse_x = event.offsetX;
					mouse_y = event.offsetY;
					}
				else if(event.layerX) {
					mouse_x = event.layerX;
					mouse_y = event.layerY;
					}
				var c = document.getElementById("c_all").getContext("2d").getImageData(mouse_x, mouse_y, 1, 1).data;
				COLOUR = "#" + ("000000" + HELPER.rgbToHex(c[0], c[1], c[2])).slice(-6);
				TOOLS.sync_colors();
				COLOUR_copy = COLOUR;
				};
			}
		img.src = 'img/colors.png';
		}
	//type = click, right_click, drag, move, release
	this.select_tool = function(type, mouse, event){
		if(mouse.valid == false) return true;
		if(mouse.click_valid == false) return true;
		if(event.target.id == "canvas_preview") return true;
		else if(type == 'drag'){
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.drawImage(canvas_active(true), mouse.x - mouse.click_x, mouse.y - mouse.click_y);
			}
		else if(type == 'release'){
			if(mouse.valid == false || mouse.click_x === false) return false;
			if(mouse.x - mouse.click_x == 0 || mouse.y - mouse.click_y == 0) return false;
			MAIN.save_state();
			var tmp = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
			canvas_active().clearRect(0, 0, WIDTH, HEIGHT);
			canvas_active().putImageData(tmp, mouse.x - mouse.click_x, mouse.y - mouse.click_y);
			}
		}
	this.magic_wand = function(type, mouse, event){
		if(mouse.valid == false) return true;
		if(type == 'click'){
			MAIN.save_state();
			DRAW.tool_magic_wand(canvas_active(), WIDTH, HEIGHT, mouse.x, mouse.y, TOOLS.action_data().attributes.sensitivity);
			}
		}
	this.erase = function(type, mouse, event){
		if(mouse.valid == false) return true;
		if(type == 'click'){
			MAIN.save_state();
			var size = TOOLS.action_data().attributes.size;
			var is_circle = TOOLS.action_data().attributes.circle;
			
			if(is_circle == false)
				canvas_active().clearRect(mouse.x-size/2, mouse.y-size/2, size, size);
			else{
				//set Composite
				canvas_active().save();
				canvas_active().globalCompositeOperation = 'destination-out';
				canvas_active().fillStyle = "#ffffff";
				canvas_active().beginPath();
				canvas_active().arc(mouse.x, mouse.y, size/2, 0,Math.PI*2,true);
				canvas_active().fill();
				canvas_active().restore();
				}
			}
		else if(type == 'drag'){
			var size = TOOLS.action_data().attributes.size;
			var is_circle = TOOLS.action_data().attributes.circle;
			if(is_circle == false)
				canvas_active().clearRect(mouse.x - size/2, mouse.y - size/2, size, size);
			else{
				//set Composite
				canvas_active().save();
				canvas_active().globalCompositeOperation = 'destination-out';
				canvas_active().fillStyle = "#ffffff";
				canvas_active().beginPath();
				canvas_active().arc(mouse.x, mouse.y, size/2, 0,Math.PI*2,true);
				canvas_active().fill();
				canvas_active().restore();
				}
			DRAW.zoom(undefined, false);
			}
		else if(type == 'move'){
			var size = TOOLS.action_data().attributes.size;
			var is_circle = TOOLS.action_data().attributes.circle;
			var size_half = round(size/2);
			
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.lineWidth = 1;
			if(is_circle == false)
				HELPER.dashedRect(canvas_front, mouse.x-size_half, mouse.y-size_half, mouse.x+size_half, mouse.y+size_half, 1, '#000000');
			else{
				canvas_front.beginPath();
				canvas_front.arc(mouse.x, mouse.y, size/2, 0,Math.PI*2,true);
				canvas_front.stroke();
				}
			}
		}
	this.fill = function(type, mouse, event){
		if(mouse.valid == false) return true;
		if(type == 'click'){
			MAIN.save_state();
			var color_to = HELPER.hex2rgb(COLOUR);
			DRAW.toolFiller(canvas_active(), WIDTH, HEIGHT, mouse.x, mouse.y, color_to, TOOLS.action_data().attributes.sensitivity);
			}
		}
	this.pick_color = function(type, mouse, event){
		if(mouse.valid == false) return true;
		if(type == 'click'){
			var c = canvas_active().getImageData(mouse.x, mouse.y, 1, 1).data;
			COLOUR = "#" + ("000000" + HELPER.rgbToHex(c[0], c[1], c[2])).slice(-6);
			TOOLS.sync_colors();
			}
		}
	this.pencil = function(type, mouse, event){
		if(mouse.valid == false) return true;
		if(type == 'click'){
			MAIN.save_state();
			}
		else if(type == 'drag'){
			//why no simple lines? this way turns off aliasing
			if(mouse.last_x != false && mouse.last_y != false){
				//saving
				dist_x = mouse.last_x - mouse.x;
				dist_y = mouse.last_y - mouse.y;
				distance = Math.sqrt((dist_x*dist_x)+(dist_y*dist_y));
				radiance = Math.atan2(dist_y, dist_x);
				for(var i=0; i<distance; i++){
					x_tmp = mouse_x + Math.cos(radiance)*i;
					y_tmp = mouse_y + Math.sin(radiance)*i;
					
					x_tmp = Math.round(x_tmp);
					y_tmp = Math.round(y_tmp);
					canvas_active().fillStyle = COLOUR;
					canvas_active().fillRect(x_tmp, y_tmp, 1, 1);
					}
				}
			}
		else if(type == 'release'){
			canvas_active().fillStyle = COLOUR;
			canvas_active().fillRect (mouse.x, mouse.y, 1, 1);
			}
		}
	this.line = function(type, mouse, event){
		if(mouse.click_valid == false) return false;
		if(type == 'click'){
			MAIN.save_state();
			}
		else if(type == 'drag'){
			document.body.style.cursor = "crosshair";
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.beginPath();
			canvas_front.strokeStyle = COLOUR;
			canvas_front.lineWidth = TOOLS.action_data().attributes.size;
			var xx = mouse.x;
			var yy = mouse.y;
			//horizontal/vertical only
			if(CON.ctrl_pressed == true){
				if(Math.abs(mouse.click_x - mouse.x) < Math.abs(mouse.click_y - mouse.y) )
					xx = mouse.click_x;
				else
					yy = mouse.click_y;
				}
			if(TOOLS.action_data().attributes.arrow == true){
				//arrow
				var headlen = TOOLS.action_data().attributes.size * 5;
				if(headlen < 15) headlen = 15;
				DRAW.draw_arrow(canvas_front, mouse.click_x + 0.5, mouse.click_y + 0.5, xx + 0.5, yy + 0.5, headlen);
				}
			else{
				//line
				canvas_front.moveTo(mouse.click_x + 0.5, mouse.click_y + 0.5);
				canvas_front.lineTo(xx + 0.5, yy + 0.5);
				canvas_front.stroke();
				}
			}
		else if(type == 'release'){
			canvas_active().beginPath();
			canvas_active().strokeStyle = COLOUR;
			canvas_active().lineWidth = TOOLS.action_data().attributes.size;
			var xx = mouse.x;
			var yy = mouse.y;
			//horizontal/vertical only
			if(CON.ctrl_pressed == true){
				if(Math.abs(mouse.click_x - mouse.x) < Math.abs(mouse.click_y - mouse.y) )
					xx = mouse.click_x;
				else
					yy = mouse.click_y;
				}
			if(TOOLS.action_data().attributes.arrow == true){
				//arrow
				var headlen = TOOLS.action_data().attributes.size * 5;
				if(headlen < 15) headlen = 15;
				DRAW.draw_arrow(canvas_active(), mouse.click_x + 0.5, mouse.click_y + 0.5, xx + 0.5, yy + 0.5, headlen);
				}
			else{
				//line
				canvas_active().moveTo(mouse.click_x + 0.5, mouse.click_y + 0.5);
				canvas_active().lineTo(xx + 0.5, yy + 0.5);
				canvas_active().stroke();
				}
			}
		}
	this.letters = function(type, mouse, event){
		if(mouse.valid == false) return true;
		if(type == 'click'){
			var text = prompt("Enter text", '');
			if(text != null){
				MAIN.save_state();
				canvas_active().beginPath();
				canvas_active().fillStyle = COLOUR;
				canvas_active().font = "normal "+TOOLS.action_data().attributes.size+"px Arial";
				canvas_active().fillText(text, mouse_x, mouse_y + HELPER.font_pixel_to_height(TOOLS.action_data().attributes.size));
				DRAW.zoom();
				}
			}
		}
	this.draw_square = function(type, mouse, event){
		if(mouse.click_valid == false) return true;
		if(type == 'click'){
			MAIN.save_state();
			}
		else if(type == 'drag'){
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.beginPath();
			
			var start_x = mouse.click_x;
			var start_y = mouse.click_y;
			var dx = mouse.x - mouse.click_x;
			var dy = mouse.y - mouse.click_y;
			if(TOOLS.action_data().attributes.square==true){
				dx = Math.max(Math.abs(dx), Math.abs(dy));
				dy = Math.max(Math.abs(dx), Math.abs(dy));
				if(mouse.x < mouse.click_x)	start_x = start_x - dx;
				if(mouse.y < mouse.click_y)	start_y = start_y - dy;
				}
			
			canvas_front.fillStyle = COLOUR;
			canvas_front.strokeStyle = COLOUR;
			canvas_front.lineWidth = 1;
			if(TOOLS.action_data().attributes.fill==true)
				HELPER.roundRect(canvas_front, start_x + 0.5, start_y + 0.5, 
					dx, dy, 
					TOOLS.action_data().attributes.round, true, false);
			else
				HELPER.roundRect(canvas_front, start_x + 0.5, start_y + 0.5, 
					dx, dy, 
					TOOLS.action_data().attributes.round, false, true);
			}
		else if(type == 'release'){
			MAIN.save_state();
			canvas_active().beginPath();
			var start_x = mouse.click_x;
			var start_y = mouse.click_y;
			var dx = mouse.x - mouse.click_x;
			var dy = mouse.y - mouse.click_y;
			if(TOOLS.action_data().attributes.square==true){
				dx = Math.max(Math.abs(dx), Math.abs(dy));
				dy = Math.max(Math.abs(dx), Math.abs(dy));
				if(mouse.x < mouse.click_x)	start_x = start_x - dx;
				if(mouse.y < mouse.click_y)	start_y = start_y - dy;
				}
				
			canvas_active().fillStyle = COLOUR;
			canvas_active().strokeStyle = COLOUR;
			canvas_active().lineWidth = 1;
			if(TOOLS.action_data().attributes.fill==true)
				HELPER.roundRect(canvas_active(), start_x + 0.5, start_y + 0.5, 
					dx, dy, 
					TOOLS.action_data().attributes.round, true, false);
			else
				HELPER.roundRect(canvas_active(), start_x + 0.5, start_y + 0.5, 
					dx, dy, 
					TOOLS.action_data().attributes.round, false, true);
			}
		}
	this.draw_circle = function(type, mouse, event){
		if(mouse.click_valid == false) return true;
		if(type == 'click'){
			MAIN.save_state();
			}
		else if(type == 'drag'){
			dist_x = mouse.x - mouse.click_x;
			dist_y = mouse.y - mouse.click_y;
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			if(TOOLS.action_data().attributes.circle==true)
				dist_x = dist_y = Math.min(dist_x, dist_y);
			if(TOOLS.action_data().attributes.fill==true)
				HELPER.drawEllipseByCenter(canvas_front, mouse.click_x, mouse.click_y, dist_x*2, dist_y*2, COLOUR, true);
			else
				HELPER.drawEllipseByCenter(canvas_front, mouse.click_x, mouse.click_y, dist_x*2, dist_y*2, COLOUR);
			}
		else if(type == 'release'){
			dist_x = mouse.x - mouse.click_x;
			dist_y = mouse.y - mouse.click_y;
			if(TOOLS.action_data().attributes.circle==true)
				dist_x = dist_y = Math.min(dist_x, dist_y);
			canvas_active().lineWidth = 1;
			if(TOOLS.action_data().attributes.fill==true)
				HELPER.drawEllipseByCenter(canvas_active(), mouse.click_x, mouse.click_y, dist_x*2, dist_y*2, COLOUR, true);
			else
				HELPER.drawEllipseByCenter(canvas_active(), mouse.click_x, mouse.click_y, dist_x*2, dist_y*2, COLOUR);
			}
		}
	this.brush = function(type, mouse, event){
		if(mouse.valid == false) return true;
		if(type == 'click'){}
		else if(type == 'drag' && mouse.last_x != false && mouse.last_y != false){
			canvas_active().beginPath();
			canvas_active().moveTo(mouse.last_x, mouse.last_y);
			canvas_active().lineTo(mouse.x, mouse.y);
			canvas_active().lineWidth = TOOLS.action_data().attributes.size;
			canvas_active().strokeStyle = COLOUR;
			canvas_active().stroke();
			}
		}
	this.blur_tool = function(type, mouse, event){
		if(mouse.valid == false) return true;
		if(type == 'click'){
			MAIN.save_state();
			var size = TOOLS.action_data().attributes.size;
			var xx = mouse.x - size/2;
			var yy = mouse.y - size/2;
			var param1 = TOOLS.action_data().attributes.strength;
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.StackBlur(imageData, param1);	//add effect
			canvas_active().putImageData(filtered, xx, yy);
			DRAW.zoom();
			}
		else if(type == 'drag'){
			var size = TOOLS.action_data().attributes.size;
			var xx = mouse.x - size/2;
			var yy = mouse.y - size/2;
			var param1 = TOOLS.action_data().attributes.strength;
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.StackBlur(imageData, param1);	//add effect
			canvas_active().putImageData(filtered, xx, yy);
			DRAW.zoom();
			}
		else if(type == 'move'){
			var size = TOOLS.action_data().attributes.size;
			var size_half = round(size/2);
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.lineWidth = 1;
			HELPER.dashedRect(canvas_front, mouse.x-size_half, mouse.y-size_half, mouse.x+size_half, mouse.y+size_half, 1, '#000000');
			}
		}
	this.sharpen_tool = function(type, mouse, event){
		if(mouse.valid == false) return true;
		if(type == 'click'){
			MAIN.save_state();
			var size = TOOLS.action_data().attributes.size;
			var xx = mouse.x - size/2;
			var yy = mouse.y - size/2;
			var param1 = TOOLS.action_data().attributes.strength;
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.Sharpen(imageData, param1);	//add effect
			canvas_active().putImageData(filtered, xx, yy);
			DRAW.zoom();
			}
		else if(type == 'drag'){
			var size = TOOLS.action_data().attributes.size;
			var xx = mouse.x - size/2;
			var yy = mouse.y - size/2;
			var param1 = TOOLS.action_data().attributes.strength;
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.Sharpen(imageData, param1);	//add effect
			canvas_active().putImageData(filtered, xx, yy);
			DRAW.zoom();
			}
		else if(type == 'move'){
			var size = TOOLS.action_data().attributes.size;
			var size_half = round(size/2);
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.lineWidth = 1;
			HELPER.dashedRect(canvas_front, mouse.x-size_half, mouse.y-size_half, mouse.x+size_half, mouse.y+size_half, 1, '#000000');
			}
		}
	this.clone_tool = function(type, mouse, event){
		if(mouse.valid == false) return true;
		if(type == 'click'){
			MAIN.save_state();
			var size = TOOLS.action_data().attributes.size;
	
			if(clone_data === false){
				POP.add({title: "Message:",	value: 'Source is empty, right click on image first.',	});
				POP.show('Error', '');
				}
			else{
				//write clone data
				canvas_active().drawImage(clone_data, mouse.x - size/2, mouse.y - size/2);
				}
			}
		else if(type == 'right_click'){
			var size = TOOLS.action_data().attributes.size;
			
			//save clone source
			clone_data = document.createElement("canvas");
			clone_data.width = size;
			clone_data.height = size;
			clone_data.getContext("2d").drawImage(canvas_active(true), mouse.x - size/2, mouse.y - size/2, size, size, 0, 0, size, size);
			return false;
			}
		else if(type == 'drag'){
			if(event.which == 3) return true;
			if(clone_data === false) return false;	//no source
			var size = TOOLS.action_data().attributes.size;
	
			//write clone data
			canvas_active().drawImage(clone_data, mouse.x - size/2, mouse.y - size/2);
			}
		else if(type == 'move'){
			var size = TOOLS.action_data().attributes.size;
			var size_half = round(size/2);
			
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.lineWidth = 1;
			HELPER.dashedRect(canvas_front, mouse.x - size_half, mouse.y - size_half, mouse.x + size_half, mouse.y + size_half, 1, '#000000');
			}
		}
	this.select_square = function(type, mouse, event){
		if(mouse.click_valid == false) return true;
		if(type == 'drag'){
			if(mouse.x < 0) mouse.x = 0;
			if(mouse.y < 0) mouse.y = 0;
			if(mouse.x >= WIDTH) mouse.x = WIDTH-1;
			if(mouse.y >= HEIGHT) mouse.y = HEIGHT-1;
			if(mouse.click_x >= WIDTH) mouse.click_x = WIDTH-1;
			if(mouse.click_y >= HEIGHT) mouse.click_y = HEIGHT-1;
			if(TOOLS.select_square_action == ''){
				document.body.style.cursor = "crosshair";
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				HELPER.dashedRect(canvas_front, mouse.click_x, mouse.click_y, mouse.x, mouse.y);
				}
			else{
				if(TOOLS.select_square_action == 'move'){
					//move
					try{
						canvas_front.clearRect(0, 0, WIDTH, HEIGHT);	
						canvas_front.drawImage(	canvas_active(true), 
							TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h,
							mouse.x - mouse.click_x + TOOLS.select_data.x, 
							mouse.y - mouse.click_y + TOOLS.select_data.y,
							TOOLS.select_data.w, 
							TOOLS.select_data.h );
						canvas_front.restore();
						}
					catch(err){
						console.log("Error: "+err.message);
						}
					}
				else{
					//resize
					var s_x = TOOLS.select_data.x;
					var s_y = TOOLS.select_data.y;
					var d_x = TOOLS.select_data.w;
					var d_y = TOOLS.select_data.h;
					if(TOOLS.select_square_action == 'resize-left'){
						s_x += mouse.x - mouse.click_x;
						d_x -= mouse.x - mouse.click_x;
						}
					else if(TOOLS.select_square_action == 'resize-right')
						d_x += mouse.x - mouse.click_x;
					else if(TOOLS.select_square_action == 'resize-top'){
						s_y += mouse.y - mouse.click_y;
						d_y -= mouse.y - mouse.click_y;
						}
					else if(TOOLS.select_square_action == 'resize-bottom')
						d_y += mouse.y - mouse.click_y;
					else if(TOOLS.select_square_action == 'resize-1'){
						s_x += mouse.x - mouse.click_x;
						s_y += mouse.y - mouse.click_y;
						d_x -= mouse.x - mouse.click_x;
						d_y -= mouse.y - mouse.click_y;
						}
					else if(TOOLS.select_square_action == 'resize-2'){
						d_x += mouse.x - mouse.click_x;
						s_y += mouse.y - mouse.click_y;
						d_y -= mouse.y - mouse.click_y;
						}
					else if(TOOLS.select_square_action == 'resize-3'){
						d_x += mouse.x - mouse.click_x;
						d_y += mouse.y - mouse.click_y;
						}
					else if(TOOLS.select_square_action == 'resize-4'){
						s_x += mouse.x - mouse.click_x;
						d_x -= mouse.x - mouse.click_x;
						d_y += mouse.y - mouse.click_y;
						}
					var s_x = Math.max(s_x, 0);
					var s_y = Math.max(s_y, 0);
					var d_x = Math.max(d_x, 0);
					var d_y = Math.max(d_y, 0);
					
					canvas_front.save();	
					canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
					canvas_front.mozImageSmoothingEnabled = false;
					canvas_front.drawImage(canvas_active(true), 
						TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h, 
						s_x, s_y, d_x, d_y);
					canvas_front.restore();
					}
				}
			}
		else if(type == 'move' && TOOLS.select_data != false){
			canvas_front.lineWidth = 1;
			border_size = 5;
			TOOLS.select_square_action = '';
			var is_left = false;
			var is_right = false;
			var is_top = false;
			var is_bottom = false;
			//left
			if(TOOLS.check_mouse_pos(TOOLS.select_data.x, TOOLS.select_data.y + TOOLS.select_data.h/2, 4, mouse.x, mouse.y)==true){
				document.body.style.cursor = "w-resize";
				TOOLS.select_square_action = 'resize-left';
				is_left = true;
				}
			//top
			else if(TOOLS.check_mouse_pos(TOOLS.select_data.x + TOOLS.select_data.w/2, TOOLS.select_data.y, 4, mouse.x, mouse.y)==true){
				document.body.style.cursor = "n-resize";
				TOOLS.select_square_action = 'resize-top';
				is_top = true;
				}
			//right
			else if(TOOLS.check_mouse_pos(TOOLS.select_data.x + TOOLS.select_data.w, TOOLS.select_data.y + TOOLS.select_data.h/2, 4, mouse.x, mouse.y)==true){
				document.body.style.cursor = "w-resize";
				TOOLS.select_square_action = 'resize-right';
				is_right = true;
				}
			//bottom
			else if(TOOLS.check_mouse_pos(TOOLS.select_data.x + TOOLS.select_data.w/2, TOOLS.select_data.y + TOOLS.select_data.h, 4, mouse.x, mouse.y)==true){
				document.body.style.cursor = "n-resize";
				TOOLS.select_square_action = 'resize-bottom';
				is_bottom = true;
				}
			
			//corner 1
			if(TOOLS.check_mouse_pos(TOOLS.select_data.x, TOOLS.select_data.y, 4, mouse.x, mouse.y)==true){
				document.body.style.cursor = "nw-resize";
				TOOLS.select_square_action = 'resize-1';
				}
			//corner 2
			else if(TOOLS.check_mouse_pos(TOOLS.select_data.x + TOOLS.select_data.w, TOOLS.select_data.y, 4, mouse.x, mouse.y)==true){
				document.body.style.cursor = "ne-resize";
				TOOLS.select_square_action = 'resize-2';
				}
			//corner 3
			else if(TOOLS.check_mouse_pos(TOOLS.select_data.x + TOOLS.select_data.w, TOOLS.select_data.y + TOOLS.select_data.h, 4, mouse.x, mouse.y)==true){
				document.body.style.cursor = "nw-resize";
				TOOLS.select_square_action = 'resize-3';
				}
			//corner 4
			else if(TOOLS.check_mouse_pos(TOOLS.select_data.x, TOOLS.select_data.y + TOOLS.select_data.h, 4, mouse.x, mouse.y)==true){
				document.body.style.cursor = "ne-resize";
				TOOLS.select_square_action = 'resize-4';
				}
	
			if(TOOLS.select_square_action == '' 
			  && mouse.x > TOOLS.select_data.x && mouse.y > TOOLS.select_data.y
			  && mouse.x < TOOLS.select_data.x + TOOLS.select_data.w && mouse.y < TOOLS.select_data.y + TOOLS.select_data.h){
			  	TOOLS.select_square_action = 'move';
				document.body.style.cursor = "move";
				}
			if(TOOLS.select_square_action == '' && mouse.valid == true)
				document.body.style.cursor = "auto";	
			}
		else if(type == 'release'){
			if(mouse.x < 0) mouse.x = 0;
			if(mouse.y < 0) mouse.y = 0;
			if(mouse.x >= WIDTH) mouse.x = WIDTH-1;
			if(mouse.y >= HEIGHT) mouse.y = HEIGHT-1;
			if(mouse.click_x >= WIDTH) mouse.click_x = WIDTH-1;
			if(mouse.click_y >= HEIGHT) mouse.click_y = HEIGHT-1;
	
			if(TOOLS.select_square_action == ''){
				if(mouse.x != mouse.click_x && mouse.y != mouse.click_y){
					TOOLS.select_data = {
						x: 	Math.min(mouse.x, mouse.click_x),
						y: 	Math.min(mouse.y, mouse.click_y),
						w: 	Math.abs(mouse.x - mouse.click_x),
						h: 	Math.abs(mouse.y - mouse.click_y)
						};
					}
				}
			else{	
				MAIN.save_state();
				if(TOOLS.select_square_action=='move'){
					try{
						select_data_tmp = canvas_active().getImageData(TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h);
						canvas_active().clearRect(TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h);
						canvas_active().putImageData(select_data_tmp, mouse.x - mouse.click_x + TOOLS.select_data.x, mouse.y - mouse.click_y + TOOLS.select_data.y);
						}
					catch(err){
						console.log("Error: "+err.message);
						}
					TOOLS.select_data.x += mouse.x - mouse.click_x;
					TOOLS.select_data.y += mouse.y - mouse.click_y;
					}
				else{
					var s_x = TOOLS.select_data.x;
					var s_y = TOOLS.select_data.y;
					var d_x = TOOLS.select_data.w;
					var d_y = TOOLS.select_data.h;
					
					if(TOOLS.select_square_action == 'resize-left'){
						s_x += mouse.x - mouse.click_x;
						d_x -= mouse.x - mouse.click_x;
						}
					else if(TOOLS.select_square_action == 'resize-right')
						d_x += mouse.x - mouse.click_x;
					else if(TOOLS.select_square_action == 'resize-top'){
						s_y += mouse.y - mouse.click_y;
						d_y -= mouse.y - mouse.click_y;
						}
					else if(TOOLS.select_square_action == 'resize-bottom')
						d_y += mouse.y - mouse.click_y;
					else if(TOOLS.select_square_action == 'resize-1'){
						s_x += mouse.x - mouse.click_x;
						s_y += mouse.y - mouse.click_y;
						d_x -= mouse.x - mouse.click_x;
						d_y -= mouse.y - mouse.click_y;
						}
					else if(TOOLS.select_square_action == 'resize-2'){
						d_x += mouse.x - mouse.click_x;
						s_y += mouse.y - mouse.click_y;
						d_y -= mouse.y - mouse.click_y;
						}
					else if(TOOLS.select_square_action == 'resize-3'){
						d_x += mouse.x - mouse.click_x;
						d_y += mouse.y - mouse.click_y;
						}
					else if(TOOLS.select_square_action == 'resize-4'){
						s_x += mouse.x - mouse.click_x;
						d_x -= mouse.x - mouse.click_x;
						d_y += mouse.y - mouse.click_y;
						}
					var s_x = Math.max(s_x, 0);
					var s_y = Math.max(s_y, 0);
					var d_x = Math.max(d_x, 0);
					var d_y = Math.max(d_y, 0);
				
					var tempCanvas = document.createElement("canvas");
					var tempCtx = tempCanvas.getContext("2d");
					tempCanvas.width = Math.max(d_x, TOOLS.select_data.w);
					tempCanvas.height = Math.max(d_y, TOOLS.select_data.h);
					tempCtx.drawImage(canvas_active(true), TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h, 0, 0, TOOLS.select_data.w, TOOLS.select_data.h);
					
					canvas_active().clearRect(s_x, s_y, d_x, d_y);
					canvas_active().drawImage(tempCanvas, 0, 0, TOOLS.select_data.w, TOOLS.select_data.h, s_x, s_y, d_x, d_y);
				
					TOOLS.select_data.x = s_x;
					TOOLS.select_data.y = s_y;
					TOOLS.select_data.w = d_x;
					TOOLS.select_data.h = d_y;
					}
				}
			TOOLS.draw_selected_area();
			LAYER.update_info_block();
			}
		}
	this.check_mouse_pos = function(x, y, size, mouse_x, mouse_y){
		if(mouse_x > x-round(size) && mouse_x < x+round(size))
			if(mouse_y > y-round(size) && mouse_y < y+round(size))
			return true;
		return false;
		};
	this.draw_selected_area = function(){
		if(TOOLS.select_data == false) return false;
		//draw area
		canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
		var x = TOOLS.select_data.x;
		var y = TOOLS.select_data.y;
		var w = TOOLS.select_data.w;
		var h = TOOLS.select_data.h;
		if(ZOOM != 100){
			x = round(x);
			y = round(y);
			w = round(w);
			h = round(h);
			}
		
		var x2 = Math.min(x + w, WIDTH-1);
		var y2 = Math.min(y + h, HEIGHT-1);
		HELPER.dashedRect(canvas_front, x, y, x2, y2);
		
		//draw carners
		square(x, y, 4);
		square(x+w, y, 4);
		square(x, y+h, 4);
		square(x+w, y+h, 4);
		
		//draw centers
		square(x+w/2, y, 4);
		square(x, y+h/2, 4);
		square(x+w/2, y+h, 4);
		square(x+w, y+h/2, 4);
		
		function square(x, y, size){
			canvas_front.beginPath();
			canvas_front.rect(x-round(size/2), y-round(size/2), size, size);
			canvas_front.fillStyle = "#000000";
			canvas_front.fill();
			}
		}
	this.save_EXIF = function(){
		TOOLS.EXIF = this.exifdata;
		//check length
		var n = 0;
		for(var i in TOOLS.EXIF)
			n++;
		if(n == 0)
			TOOLS.EXIF = false;
		};
	}
