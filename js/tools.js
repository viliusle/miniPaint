var TOOLS = new TOOLS_CLASS();

function TOOLS_CLASS(){
	this.select_square_action = '';
	this.select_data = false;
	this.EXIF = false;
	this.last_line_x;
	this.last_line_y;
	var clone_data = false;
	var COLOUR_copy;
	var curve_points = [];
	
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
			['#ffffff', '#c0c0c0', '#808080', '#404040', '#000000']	//grey
			];
		for(var i in colors_data){
			for(var j in colors_data[i]){
				html += '<div style="background-color:'+colors_data[i][j]+';" class="mini-color" onclick="TOOLS.set_color(this);"></div>'+"\n";
				}
			html += '<div style="clear:both;"></div>'+"\n";
			}
		document.getElementById("all_colors").innerHTML = html;
		};
	this.update_attribute = function(object, next_value){
		var max_value = 500;
		for(var k in this.action_data().attributes){
			if(k != object.id) continue;
			if(this.action_data().attributes[k]===true || this.action_data().attributes[k]===false){
				//true / false
				var value;
				if(next_value == 0)
					value=true;
				else
					value=false;
				//save
				this.action_data().attributes[k] = value;
				this.show_action_attributes();
				}
			else if(typeof this.action_data().attributes[k] == 'object'){
				//select
				var key = k.replace("_values","");
				this.action_data().attributes[key] = object.value;
				}
			else if(this.action_data().attributes[k][0] == '#'){
				//color
				var key = k.replace("_values","");
				this.action_data().attributes[key] = object.value;
				}
			else{
				//numbers
				if(next_value != undefined){
					if(next_value > 0){
						if(parseInt(this.action_data().attributes[k]) == 0)
							object.value = 1;
						else if(parseInt(this.action_data().attributes[k]) == 1)
							object.value = 5;
						else if(parseInt(this.action_data().attributes[k]) == 5)
							object.value = 10;
						else
							object.value = parseInt(this.action_data().attributes[k]) + next_value;
						}
					else if(next_value < 0){
						if(parseInt(this.action_data().attributes[k]) == 1)
							object.value = 0;
						else if(parseInt(this.action_data().attributes[k]) <= 5)
							object.value = 1;
						else if(parseInt(this.action_data().attributes[k]) <= 10)
							object.value = 5;
						else if(parseInt(this.action_data().attributes[k]) <= 20)
							object.value = 10;
						else
							object.value = parseInt(this.action_data().attributes[k]) + next_value;
						}
					
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
				if(k == 'power' && object.value > 100)
					object.value = 100;
						
				//save
				this.action_data().attributes[k] = object.value;
				
				document.getElementById(k).value = object.value;
				}
			if(this.action_data().on_update != undefined)
				TOOLS[this.action_data().on_update](object.value);
			}
		};
	this.action = function(key){
		TOOLS[key]('init', {valid:true});
		if(ACTION == key) return false;
		
		//change
		if(ACTION != '')
			document.getElementById(ACTION).className = "";
		ACTION = key;
		document.getElementById(key).className = "active";
		this.show_action_attributes();
		
		return false;
		};
	this.action_data = function(){	
		for(var i in ACTION_DATA){
			if(ACTION_DATA[i].name == ACTION)
				return ACTION_DATA[i];
			}
		};
	this.show_action_attributes = function(){
		html = '';
		var step = 10;
		for(var k in this.action_data().attributes){
			var title = k[0].toUpperCase() + k.slice(1);
			title = title.replace("_"," ");
			if(TOOLS.action_data().attributes[k+"_values"] != undefined) continue;
			if(this.action_data().attributes[k]===true || this.action_data().attributes[k]===false){
				//true / false
				if(this.action_data().attributes[k]==true)
					html += '<div onclick="TOOLS.update_attribute(this, 1)" style="background-color:#5680c1;" class="attribute-area" id="'+k+'">'+title+'</div>';
				else
					html += '<div onclick="TOOLS.update_attribute(this, 0)" class="attribute-area" id="'+k+'">'+title+'</div>';
				}
			else if(typeof TOOLS.action_data().attributes[k] == 'object'){
				//drop down select
				html += '<select style="font-size:11px;margin-bottom:10px;" onchange="TOOLS.update_attribute(this);" id="'+k+'">';
				for(var j in TOOLS.action_data().attributes[k]){
					var sel = '';
					var key = k.replace("_values","");
					if(TOOLS.action_data().attributes[key] == TOOLS.action_data().attributes[k][j])
						sel = 'selected="selected"';
					html += '<option '+sel+' name="'+TOOLS.action_data().attributes[k][j]+'">'+TOOLS.action_data().attributes[k][j]+'</option>';
					}
				html += '</select>';
				}
			else if(TOOLS.action_data().attributes[k][0] == '#'){
				//color
				html += '<table style="width:100%;">';	//table for 100% width
				html += '<tr>';
				html += '<td style="font-weight:bold;width:45px;">'+title+':</td>';
				html += '<td><input onchange="TOOLS.update_attribute(this);" type="color" id="'+k+'" value="'+TOOLS.action_data().attributes[k]+'" /></td>';
				html += '</tr>';
				html += '</table>';
				}
			else{
				//numbers
				html += '<div id="'+k+'_container">';
				html += '<table style="width:100%;">';	//table for 100% width
				html += '<tr>';
				html += '<td style="font-weight:bold;padding-right:2px;white-space:nowrap;">'+title+':</td>';
				html += '<td><input onKeyUp="TOOLS.update_attribute(this);" type="text" id="'+k+'" value="'+TOOLS.action_data().attributes[k]+'" /></td>';
				html += '</tr>';
				html += '</table>';
				html += '<div style="float:left;width:32px;" onclick="TOOLS.update_attribute(this, '+(step)+')" class="attribute-area" id="'+k+'">+</div>';
				html += '<div style="margin-left:48px;margin-bottom:15px;" onclick="TOOLS.update_attribute(this, '+(-step)+')" class="attribute-area" id="'+k+'">-</div>';
				html += '</div>';
			}
			}
		document.getElementById("action_attributes").innerHTML = html;
		};
	this.set_color = function(object){
		if(HELPER.chech_input_color_support('main_colour') == true && object.id == 'main_colour')
			COLOUR = object.value;
		else
			COLOUR = HELPER.rgb2hex_all(object.style.backgroundColor);
		COLOUR_copy = COLOUR;
		
		if(HELPER.chech_input_color_support('main_colour') == true)
			document.getElementById("main_colour").value = COLOUR; //supported
		else
			document.getElementById("main_colour_alt").style.backgroundColor = COLOUR; //not supported
		
		document.getElementById("color_hex").value = COLOUR;
		var colours = HELPER.hex2rgb(COLOUR);
		document.getElementById("rgb_r").value = colours.r;
		document.getElementById("rgb_g").value = colours.g;
		document.getElementById("rgb_b").value = colours.b;
		};
	this.set_color_manual = function(object){
		if(object.value.length == 7){
			COLOUR = object.value;
			this.sync_colors();
			}
		else if(object.value.length > 7)
			object.value = COLOUR;
		};
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
			ALPHA = document.getElementById("rgb_a").value;
			document.getElementById("rgb_a").value = ALPHA;
			this.sync_colors();
			}
		};
	this.sync_colors = function(){
		document.getElementById("color_hex").value = COLOUR;
		
		if(HELPER.chech_input_color_support('main_colour') == true)
			document.getElementById("main_colour").value = COLOUR; //supported
		else
			document.getElementById("main_colour_alt").style.backgroundColor = COLOUR; //not supported
		
		var colours = HELPER.hex2rgb(COLOUR);
		document.getElementById("rgb_r").value = colours.r;
		document.getElementById("rgb_g").value = colours.g;
		document.getElementById("rgb_b").value = colours.b;
		};
	this.toggle_color_select = function(){
		if(POP.active == false){
			POP.add({title: 'Colour:', function: function(){
				COLOUR_copy = COLOUR;
				
				var html = '<canvas style="position:relative;margin-bottom:5px;" id="c_all" width="300" height="300"></canvas>';
				html += '<table>';
				html += '<tr>';
				html += '	<td><b>Lum:</b></td>';
				html += '	<td><input id="lum_ranger" oninput="TOOLS.change_lum(this.value);document.getElementById(\'lum_preview\').innerHTML=this.value;" type="range" value="0" min="-255" max="255" step="1"></td>';
				html += '	<td style="padding-left:10px;width:30px;" id="lum_preview">0</td>';
				html += '</tr>';
				html += '<tr>';
				html += '	<td><b>Alpha:</b></td>';
				html += '	<td><input oninput="TOOLS.change_alpha(this.value);document.getElementById(\'alpha_preview\').innerHTML=this.value;" type="range" value="'+ALPHA+'" min="0" max="255" step="1"></td>';
				html += '	<td style="padding-left:10px;" id="alpha_preview">'+ALPHA+'</td></tr>';
				html += '</tr>';
				html += '</table>';
				return html;
				}});
			POP.show('Select color', function(user_response){
				var param1 = parseInt(user_response.param1);
				}, undefined, this.toggle_color_select_onload);
			}
		else
			POP.hide();
		};
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
		};
	this.change_alpha = function(value){
		ALPHA = parseInt(value);
		document.getElementById("rgb_a").value = ALPHA;
		};
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
				document.getElementById("lum_ranger").value = 0;
				};
			};
		img.src = 'img/colorwheel.png';
		};
	//type = click, right_click, drag, move, release
	this.select_tool = function(type, mouse, event){
		if(mouse == undefined) return false;
		if(mouse.valid == false) return true;
		if(mouse.click_valid == false) return true;
		if(event != undefined && event.target.id == "canvas_preview") return true;
		if(type == 'drag'){
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
		};
	this.magic_wand = function(type, mouse, event){
		if(mouse.valid == false) return true;
		if(type == 'click'){
			MAIN.save_state();
			DRAW.tool_magic_wand(canvas_active(), WIDTH, HEIGHT, mouse.x, mouse.y, TOOLS.action_data().attributes.sensitivity, TOOLS.action_data().attributes.anti_aliasing);
			}
		};
	this.erase = function(type, mouse, event){				
		if(mouse.valid == false) return true;
		var strict = TOOLS.action_data().attributes.strict;
		var size = TOOLS.action_data().attributes.size;
		var is_circle = TOOLS.action_data().attributes.circle;
		
		if(type == 'click'){
			MAIN.save_state();
			if(is_circle == false){
				canvas_active().save();
				canvas_active().globalCompositeOperation = 'destination-out';
				canvas_active().fillStyle = "rgba(255, 255, 255, "+ALPHA/255+")";
				canvas_active().fillRect(mouse.x - Math.ceil(size/2)+1, mouse.y - Math.ceil(size/2)+1, size, size);
				canvas_active().restore();
				}
			else{
				
				if(strict == false){
					var radgrad = canvas_active().createRadialGradient(
						mouse.x, mouse.y, size/8,
						mouse.x, mouse.y, size/2);
					radgrad.addColorStop(0, "rgba(255, 255, 255, "+ALPHA/255+")");
					radgrad.addColorStop(1, "rgba(255, 255, 255, 0)");
					}
		
				//set Composite
				canvas_active().save();
				canvas_active().globalCompositeOperation = 'destination-out';
				if(strict == true)
					canvas_active().fillStyle = "rgba(255, 255, 255, "+ALPHA/255+")";
				else
					canvas_active().fillStyle = radgrad;
				canvas_active().beginPath();
				canvas_active().arc(mouse.x, mouse.y, size/2, 0,Math.PI*2,true);
				canvas_active().fill();
				canvas_active().restore();
				}
			}
		else if(type == 'drag'){
			if(is_circle == false){
				canvas_active().save();
				canvas_active().globalCompositeOperation = 'destination-out';
				if(ALPHA < 255)
					canvas_active().fillStyle = "rgba(255, 255, 255, "+ALPHA/255/10+")";
				else
					canvas_active().fillStyle = COLOUR;
				canvas_active().fillRect(mouse.x - Math.ceil(size/2)+1, mouse.y - Math.ceil(size/2)+1, size, size);
				canvas_active().restore();
				}
			else{
				if(strict == false){
					var radgrad = canvas_active().createRadialGradient(
						mouse.x, mouse.y, size/10,
						mouse.x, mouse.y, size/2);
					if(ALPHA < 255)
						radgrad.addColorStop(0, "rgba(255, 255, 255, "+ALPHA/255/10+")");
					else
						radgrad.addColorStop(0, "rgba(255, 255, 255, 1)");
					radgrad.addColorStop(1, "rgba(255, 255, 255, 0)");
					}
				//set Composite
				canvas_active().save();
				canvas_active().globalCompositeOperation = 'destination-out';
				if(strict == true){
					if(ALPHA < 255)
						canvas_active().fillStyle = "rgba(255, 255, 255, "+ALPHA/255/10+")";
					else
						canvas_active().fillStyle = COLOUR;
					}
				else
					canvas_active().fillStyle = radgrad;
				canvas_active().beginPath();
				canvas_active().arc(mouse.x, mouse.y, size/2, 0,Math.PI*2,true);
				canvas_active().fill();
				canvas_active().restore();
				}
			DRAW.zoom(undefined, false);
			}
		else if(type == 'move'){
			var size1 = Math.floor((size)/2);
			var size2 = Math.floor((size)/2);
			if(size%2 == 0) size2--;
			else{
				size1--;
				}
			
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.lineWidth = 1;
			if(is_circle == false){
				HELPER.dashedRect(canvas_front, mouse.x - Math.ceil(size/2) + 1, mouse.y - Math.ceil(size/2) + 1, mouse.x + Math.floor(size/2), mouse.y + Math.floor(size/2), 1, '#000000');
				}
			else{
				canvas_front.beginPath();
				canvas_front.strokeStyle = "#000000";
				canvas_front.arc(mouse.x, mouse.y, size/2, 0,Math.PI*2,true);
				canvas_front.stroke();
				}
			}
		};
	this.fill = function(type, mouse, event){
		if(mouse.valid == false) return true;
		if(type == 'click'){
			MAIN.save_state();
			var color_to = HELPER.hex2rgb(COLOUR);
			color_to.a = ALPHA;
			DRAW.toolFiller(canvas_active(), WIDTH, HEIGHT, mouse.x, mouse.y, color_to, TOOLS.action_data().attributes.sensitivity, TOOLS.action_data().attributes.anti_aliasing);
			}
		};
	this.pick_color = function(type, mouse, event){
		if(mouse.valid == false) return true;
		if(type == 'click'){
			var c = canvas_active().getImageData(mouse.x, mouse.y, 1, 1).data;
			COLOUR = "#" + ("000000" + HELPER.rgbToHex(c[0], c[1], c[2])).slice(-6);
			
			//set alpha
			ALPHA = c[3];
			document.getElementById("rgb_a").value = ALPHA;
			
			TOOLS.sync_colors();
			}
		};
	this.pencil = function(type, mouse, event){
		if(mouse.valid == false) return true;
		var color_rgb = HELPER.hex2rgb(COLOUR);
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
					var my_color = HELPER.hex2rgb(COLOUR);
					canvas_active().fillStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
					canvas_active().fillRect(x_tmp, y_tmp, 1, 1);
					}
				}
			}
		else if(type == 'release'){
			canvas_active().fillStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
			canvas_active().fillRect (mouse.x, mouse.y, 1, 1);
			}
		};
	this.line = function(type, mouse, event){
		if(mouse.click_valid == false) return false;
		var color_rgb = HELPER.hex2rgb(COLOUR);
		
		//horizontal/vertical only
		var xx = mouse.x;
		var yy = mouse.y;
		var from_x = mouse.click_x;
		var from_y = mouse.click_y;
		
		if(type == 'move'){
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
			canvas_front.lineWidth = TOOLS.action_data().attributes.size;
			
			if(TOOLS.action_data().attributes.type == 'Curve'){
				//curve
				if(curve_points.length == 2){
					canvas_front.beginPath();
					canvas_front.moveTo(curve_points[0][0] + 0.5, curve_points[0][1] + 0.5);
					canvas_front.quadraticCurveTo(mouse.x + 0.5, mouse.y + 0.5, curve_points[1][0], curve_points[1][1]);
					canvas_front.stroke();
					}
				}
			}
		else if(type == 'drag'){
			document.body.style.cursor = "crosshair";
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.beginPath();
			canvas_front.strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
			canvas_front.lineWidth = TOOLS.action_data().attributes.size;
			if(TOOLS.action_data().attributes.type == 'Multi-line' && TOOLS.last_line_x != undefined){
				from_x = TOOLS.last_line_x;
				from_y = TOOLS.last_line_y;
				}
			if(CON.ctrl_pressed == true){
				if(Math.abs(from_x - mouse.x) < Math.abs(from_y - mouse.y) )
					xx = from_x;
				else
					yy = from_y;
				}
			
			//arrow
			if(TOOLS.action_data().attributes.type == 'Arrow'){
				var headlen = TOOLS.action_data().attributes.size * 5;
				if(headlen < 15) headlen = 15;
				DRAW.draw_arrow(canvas_front, from_x + 0.5, from_y + 0.5, xx + 0.5, yy + 0.5, headlen);
				}
			//line
			else{
				canvas_front.moveTo(from_x + 0.5, from_y + 0.5);
				canvas_front.lineTo(xx + 0.5, yy + 0.5);
				canvas_front.stroke();
				}
			}
		else if(type == 'click'){
			MAIN.save_state();
			//curve
			if(TOOLS.action_data().attributes.type == 'Curve'){
				canvas_active().beginPath();
				canvas_active().strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
				canvas_active().lineWidth = TOOLS.action_data().attributes.size;
				if(CON.ctrl_pressed == true){
					if(Math.abs(from_x - mouse.x) < Math.abs(from_y - mouse.y) )
						xx = from_x;
					else
						yy = from_y;
					}
				if(curve_points.length == 2){
					canvas_active().beginPath();
					canvas_active().moveTo(curve_points[0][0] + 0.5, curve_points[0][1] + 0.5);
					canvas_active().quadraticCurveTo(xx + 0.5, yy + 0.5, curve_points[1][0], curve_points[1][1]);
					canvas_active().stroke();
					curve_points = [];
					}
				}	
			}
		else if(type == 'release'){
			MAIN.save_state();
			canvas_active().beginPath();
			canvas_active().strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
			canvas_active().lineWidth = TOOLS.action_data().attributes.size;
			if(TOOLS.action_data().attributes.type == 'Multi-line' && TOOLS.last_line_x != undefined){
				from_x = TOOLS.last_line_x;
				from_y = TOOLS.last_line_y;
				}
			if(CON.ctrl_pressed == true){
				if(Math.abs(from_x - mouse.x) < Math.abs(from_y - mouse.y) )
					xx = from_x;
				else
					yy = from_y;
				}
			//arrow
			if(TOOLS.action_data().attributes.type == 'Arrow'){
				var headlen = TOOLS.action_data().attributes.size * 5;
				if(headlen < 15) headlen = 15;
				DRAW.draw_arrow(canvas_active(), from_x + 0.5, from_y + 0.5, xx + 0.5, yy + 0.5, headlen);
				TOOLS.last_line_x = xx;
				TOOLS.last_line_y = yy;
				}
			//curve
			else if(TOOLS.action_data().attributes.type == 'Curve'){
				if(curve_points.length == 0 && (mouse.click_x != mouse.x || mouse.click_y != mouse.y)){
					curve_points.push([mouse.click_x, mouse.click_y]);
					curve_points.push([xx, yy]);
					}
				else if(curve_points.length == 2)
					curve_points = [];
				}
			//line
			else{
				canvas_active().moveTo(from_x + 0.5, from_y + 0.5);
				canvas_active().lineTo(xx + 0.5, yy + 0.5);
				canvas_active().stroke();
				TOOLS.last_line_x = xx;
				TOOLS.last_line_y = yy;
				}
			}
		};
	this.letters = function(type, mouse, event){
		if(mouse.valid == false) return true;
		var xx = mouse.x;
		var yy = mouse.y;
		if(type == 'click'){
			POP.add({name: "text",		title: "Text:",	value: "", type: 'textarea'	});
			POP.add({name: "size",		title: "Size:",	value: 20, range: [2, 1000], step: 2	});
			POP.add({name: "color",		title: "Color:",	value: "#000000", type: "color" 	});
			POP.add({name: "style",		title: "Font style:",	values: ["Normal", "Italic", "Bold", "Bold Italic"], type: 'select'	});
			POP.add({name: "family",	title: "Font family:",	values: ["Arial", "Courier", "Impact", "Helvetica", "monospace", "Times New Roman", "Verdana"],  type: 'select'	});
			POP.add({name: "size_3d",	title: "3D size:",	value: 0, range: [0, 200] 	});	
			POP.add({name: "pos_3d",	title: "3D position:",	values: ["Top-left", "Top-right", "Bottom-left", "Bottom-right"],  type: 'select' 	});
			POP.add({name: "shadow",	title: "Shadow:",	values: ["No", "Yes"] 	});
			POP.add({name: "shadow_blur",	title: "Shadow blur:",	value: 6, range: [1, 20] 	});
			POP.add({name: "shadow_color",	title: "Shadow color:",	value: "#000000", type: "color" 	});
			POP.add({name: "fill_style",	title: "Fill style:",	values: ["Fill", "Stroke", "Both"], type: 'select' 	});
			POP.add({name: "stroke_size",	title: "Stroke size:",	value: 1, range: [1, 100] 	});
			POP.preview_in_main = true;
			POP.show('Text', function(user_response){
					MAIN.save_state();
					text = user_response.text.split("\n");
					for(var i in text){
						user_response.text = text[i];
						var yyy = yy + i*(parseInt(user_response.size) + 2);
						TOOLS.letters_render(canvas_active(), xx, yyy, user_response);
						}
					canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
					},
				function(user_response){
					canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
					text = user_response.text.split("\n");
					for(var i in text){
						user_response.text = text[i];
						var yyy = yy + i*(parseInt(user_response.size) + 2);
						TOOLS.letters_render(canvas_front, xx, yyy, user_response);
						}
					});
			}
		};
	this.letters_render = function(canvas, xx, yy, user_response){
		var text = user_response.text;
		var size = parseInt(user_response.size);
		var color = user_response.color;
		var dpth = parseInt(user_response.size_3d);
		var pos_3d = user_response.pos_3d;
		var shadow = user_response.shadow;
		var shadow_blur = parseInt(user_response.shadow_blur);
		var shadow_color = user_response.shadow_color;
		var font = user_response.family;
		var font_style = user_response.style;
		var fill_style = user_response.fill_style;
		var stroke_size = user_response.stroke_size;
		var dx;
		var dy;
		if(pos_3d == "Top-left"){
			dx = -1;
			dy = -1;
			}
		else if(pos_3d == "Top-right"){
			dx = 1;
			dy = -1;
			}
		else if(pos_3d == "Bottom-left"){
			dx = -1;
			dy = 1;
			}
		else if(pos_3d == "Bottom-right"){
			dx = 1;
			dy = 1;
			}
		
		var color_rgb = HELPER.hex2rgb(color);
		canvas.fillStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
		canvas.font = font_style+" "+size+"px "+font;
		var letters_height = HELPER.font_pixel_to_height(size);
	
		//shadow
		if(shadow == 'Yes'){
			canvas.save();
			canvas.shadowColor = shadow_color;
			canvas.shadowBlur = shadow_blur;
			canvas.shadowOffsetX = dx;
			canvas.shadowOffsetY = dy;
			canvas.fillText(text, xx + dx * (dpth-1), yy + letters_height + dy * (dpth-1));
			canvas.restore();
			}
		
		//3d
		if(dpth > 0){
			canvas.fillStyle = HELPER.darkenColor(COLOUR, -30);
			alpha_tmp = ALPHA;
			if(alpha_tmp < 255)
				alpha_tmp /= 10; 
				
			color_rgb.r -= 50;
			color_rgb.g -= 50;
			color_rgb.b -= 50;
			if(color_rgb.r < 0) color_rgb.r *= -1;
			if(color_rgb.g < 0) color_rgb.g *= -1;
			if(color_rgb.b < 0) color_rgb.b *= -1;
				
			canvas.fillStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+alpha_tmp/255+")";
			for (cnt = 0; cnt < dpth; cnt++)
				canvas.fillText(text, xx + dx * cnt, yy + letters_height + dy * cnt);
			color_rgb = HELPER.hex2rgb(COLOUR);
			}
	
		//main text
		canvas.fillStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
		canvas.strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
		canvas.lineWidth = stroke_size;
		if(fill_style == 'Fill' || fill_style == 'Both')
			canvas.fillText(text, xx, yy + letters_height);
		if(fill_style == 'Stroke' || fill_style == 'Both')
			canvas.strokeText(text, xx, yy + letters_height);
		
		DRAW.zoom();
		};
	this.draw_square = function(type, mouse, event){
		if(mouse.click_valid == false) return true;
		var color_rgb = HELPER.hex2rgb(COLOUR);
		if(type == 'drag'){
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
			
			canvas_front.fillStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
			canvas_front.strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
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
				
			canvas_active().fillStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
			canvas_active().strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
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
		};
	this.draw_circle = function(type, mouse, event){
		if(mouse.click_valid == false) return true;
		var color_rgb = HELPER.hex2rgb(COLOUR);
		if(type == 'drag'){
			dist_x = mouse.x - mouse.click_x;
			dist_y = mouse.y - mouse.click_y;
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			if(TOOLS.action_data().attributes.circle==true)
				dist_x = dist_y = Math.min(dist_x, dist_y);
			if(TOOLS.action_data().attributes.fill==true)
				HELPER.drawEllipseByCenter(canvas_front, mouse.click_x, mouse.click_y, dist_x*2, dist_y*2, "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")", true);
			else
				HELPER.drawEllipseByCenter(canvas_front, mouse.click_x, mouse.click_y, dist_x*2, dist_y*2, "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")");
			}
		else if(type == 'release'){
			MAIN.save_state();
			dist_x = mouse.x - mouse.click_x;
			dist_y = mouse.y - mouse.click_y;
			if(TOOLS.action_data().attributes.circle==true)
				dist_x = dist_y = Math.min(dist_x, dist_y);
			canvas_active().lineWidth = 1;
			if(TOOLS.action_data().attributes.fill==true)
				HELPER.drawEllipseByCenter(canvas_active(), mouse.click_x, mouse.click_y, dist_x*2, dist_y*2, "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")", true);
			else
				HELPER.drawEllipseByCenter(canvas_active(), mouse.click_x, mouse.click_y, dist_x*2, dist_y*2, "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")");
			}
		};
	this.update_brush = function(){
		document.getElementById('anti_alias').style.display='';
		if(TOOLS.action_data().attributes.type != 'Brush')
			document.getElementById('anti_alias').style.display='none';
		};
	this.desaturate_tool = function(type, mouse, event){
		if(mouse.valid == false) return true;
		var size = TOOLS.action_data().attributes.size;
		var size_half = Math.round(size/2);
		var xx = mouse.x - size/2;
		var yy = mouse.y - size/2;
		if(xx < 0) xx = 0;
		if(yy < 0) yy = 0;
		
		if(type == 'click'){
			MAIN.save_state();
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.GrayScale(imageData);	//add effect
			HELPER.drawImage_round(canvas_active(), mouse.x, mouse.y, size, filtered, document.getElementById("canvas_front"), TOOLS.action_data().attributes.anti_alias);
			}
		else if(type == 'drag'){
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.GrayScale(imageData);	//add effect
			HELPER.drawImage_round(canvas_active(), mouse.x, mouse.y, size, filtered, document.getElementById("canvas_front"), TOOLS.action_data().attributes.anti_alias);
			}
		if(type == 'move' || type == 'drag'){
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.beginPath();
			canvas_front.strokeStyle = "#000000";
			canvas_front.lineWidth = 1;
			canvas_front.arc(mouse.x, mouse.y, size_half, 0, Math.PI*2, true);
			canvas_front.stroke();
			}
		};
	this.brush = function(type, mouse, event){
		if(mouse.valid == false) return true;
		var brush_type = TOOLS.action_data().attributes.type;
		var color_rgb = HELPER.hex2rgb(COLOUR);
		
		if(type == 'click')
			MAIN.save_state();
		
		if(brush_type == 'Brush'){		
			if(type == 'click'){
				//init settings
				canvas_active().beginPath();
				canvas_active().strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
				canvas_active().lineWidth = TOOLS.action_data().attributes.size;
				canvas_active().lineCap = 'round';
				canvas_active().lineJoin = 'round';
				
				if(ALPHA < 255){
					canvas_front.beginPath();
					canvas_front.strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
					canvas_front.lineWidth = TOOLS.action_data().attributes.size;
					canvas_front.lineCap = 'round';
					canvas_front.lineJoin = 'round';
					}
				
				//blur
				canvas_active().shadowBlur = 0;
				if(TOOLS.action_data().attributes.anti_alias == true){	
					canvas_active().shadowColor = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
					canvas_active().shadowBlur = Math.round(TOOLS.action_data().attributes.size);
					}
				}
			else if(type == 'drag' && mouse.last_x != false && mouse.last_y != false){
				if(ALPHA == 255)
					canvas_active().beginPath();
				canvas_active().moveTo(mouse.last_x, mouse.last_y);
				canvas_active().lineTo(mouse.x, mouse.y);
				if(ALPHA == 255)
					canvas_active().stroke();
				
				//now draw preview
				if(ALPHA < 255){
					canvas_front.beginPath();
					//clean from last line
					canvas_front.globalCompositeOperation = "destination-out";
					canvas_front.strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", 1)";
					canvas_front.moveTo(mouse.last_x, mouse.last_y);
					canvas_front.lineTo(mouse.x, mouse.y);
					canvas_front.stroke();
					//reset
					canvas_front.strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
					canvas_front.globalCompositeOperation = "source-over";
					//draw new line segment
					canvas_front.moveTo(mouse.last_x, mouse.last_y);
					canvas_front.lineTo(mouse.x, mouse.y);
					canvas_front.stroke();
					}
				}
			else if(type == 'release'){
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				//paint everything
				canvas_active().stroke();
				
				//if mouse was not moved
				if(mouse.click_x == mouse.x && mouse.click_y == mouse.y){
					canvas_active().beginPath();
					canvas_active().arc(mouse.x, mouse.y, TOOLS.action_data().attributes.size/2, 0, 2 * Math.PI, false);
					canvas_active().fillStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
					canvas_active().fill();
					}
				canvas_active().shadowBlur = 0;
				}
			else if(type == 'move'){
				//show size
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				canvas_front.beginPath();
				canvas_front.strokeStyle = "#000000";
				canvas_front.lineWidth = 1;
				canvas_front.arc(mouse.x, mouse.y, TOOLS.action_data().attributes.size/2, 0, Math.PI*2, true);
				canvas_front.stroke();
				}
			}
		else if(brush_type == 'BezierCurve'){
			if(type == 'click')
				BezierCurveBrush.startCurve(mouse.x, mouse.y);
			else if(type == 'drag' && mouse.last_x != false && mouse.last_y != false){
				var color_rgb = HELPER.hex2rgb(COLOUR);
				canvas_active().strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
				canvas_active().lineWidth = 0.5;
				
				BezierCurveBrush.draw(canvas_active(), color_rgb, mouse.x, mouse.y, TOOLS.action_data().attributes.size);
				}
			}
		else if(brush_type == 'Chrome'){
			if(type == 'click'){
				chrome_brush.init(canvas_active());
				chrome_brush.strokeStart(mouse.x, mouse.y);
				}
			else if(type == 'drag' && mouse.last_x != false && mouse.last_y != false){
				var color_rgb = HELPER.hex2rgb(COLOUR);
				canvas_active().strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
				canvas_active().lineWidth = 1;
				
				chrome_brush.stroke(color_rgb, mouse.x, mouse.y, TOOLS.action_data().attributes.size);
				}
			}
		else if(brush_type == 'Fur'){
			if(type == 'click'){
				points = new Array();
			        prevMouseX = mouse.x;
			        prevMouseY = mouse.y;
			        count = 0;
				}
			else if(type == 'drag' && mouse.last_x != false && mouse.last_y != false){
				var color_rgb = HELPER.hex2rgb(COLOUR);
				canvas_active().strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", 0.1)";
				canvas_active().lineWidth = 1;
				
				f = mouse.x;
				c = mouse.y;
				var e, b, a, g;
				points.push([f, c]);
				canvas_active().beginPath();
				canvas_active().moveTo(prevMouseX, prevMouseY);
				canvas_active().lineTo(f, c);
				canvas_active().stroke();
				for (e = 0; e < points.length; e++) {
					b = points[e][0] - points[count][0];
					a = points[e][1] - points[count][1];
					g = b * b + a * a;
					var g_size = Math.round(400 * TOOLS.action_data().attributes.size);
					if (g < g_size && Math.random() > g / g_size) {
						canvas_active().beginPath();
						canvas_active().moveTo(f + (b * 0.5), c + (a * 0.5));
						canvas_active().lineTo(f - (b * 0.5), c - (a * 0.5));
						canvas_active().stroke();
						}
					}
				prevMouseX = f;
				prevMouseY = c;
				count++;
				}
			}
		else if(brush_type == 'Grouped'){
			groups_n = TOOLS.action_data().attributes.size;
			gsize = 10;
			random_power = 5;
			
			if(type == 'click'){
				chrome_brush.init(canvas_active());
				chrome_brush.strokeStart(mouse.x, mouse.y);
				groups = [];
				
				for(var g=0; g < groups_n; g++){
					groups[g] = {};
					groups[g].x = HELPER.getRandomInt(-gsize, gsize); 
					groups[g].y = HELPER.getRandomInt(-gsize, gsize);
					}
				}
			else if(type == 'drag' && mouse.last_x != false && mouse.last_y != false){
				canvas_active().strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
				canvas_active().lineWidth = 0.5;
				
				for(var g in groups){
					canvas_active().beginPath();
					canvas_active().moveTo(mouse.last_x + groups[g].x, mouse.last_y + groups[g].y);
					
					//randomize here
					groups[g].x += HELPER.getRandomInt(-random_power, random_power); 
					groups[g].y += HELPER.getRandomInt(-random_power, random_power); 
					if(groups[g].x < -gsize) groups[g].x = -gsize + random_power;
					if(groups[g].y < -gsize) groups[g].y = -gsize + random_power;
					if(groups[g].x > gsize) groups[g].x = gsize - random_power;
					if(groups[g].y > gsize) groups[g].y = gsize - random_power;
					
					canvas_active().lineTo(mouse.x + groups[g].x, mouse.y + groups[g].y);
					canvas_active().stroke();
					}
				}
			}
		else if(brush_type == 'Shaded'){
			if(type == 'click'){
				shaded_brush.init(canvas_active());
				shaded_brush.strokeStart(mouse.x, mouse.y);
				}
			else if(type == 'drag' && mouse.last_x != false && mouse.last_y != false){
				var color_rgb = HELPER.hex2rgb(COLOUR);
				canvas_active().strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
				canvas_active().lineWidth = 1;
				
				shaded_brush.stroke(color_rgb, mouse.x, mouse.y, TOOLS.action_data().attributes.size);
				}
			}
		else if(brush_type == 'Sketchy'){
			if(type == 'click'){
				sketchy_brush.init(canvas_active());
				sketchy_brush.strokeStart(mouse.x, mouse.y);
				}
			else if(type == 'drag' && mouse.last_x != false && mouse.last_y != false){
				var color_rgb = HELPER.hex2rgb(COLOUR);
				canvas_active().strokeStyle = "rgba("+color_rgb.r+", "+color_rgb.g+", "+color_rgb.b+", "+ALPHA/255+")";
				canvas_active().lineWidth = 1;
				
				sketchy_brush.stroke(color_rgb, mouse.x, mouse.y, TOOLS.action_data().attributes.size);
				}
			}
		};
	this.gradient_tool = function(type, mouse, event){
		if(mouse != undefined && mouse.valid == false && type != 'init') return true;
		var power = TOOLS.action_data().attributes.power;
		if(power > 99) power = 99;
		//var color1, color2;
		
		if(type == 'init'){
			POP.add({name: "param1",	title: "Color #1:",		value: '#000000', type: 'color'	});
			POP.add({name: "param2",	title: "Transparency #1:",	value: '255',	range:[0, 255]	});	
			POP.add({name: "param3",	title: "Color #2:",		value: '#ffffff',  type: 'color'	});
			POP.add({name: "param4",	title: "Transparency #2:",	value: '255',	range:[0, 255]	});
			POP.preview_in_main = true;
			POP.show('Text', function(user_response){
					MAIN.save_state();
					color1 = HELPER.hex2rgb(user_response.param1);
					color1.a = parseInt(user_response.param2);
					
					color2 = HELPER.hex2rgb(user_response.param3);
					color2.a = parseInt(user_response.param4);
					});
			}
		else if(type == 'drag'){
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);

			if(TOOLS.action_data().attributes.radial == false){
				//linear
				canvas_front.rect(0, 0, WIDTH, HEIGHT);
				if(mouse.x > mouse.click_x){
					var grd = canvas_front.createLinearGradient(
						mouse.click_x, mouse.click_y, 
						mouse.x, mouse.y);
					}
				else{
					var grd = canvas_front.createLinearGradient(
						mouse.x, mouse.y, 
						mouse.click_x, mouse.click_y);
					}
				grd.addColorStop(0, "rgba("+color1.r+", "+color1.g+", "+color1.b+", "+color1.a/255+")");
				grd.addColorStop(1, "rgba("+color2.r+", "+color2.g+", "+color2.b+", "+color2.a/255+")");
				canvas_front.fillStyle = grd;
				canvas_front.fill();
				}
			else{
				//radial
				var dist_x = mouse.click_x - mouse.x;
				var dist_y = mouse.click_y - mouse.y;
				var distance = Math.sqrt((dist_x*dist_x)+(dist_y*dist_y));
				var radgrad = canvas_front.createRadialGradient(
					mouse.click_x, mouse.click_y, distance*power/100,
					mouse.click_x, mouse.click_y, distance);
				radgrad.addColorStop(0, "rgba("+color1.r+", "+color1.g+", "+color1.b+", "+color1.a/255+")");
				radgrad.addColorStop(1, "rgba("+color2.r+", "+color2.g+", "+color2.b+", "+color2.a/255+")");
				
				canvas_front.fillStyle = radgrad;
				canvas_front.fillRect(0,0,WIDTH,HEIGHT);
				}
			//draw line
			canvas_front.beginPath();
			canvas_front.strokeStyle = "#ff0000";
			canvas_front.lineWidth = 1;
			var xx = mouse.x;
			var yy = mouse.y;
			canvas_front.moveTo(mouse.click_x + 0.5, mouse.click_y + 0.5);
			canvas_front.lineTo(xx + 0.5, yy + 0.5);
			canvas_front.stroke();
			}	
		else if(type == 'release'){
			MAIN.save_state();
			if(TOOLS.action_data().attributes.radial == false){
				//linear
				canvas_active().rect(0, 0, WIDTH, HEIGHT);
				if(mouse.x > mouse.click_x){
					var grd = canvas_active().createLinearGradient(
						mouse.click_x, mouse.click_y, 
						mouse.x, mouse.y);
					}
				else{
					var grd = canvas_active().createLinearGradient(
						mouse.x, mouse.y, 
						mouse.click_x, mouse.click_y);
					}
				grd.addColorStop(0, "rgba("+color1.r+", "+color1.g+", "+color1.b+", "+color1.a/255+")");
				grd.addColorStop(1, "rgba("+color2.r+", "+color2.g+", "+color2.b+", "+color2.a/255+")");
				canvas_active().fillStyle = grd;
				canvas_active().fill();
				}
			else{
				//radial
				var dist_x = mouse.click_x - mouse.x;
				var dist_y = mouse.click_y - mouse.y;
				var distance = Math.sqrt((dist_x*dist_x)+(dist_y*dist_y));
				var radgrad = canvas_active().createRadialGradient(
					mouse.click_x, mouse.click_y, distance*power/100,
					mouse.click_x, mouse.click_y, distance);
				radgrad.addColorStop(0, "rgba("+color1.r+", "+color1.g+", "+color1.b+", "+color1.a/255+")");
				radgrad.addColorStop(1, "rgba("+color2.r+", "+color2.g+", "+color2.b+", "+color2.a/255+")");
				
				canvas_active().fillStyle = radgrad;
				canvas_active().fillRect(0,0,WIDTH,HEIGHT);
				}
			}
		};
	this.blur_tool = function(type, mouse, event){
		if(mouse.valid == false) return true;
		var size = TOOLS.action_data().attributes.size;
		var size_half = Math.round(size/2);
		var xx = mouse.x - size/2;
		var yy = mouse.y - size/2;
		if(xx < 0) xx = 0;
		if(yy < 0) yy = 0;
		if(type == 'click'){
			MAIN.save_state();
			var param1 = TOOLS.action_data().attributes.strength;
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.StackBlur(imageData, param1);	//add effect
			HELPER.drawImage_round(canvas_active(), mouse.x, mouse.y, size, filtered, document.getElementById("canvas_front"));
			}
		else if(type == 'drag'){
			var param1 = TOOLS.action_data().attributes.strength;
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.StackBlur(imageData, param1);	//add effect
			HELPER.drawImage_round(canvas_active(), mouse.x, mouse.y, size, filtered, document.getElementById("canvas_front"));
			}
		else if(type == 'move'){
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.beginPath();
			canvas_front.strokeStyle = "#000000";
			canvas_front.lineWidth = 1;
			canvas_front.arc(mouse.x, mouse.y, size_half, 0, Math.PI*2, true);
			canvas_front.stroke();
			}
		};
	this.sharpen_tool = function(type, mouse, event){
		if(mouse.valid == false) return true;
		var size = TOOLS.action_data().attributes.size;
		var size_half = Math.round(size/2);
		var xx = mouse.x - size/2;
		var yy = mouse.y - size/2;
		if(xx < 0) xx = 0;
		if(yy < 0) yy = 0;
		
		if(type == 'click'){
			MAIN.save_state();
			var param1 = TOOLS.action_data().attributes.strength;
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.Sharpen(imageData, param1);	//add effect
			HELPER.drawImage_round(canvas_active(), mouse.x, mouse.y, size, filtered, document.getElementById("canvas_front"));
			}
		else if(type == 'drag'){
			var param1 = TOOLS.action_data().attributes.strength;
			var imageData = canvas_active().getImageData(xx, yy, size, size);
			var filtered = ImageFilters.Sharpen(imageData, param1);	//add effect
			HELPER.drawImage_round(canvas_active(), mouse.x, mouse.y, size, filtered, document.getElementById("canvas_front"));
			}
		else if(type == 'move'){
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.beginPath();
			canvas_front.strokeStyle = "#000000";
			canvas_front.lineWidth = 1;
			canvas_front.arc(mouse.x, mouse.y, size_half, 0, Math.PI*2, true);
			canvas_front.stroke();
			}
		};
	this.burn_dodge_tool = function(type, mouse, event){
		if(mouse.valid == false) return true;
		var size = TOOLS.action_data().attributes.size;
		var power = TOOLS.action_data().attributes.power*2.5;
		
		if(type == 'click'){
			MAIN.save_state();
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.save();
			CON.clear_front_on_release = false;
			
			//init settings
			canvas_active().beginPath();
			canvas_active().lineWidth = TOOLS.action_data().attributes.size;
			canvas_active().lineCap = 'round';
			canvas_active().lineJoin = 'round';

			canvas_front.beginPath();
			if(TOOLS.action_data().attributes.burn == true)
				canvas_front.strokeStyle = "rgba(0, 0, 0, "+power/255+")";
			else
				canvas_front.strokeStyle = "rgba(255, 255, 255, "+power/255+")";
			canvas_front.lineWidth = TOOLS.action_data().attributes.size;
			canvas_front.lineCap = 'round';
			canvas_front.lineJoin = 'round';
			}
		else if(type == 'drag' && mouse.last_x != false && mouse.last_y != false){
			//now draw preview
			canvas_front.beginPath();
			//clean from last line
			canvas_front.globalCompositeOperation = "destination-out";
			canvas_front.moveTo(mouse.last_x, mouse.last_y);
			canvas_front.lineTo(mouse.x, mouse.y);
			canvas_front.stroke();
			//reset
			canvas_front.globalCompositeOperation = "source-over";
			//draw new line segment
			canvas_front.moveTo(mouse.last_x, mouse.last_y);
			canvas_front.lineTo(mouse.x, mouse.y);
			canvas_front.stroke();
			}
		else if(type == 'release'){
			//todo: use screen+multiply or burn+dodge
			canvas_active().globalCompositeOperation = "soft-light";
			canvas_active().shadowBlur = 5;
			canvas_active().drawImage(document.getElementById("canvas_front"), 0, 0);
			canvas_active().globalCompositeOperation = "source-over";
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			CON.clear_front_on_release = true;

			//if mouse was not moved
			if(mouse.click_x == mouse.x && mouse.click_y == mouse.y){
				canvas_active().globalCompositeOperation = "soft-light";
				canvas_active().beginPath();
				canvas_active().arc(mouse.x, mouse.y, TOOLS.action_data().attributes.size/2, 0, 2 * Math.PI, false);
				if(TOOLS.action_data().attributes.burn == true){
					canvas_active().fillStyle = "rgba(0, 0, 0, "+power/255+")";
					}
				else{
					canvas_active().fillStyle = "rgba(255, 255, 255, "+power/255+")";
					}
				canvas_active().shadowBlur = 5;
				canvas_active().fill();
				canvas_active().globalCompositeOperation = "source-over";
				}
			canvas_active().shadowBlur = 0;
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.restore();
			}
		else if(type == 'move' && CON.isDrag == false){
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.beginPath();
			canvas_front.strokeStyle = "#000000";
			canvas_front.arc(mouse.x, mouse.y, size/2, 0, Math.PI*2, true);
			canvas_front.stroke();
			}
		};
	this.crop_tool = function(type, mouse, event){
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
				canvas_front.fillStyle = "rgba(0, 255, 0, 0.3)";
				canvas_front.fillRect(mouse.click_x, mouse.click_y, mouse.x - mouse.click_x, mouse.y - mouse.click_y);
				}
			}
		else if(type == 'move' && TOOLS.select_data != false){
			if(CON.isDrag == true) return true;
			canvas_front.lineWidth = 1;
			border_size = 5;
			TOOLS.select_square_action = '';
			
			if(TOOLS.select_square_action == '' 
			  && mouse.x > TOOLS.select_data.x && mouse.y > TOOLS.select_data.y
			  && mouse.x < TOOLS.select_data.x + TOOLS.select_data.w && mouse.y < TOOLS.select_data.y + TOOLS.select_data.h){
				TOOLS.select_square_action = 'move';
			  	document.body.style.cursor = 'pointer';
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
			TOOLS.draw_selected_area(true);
			
			LAYER.update_info_block();
			}
		else if(type == 'click' && TOOLS.select_data != false){
			document.body.style.cursor = "auto";
			if(mouse.x > TOOLS.select_data.x && mouse.y > TOOLS.select_data.y
			  && mouse.x < TOOLS.select_data.x + TOOLS.select_data.w && mouse.y < TOOLS.select_data.y + TOOLS.select_data.h){
				MAIN.save_state();
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

				TOOLS.select_data = false;
				canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
				}
			}
		};
	this.clone_tool = function(type, mouse, event){
		if(mouse.valid == false) return true;
		var size = TOOLS.action_data().attributes.size;
		var size_half = Math.round(size/2);
		
		if(type == 'click'){
			MAIN.save_state();
	
			if(clone_data === false){
				POP.add({html: 'Source is empty, right click on image first.'	});
				POP.show('Error', '');
				}
			else{
				//draw rounded image
				HELPER.drawImage_round(canvas_active(), mouse.x, mouse.y, size, clone_data, document.getElementById("canvas_front"), TOOLS.action_data().attributes.anti_alias);
				}
			}
		else if(type == 'right_click'){
			//save clone source
			clone_data = document.createElement("canvas");
			clone_data.width = size;
			clone_data.height = size;
			var xx = mouse.x - size_half;
			var yy = mouse_y - size_half;
			if(xx < 0) xx = 0;
			if(yy < 0) yy = 0;
			clone_data.getContext("2d").drawImage(canvas_active(true), xx, yy, size, size, 0, 0, size, size);
			return false;
			}
		else if(type == 'drag'){
			if(event.which == 3) return true;
			if(clone_data === false) return false;	//no source
			
			//draw rounded image
			HELPER.drawImage_round(canvas_active(), mouse.x, mouse.y, size, clone_data, document.getElementById("canvas_front"), TOOLS.action_data().attributes.anti_alias);
			}
		else if(type == 'move'){
			//show size
			canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
			canvas_front.beginPath();
			canvas_front.strokeStyle = "#000000";
			canvas_front.lineWidth = 1;
			canvas_front.arc(mouse.x, mouse.y, size_half, 0, Math.PI*2, true);
			canvas_front.stroke();
			}
		};
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
				canvas_front.fillStyle = "rgba(0, 255, 0, 0.3)";
				canvas_front.fillRect(mouse.click_x, mouse.click_y, mouse.x - mouse.click_x, mouse.y - mouse.click_y);
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
			if(CON.isDrag == true) return true;
			canvas_front.lineWidth = 1;
			border_size = 5;
			TOOLS.select_square_action = '';
			var is_left = false;
			var is_right = false;
			var is_top = false;
			var is_bottom = false;
			var sr_size = Math.ceil(CON.sr_size/ZOOM*100);
			
			//left
			if(TOOLS.check_mouse_pos(TOOLS.select_data.x, TOOLS.select_data.y + TOOLS.select_data.h/2, sr_size, mouse.x, mouse.y)==true){
				document.body.style.cursor = "w-resize";
				TOOLS.select_square_action = 'resize-left';
				is_left = true;
				}
			//top
			else if(TOOLS.check_mouse_pos(TOOLS.select_data.x + TOOLS.select_data.w/2, TOOLS.select_data.y, sr_size, mouse.x, mouse.y)==true){
				document.body.style.cursor = "n-resize";
				TOOLS.select_square_action = 'resize-top';
				is_top = true;
				}
			//right
			else if(TOOLS.check_mouse_pos(TOOLS.select_data.x + TOOLS.select_data.w - sr_size, TOOLS.select_data.y + TOOLS.select_data.h/2, sr_size, mouse.x, mouse.y)==true){
				document.body.style.cursor = "w-resize";
				TOOLS.select_square_action = 'resize-right';
				is_right = true;
				}
			//bottom
			else if(TOOLS.check_mouse_pos(TOOLS.select_data.x + TOOLS.select_data.w/2, TOOLS.select_data.y + TOOLS.select_data.h - sr_size, sr_size, mouse.x, mouse.y)==true){
				document.body.style.cursor = "n-resize";
				TOOLS.select_square_action = 'resize-bottom';
				is_bottom = true;
				}
			
			//corner 1
			if(TOOLS.check_mouse_pos(TOOLS.select_data.x, TOOLS.select_data.y, sr_size, mouse.x, mouse.y)==true){
				document.body.style.cursor = "nw-resize";
				TOOLS.select_square_action = 'resize-1';
				}
			//corner 2
			else if(TOOLS.check_mouse_pos(TOOLS.select_data.x + TOOLS.select_data.w - sr_size, TOOLS.select_data.y, sr_size, mouse.x, mouse.y)==true){
				document.body.style.cursor = "ne-resize";
				TOOLS.select_square_action = 'resize-2';
				}
			//corner 3
			else if(TOOLS.check_mouse_pos(TOOLS.select_data.x + TOOLS.select_data.w - sr_size, TOOLS.select_data.y + TOOLS.select_data.h - sr_size, sr_size, mouse.x, mouse.y)==true){
				document.body.style.cursor = "nw-resize";
				TOOLS.select_square_action = 'resize-3';
				}
			//corner 4
			else if(TOOLS.check_mouse_pos(TOOLS.select_data.x, TOOLS.select_data.y + TOOLS.select_data.h - sr_size, sr_size, mouse.x, mouse.y)==true){
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
					if(TOOLS.select_data != false){
						select_data_tmp = canvas_active().getImageData(TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h);
						canvas_active().clearRect(TOOLS.select_data.x, TOOLS.select_data.y, TOOLS.select_data.w, TOOLS.select_data.h);
						canvas_active().putImageData(select_data_tmp, mouse.x - mouse.click_x + TOOLS.select_data.x, mouse.y - mouse.click_y + TOOLS.select_data.y);
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
		};
	this.check_mouse_pos = function(x, y, size, mouse_x, mouse_y){
		if(mouse_x > x-round(size) && mouse_x < x+round(size))
			if(mouse_y > y-round(size) && mouse_y < y+round(size))
			return true;
		return false;
		};
	this.draw_selected_area = function(no_resize){		
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
		
		//fill
		canvas_front.fillStyle = "rgba(0, 255, 0, 0.3)";
		canvas_front.fillRect(x, y, w, h);
		if(ZOOM <= 100){
			//borders
			canvas_front.strokeStyle = "rgba(0, 255, 0, 1)";
			canvas_front.lineWidth = 1;
			canvas_front.strokeRect(x+0.5, y+0.5, w, h);
			}
		if(no_resize == true) return true;
	
		//draw carners
		square(x, y, 0, 0);
		square(x+w, y, -1, 0);
		square(x, y+h, 0, -1);
		square(x+w, y+h, -1, -1);
		
		//draw centers
		square(x+w/2, y, 0, 0);
		square(x, y+h/2, 0, 0);
		square(x+w/2, y+h, 0, -1);
		square(x+w, y+h/2, -1, 0);
		
		function square(x, y, mx, my){
			var sr_size = Math.ceil(CON.sr_size/ZOOM*100);
			x = round(x);
			y = round(y);
			canvas_front.beginPath();
			canvas_front.rect(x + mx * round(sr_size), y + my * round(sr_size), sr_size, sr_size);
			canvas_front.fillStyle = "#0000ff";
			canvas_front.fill();
			}
		};
	this.save_EXIF = function(){
		TOOLS.EXIF = this.exifdata;
		//check length
		var n = 0;
		for(var i in TOOLS.EXIF)
			n++;
		if(n == 0)
			TOOLS.EXIF = false;
		};
	this.histogram = function(){
		POP.add({name: "param1",	title: "Channel:",	values: ["Gray", "Red", "Green", "Blue"], onchange: "TOOLS.histogram_onload()" });
		POP.add({title: 'Histogram:', function: function(){
			var html = '<canvas style="position:relative;" id="c_h" width="256" height="100"></canvas>';
			return html;
			}});
		POP.add({title: "Total pixels:",	value: "" });
		POP.add({title: "Average:",	value: "" });
		POP.show('Histogram', function(user_response){
			var param1 = parseInt(user_response.param1);
			}, undefined, this.histogram_onload);
		};
	this.histogram_onload = function(user_response){
		var img = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
		var imgData = img.data;
		var channel_grey = document.getElementById("pop_data_param1_poptmp0");
		var channel_r = document.getElementById("pop_data_param1_poptmp1");
		var channel_g = document.getElementById("pop_data_param1_poptmp2");
		var channel_b = document.getElementById("pop_data_param1_poptmp3");
		
		if(channel_grey.checked == true)	channel = channel_grey.value;
		else if(channel_r.checked == true)	channel = channel_r.value;
		else if(channel_g.checked == true)	channel = channel_g.value;
		else if(channel_b.checked == true)	channel = channel_b.value;
		
		//collect data
		var hist_data = [];
		for(var i=0; i<= 255; i++)
			hist_data[i] = 0;
		var total = imgData.length/4;
		var sum = 0;
		var grey;
		
		if(channel == 'Gray'){
			for(var i = 0; i < imgData.length; i += 4){
				grey = round((imgData[i] + imgData[i+1] + imgData[i+2]) / 3);
				hist_data[grey]++;
				sum = sum + imgData[i] + imgData[i+1] + imgData[i+2];
				}
			}
		else if(channel == 'Red'){
			for(var i = 0; i < imgData.length; i += 4){
				hist_data[imgData[i]]++;
				sum = sum + imgData[i] * 3;
				}
			}
		else if(channel == 'Green'){
			for(var i = 0; i < imgData.length; i += 4){
				hist_data[imgData[i+1]]++;
				sum = sum + imgData[i+1] * 3;
				}
			}
		else if(channel == 'Blue'){
			for(var i = 0; i < imgData.length; i += 4){
				hist_data[imgData[i+2]]++;
				sum = sum + imgData[i+2] * 3;
				}
			}
		
		//draw histogram
		var c = document.getElementById("c_h").getContext("2d");
		c.rect(0, 0, 255, 100);
		c.fillStyle = "#ffffff";
		c.fill();
		for(var i = 0; i <= 255; i++){
			if(hist_data[i] == 0) continue;
			c.beginPath();
			c.strokeStyle = "#000000";
			c.lineWidth = 1;
			c.moveTo(i + 0.5, 100 + 0.5);
			c.lineTo(i + 0.5, 100 - round(hist_data[i]*255*100/total/6) + 0.5);
			c.stroke();
			}
		
		document.getElementById("pop_data_totalpixel").value = HELPER.number_format(total, 0);
		if(total > 0)
			average = round(sum * 10 / total / 3) / 10;
		else
			average = '-';
		document.getElementById("pop_data_average").value = average;	
		};
	this.generate_sprites = function(gap){
		if(LAYERS.length == 1) return false;
		MAIN.save_state();
		LAYER.layer_add();
		var xx = 0;
		var yy = 0;
		var max_height = 0;
		var tmp = document.createElement("canvas");
		tmp.setAttribute('id', "tmp_canvas");
		tmp.width = WIDTH;
		tmp.height = HEIGHT;
		var W = WIDTH;
		var H = HEIGHT;
		for(i in LAYERS){
			if(i == LAYER.layer_active) continue;	//end
			if(LAYERS[i].visible == false) continue;
			
			tmp.getContext("2d").clearRect(0, 0, W, H);
			tmp.getContext("2d").drawImage(document.getElementById(LAYERS[i].name), 0, 0);
			
			var trim_details = DRAW.trim_info(tmp, false); //trim
			if(WIDTH == trim_details.left) continue; //empty layer
			var width = W - trim_details.left - trim_details.right;
			var height = H - trim_details.top - trim_details.bottom;
			
			if(xx + width > WIDTH){
				xx = 0;
				yy += max_height;
				max_height = 0;	
				}
			if(yy % gap > 0 && gap > 0)
				yy = yy - yy % gap + gap;
			if(yy + height > HEIGHT){
				CON.autosize = false;
				HEIGHT = yy + height;
				RATIO = WIDTH/HEIGHT;
				LAYER.set_canvas_size();
				}
			
			canvas_active().drawImage(tmp, trim_details.left, trim_details.top, width, height, xx, yy, width, height);
			xx += width;
			if(gap > 0)
				xx = xx - xx % gap + gap;
			
			if(height > max_height)
				max_height = height;
			if(xx > WIDTH){
				xx = 0;
				yy += max_height;
				max_height = 0;
				}
			}
		};	
	this.unique_colors_count = function(canvas){
		var img = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
		var imgData = img.data;
		var colors = [];
		var n = 0;
		for(var i = 0; i < imgData.length; i += 4){
			if(imgData[i+3] == 0) continue;	//transparent
			var key = imgData[i]+"."+imgData[i+1]+"."+imgData[i+2];
			if(colors[key] == undefined){
				colors[key] = 1;
				n++;
				}
			}
		return n;
		};
	this.calc_differences = function(sensitivity, canvas_preview, w, h){
		vlayer_active = parseInt(LAYER.layer_active);
		//first layer
		var img1 = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
		var imgData1 = img1.data;

		//second layer
		var context2 = document.getElementById(LAYERS[vlayer_active + 1].name).getContext("2d");
		var img2 = context2.getImageData(0, 0, WIDTH, HEIGHT);
		var imgData2 = img2.data;

		//result layer
		if(canvas_preview == undefined){
			//add differences layer
			LAYER.layer_add();
			canvas_active().rect(0, 0, WIDTH, HEIGHT);
			canvas_active().fillStyle = "#ffffff";
			canvas_active().fill();
			var img3 = canvas_active().getImageData(0, 0, WIDTH, HEIGHT);
			}
		else{
			//work on preview layer
			var canvas_tmp = document.createElement("canvas");
			canvas_tmp.width = WIDTH;
			canvas_tmp.height = HEIGHT;
			var img3 = canvas_tmp.getContext("2d").getImageData(0, 0, WIDTH, HEIGHT);
			}
		var imgData3 = img3.data;
		for(var xx = 0; xx < WIDTH; xx++){
			for(var yy = 0; yy < HEIGHT; yy++){
				var x = (xx + yy * WIDTH) * 4;
				if(Math.abs(imgData1[x] - imgData2[x]) > sensitivity
					|| Math.abs(imgData1[x+1] - imgData2[x+1]) > sensitivity
					|| Math.abs(imgData1[x+2] - imgData2[x+2]) > sensitivity
					|| Math.abs(imgData1[x+3] - imgData2[x+3]) > sensitivity){
					imgData3[x] = 255;
					imgData3[x+1] = 0;
					imgData3[x+2] = 0;
					imgData3[x+3] = 255;
					}
				}
			}
		if(canvas_preview == undefined)
			canvas_active().putImageData(img3, 0, 0);
		else{
			canvas_tmp.getContext("2d").rect(0, 0, WIDTH, HEIGHT);
			canvas_tmp.getContext("2d").fillStyle = "#ffffff";
			canvas_tmp.getContext("2d").fill();
			canvas_tmp.getContext("2d").putImageData(img3, 0, 0);
			canvas_preview.clearRect(0, 0, w, h);
			
			canvas_preview.save();
			canvas_preview.scale(w/WIDTH, h/HEIGHT);
			canvas_preview.drawImage(canvas_tmp, 0, 0);
			canvas_preview.restore();
			}
		};
	//method = otsu
	this.thresholding = function(method, ctx, W, H, only_level){
		var img = ctx.getImageData(0, 0, W, H);
		var imgData = img.data;
		var hist_data = [];
		var grey;
		for(var i=0; i<= 255; i++)
			hist_data[i] = 0;
		for(var i = 0; i < imgData.length; i += 4){
			grey = round(0.2126 * imgData[i] + 0.7152 * imgData[i+1] + 0.0722 * imgData[i+2]);
			hist_data[grey]++;
			}
		var level;
		if(method == 'otsu')
			level = this.otsu(hist_data, W*H);
		else
			alert('ERROR: unknown method in TOOLS.thresholding().');
		if(only_level === true)
			return level;
		var c;
		for(var i = 0; i < imgData.length; i += 4){		
			if(imgData[i+3] == 0) continue;	//transparent
			grey = round(0.2126 * imgData[i] + 0.7152 * imgData[i+1] + 0.0722 * imgData[i+2]);
			if(grey < level)
				c = 0;
			else
				c = 255;
			imgData[i] = c;
			imgData[i+1] = c;
			imgData[i+2] = c;
			}	
		ctx.putImageData(img, 0, 0);
		};
	//http://en.wikipedia.org/wiki/Otsu%27s_Method
	this.otsu = function(histogram, total){
		var sum = 0;
		for (var i = 1; i < 256; ++i)
			sum += i * histogram[i];
		var mB, mF, between;
		var sumB = 0;
		var wB = 0;
		var wF = 0;
		var max = 0;
		var threshold = 0;
		for (var i = 0; i < 256; ++i){
			wB += histogram[i];
			if(wB == 0) continue;
			wF = total - wB;
			if(wF == 0) break;
			sumB += i * histogram[i];
			mB = sumB / wB;
			mF = (sum - sumB) / wF;
			between = wB * wF * Math.pow(mB - mF, 2);
			if(between > max){
				max = between;
				threshold = i;
				}
			}
		return threshold;
		};
	this.convert_color_to_alpha = function(context, W, H, color){
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		var back_color = HELPER.hex2rgb(color);

		for(var i = 0; i < imgData.length; i += 4){		
			if(imgData[i+3] == 0) continue;	//transparent

			//calculate difference from requested color, and change alpha
			var diff = Math.abs(imgData[i] - back_color.r) + Math.abs(imgData[i+1] - back_color.g) + Math.abs(imgData[i+2] - back_color.b)/3;
			imgData[i+3] = Math.round(diff);
			
			//combining 2 layers in future will change colors, so make changes to get same colors in final image
			//color_result = color_1 * (alpha_1 / 255) * (1 - A2 / 255) + color_2 * (alpha_2 / 255)
			//color_2 = (color_result - color_1 * (alpha_1 / 255) * (1 - A2 / 255)) / (alpha_2 / 255)
			imgData[i]   = Math.ceil((imgData[i]   - back_color.r * (1-imgData[i+3]/255)) / (imgData[i+3]/255));
			imgData[i+1] = Math.ceil((imgData[i+1] - back_color.g * (1-imgData[i+3]/255)) / (imgData[i+3]/255));
			imgData[i+2] = Math.ceil((imgData[i+2] - back_color.b * (1-imgData[i+3]/255)) / (imgData[i+3]/255));
			}
		context.putImageData(img, 0, 0);
		};
	this.color_zoom = function(context, W, H, zoom, center){
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		var grey;
		for(var i = 0; i < imgData.length; i += 4){		
			if(imgData[i+3] == 0) continue;	//transparent
			
			grey = round(0.2126 * imgData[i] + 0.7152 * imgData[i+1] + 0.0722 * imgData[i+2]);
			
			for(var j=0; j<3; j++){
				var k = i+j;
				if(grey > center)
					imgData[k] += (imgData[k] - center) * zoom;
				else if(grey < center)
					imgData[k] -= (center - imgData[k]) * zoom;
				if(imgData[k] < 0)
					imgData[k] = 0;
				if(imgData[k] > 255)
					imgData[k] = 255;
				}
			}
		context.putImageData(img, 0, 0);
		};
	this.recover_alpha = function(context, W, H, level){
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		var tmp;
		level = parseInt(level);
		for(var i = 0; i < imgData.length; i += 4){		
			tmp = imgData[i+3] + level;
			if(tmp > 255)
				tmp = 255;
			imgData[i+3] = tmp;
			}
		context.putImageData(img, 0, 0);
		};
	this.heatmap_effect = function(context, W, H){
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;
		var grey, RGB;
		for(var i = 0; i < imgData.length; i += 4){		
			if(imgData[i+3] == 0) continue;	//transparent
			grey = round(0.2126 * imgData[i] + 0.7152 * imgData[i+1] + 0.0722 * imgData[i+2]);
			RGB = this.color2heat(grey);
			imgData[i] = RGB.R;
			imgData[i+1] = RGB.G;
			imgData[i+2] = RGB.B;
			}
		context.putImageData(img, 0, 0);
		};
	this.color2heat = function(value){
		var RGB = {R:0,G:0,B:0};
		value = value / 255;
		if (0 <= value && value <= 1/8) {
			RGB.R = 0;
			RGB.G = 0;
			RGB.B = 4*value + .5; // .5 - 1 // b = 1/2
		} else if (1/8 < value && value <= 3/8) {
			RGB.R = 0;
			RGB.G = 4*value - .5; // 0 - 1 // b = - 1/2
			RGB.B = 1; // small fix
		} else if (3/8 < value && value <= 5/8) {
			RGB.R = 4*value - 1.5; // 0 - 1 // b = - 3/2
			RGB.G = 1;
			RGB.B = -4*value + 2.5; // 1 - 0 // b = 5/2
		} else if (5/8 < value && value <= 7/8) {
			RGB.R = 1;
			RGB.G = -4*value + 3.5; // 1 - 0 // b = 7/2
			RGB.B = 0;
		} else if (7/8 < value && value <= 1) {
			RGB.R = -4*value + 4.5; // 1 - .5 // b = 9/2
			RGB.G = 0;
			RGB.B = 0;
		} else {    // should never happen - value > 1
			RGB.R = .5;
			RGB.G = 0;
			RGB.B = 0;
		}
		// scale for hex conversion
		RGB.R *= 255;
		RGB.G *= 255;
		RGB.B *= 255;
		
		RGB.R = Math.round(RGB.R);
		RGB.G = Math.round(RGB.G);
		RGB.B = Math.round(RGB.B);
		
		return RGB;
		};
	this.add_borders = function(context, W, H, color, size){
		context.strokeStyle = color;
		context.lineWidth = size;
		HELPER.roundRect(context, 0 + 0.5, 0 + 0.5, 
			W-1, H-1, 
			0, false, true);
		};
	this.grains_effect = function(context, W, H, level){
		if(level == 0) return context;
		var img = context.getImageData(0, 0, W, H);
		var imgData = img.data;	
		for(var j = 0; j < H; j++){
			for(var i = 0; i < W; i++){		
				var x = (i + j*W) * 4;
				if(imgData[x+3] == 0) continue;	//transparent
				//increase it's lightness
				var delta = HELPER.getRandomInt(0, level);
				if(delta == 0) continue;
				
				if(imgData[x] - delta < 0)
					imgData[x] = -(imgData[x] - delta);
				else
					imgData[x] = imgData[x] - delta;
				if(imgData[x+1] - delta < 0)
					imgData[x+1] = -(imgData[x+1] - delta);
				else
					imgData[x+1] = imgData[x+1] - delta;
				if(imgData[x+2] - delta < 0)
					imgData[x+2] = -(imgData[x+2] - delta);
				else
					imgData[x+2] = imgData[x+2] - delta;
				}
			}	
		context.putImageData(img, 0, 0);
		};
	}
