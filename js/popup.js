/*
Usage:
var POP = new popup();
POP.add({name: "param1", title: "Value1:" });	
POP.add(...);
POP.show('title', main_handler, 'preview_handler', 'onload_handler');

POP.add() parameters:
	name		type			example
	---------------------------------------------------------------
	name		string			'parameter1'
	title		string			'Enter value:'
	type		string			'select', 'textarea', 'color'
	value		string			'314'
	values		array fo strings	['One', 'Two', 'Three']
	range		numbers interval	[0, 255]
	step		int/float		1	
	placeholder	text			'Enter number here'
	html		html text		'<b>bold</b>'
	function	function		'cutom_function'
	onchange	function		'CLASS.onchange_function'
*/
var POP = new popup();

function popup(){
	this.active = false;
	this.handler = '';
	this.preview = false;
	this.onload = false;
	this.width_mini = 195;
	this.height_mini = 195;
	this.preview_in_main = false;
	this.effects = false;
	this.id = 0;
	var parameters = [];
	var layer_active_small = document.createElement("canvas");
	var layer_active_small_ctx = layer_active_small.getContext("2d");
	
	this.constructor = new function(){
		var dim = HELPER.get_dimensions();
		popup = document.getElementById('popup');
		popup.style.top = 150+'px';
		popup.style.left = Math.round(dim[0]/2)+'px';
		};
	//add parameter
	this.add = function(object){
		parameters.push(object);
		};
	//show popup window
	this.show = function(title, handler, preview_handler, onload_handler){
		POP.id = HELPER.getRandomInt(0, 999999999); 
		if(this.active == true){
			this.hide();
			return false;
			}
		this.active = true;
		this.handler = handler;
		if(preview_handler != undefined)
			this.preview = preview_handler;
		if(onload_handler != undefined)
			this.onload = onload_handler;
		var html = '';
		
		var dim = HELPER.get_dimensions();
		popup = document.getElementById('popup');
		popup.style.top = 150+'px';
		popup.style.left = Math.round(dim[0]/2)+'px';
		
		if(this.effects == true){
			var index;
			for(var i=0; i<FILTERS_LIST.length; i++){
				if(FILTERS_LIST[i].name == MENU.last_menu){
					index = i;
					break;
					}
				}
			var prev_index = index-1;
			if(prev_index < 0){
				prev_index = 0;
				}
			var next_index = index+1;	
			if(next_index > FILTERS_LIST.length-1){
				next_index = FILTERS_LIST.length-1;
				}
			html += '<span style="float:right;">';
			html += '<input id="previous_filter" type="button" value="&lt;"> ';
			html += '<select id="effect_browser">';
			html += '<option value="">--- Select effect ---</option>';
			for(var i=0; i<FILTERS_LIST.length; i++){
				var selected = '';
				if(FILTERS_LIST[i].name == MENU.last_menu)
					var selected = 'selected';
				html += ' <option ' + selected +' value="' + i + '">' + FILTERS_LIST[i].title + '</option>';
				}
			html += '</select>';
			html += ' <input id="next_filter" onclick="" type="button" value="&gt;"> ';
			html += '</span>';
			}
		html += '<h2 id="popup_drag">'+title+'</h2>';
		html += '<table style="width:99%;">';
		for(var i in parameters){
			var parameter = parameters[i];
			html += '<tr>';
			if(title != 'Error')
				html += '<td style="font-weight:bold;padding-right:3px;width:130px;">'+parameter.title+'</td>';
			if(parameter.name != undefined){
				if(parameter.values != undefined){
					var onchange = '';
					if(parameter.onchange != undefined)
						onchange = ' onchange="'+parameter.onchange+';" ';
					if(parameter.values.length > 10 || parameter.type == 'select'){
						//drop down
						if(onchange == '' && preview_handler != undefined)
							onchange = ' onchange="POP.view();" ';
						html += '<td colspan="2"><select '+onchange+' style="font-size:12px;" id="pop_data_'+parameter.name+'">';
						var k = 0;
						for(var j in parameter.values){
							var sel = '';
							if(parameter.value == parameter.values[j])
								sel = 'selected="selected"';
							if(parameter.value == undefined && k == 0)
								sel = 'selected="selected"';
							html += '<option '+sel+' name="'+parameter.values[j]+'">'+parameter.values[j]+'</option>';
							k++;
							}
						html += '</select></td>';
						}
					else{
						//radio
						html += '<td colspan="2">';
						if(parameter.values.length > 2)
							html += '<div class="group">';
						var k = 0;
						for(var j in parameter.values){
								var ch = '';
							if(parameter.value == parameter.values[j])
								ch = 'checked="checked"';
							if(parameter.value == undefined && k == 0)
								ch = 'checked="checked"';
							if(onchange == '' && preview_handler != undefined)
								onchange = ' onchange="POP.view();" ';
							html += '<input type="radio" '+onchange+' '+ch+' name="'+parameter.name+'" id="pop_data_'+parameter.name+"_poptmp"+j+'" value="'+parameter.values[j]+'">';
							html += '<label style="margin-right:20px;" for="pop_data_'+parameter.name+"_poptmp"+j+'">'+parameter.values[j]+'</label>';
							if(parameter.values.length > 2)
								html += '<br />';
							k++;
							}
						if(parameter.values.length > 2)
							html += '</div>';
						html += '</td>';
						}
					}
				else if(parameter.value != undefined){
					//input, range, textarea, color
					var step = 1;
					if(parameter.step != undefined)
						step = parameter.step;
					if(parameter.range != undefined){
						//range
						var preview_code = '';
						if(this.preview !== false)
							preview_code = 'POP.view();';
						html += '<td><input type="range" id="pop_data_'+parameter.name+'" value="'+parameter.value+'" min="'+parameter.range[0]+'" max="'+parameter.range[1]+'" step="'+step+'" " oninput="document.getElementById(\'pv'+i+'\').innerHTML=Math.round(this.value*100)/100;'+preview_code+'" /></td>';
						html += '<td style="padding-left:10px;width:50px;" id="pv'+i+'">'+parameter.value+'</td>';
						}
					else if(parameter.type == 'color'){
						//color
						html += '<td><input type="color" id="pop_data_'+parameter.name+'" value="'+parameter.value+'" /></td>';
						}
					else{
						//input or textarea
						if(parameter.placeholder == undefined)
							parameter.placeholder = '';						
						if(parameter.type == 'textarea')
							html += '<td><textarea style="width:100%;height:80px;" id="pop_data_'+parameter.name+'" placeholder="'+parameter.placeholder+'">'+parameter.value+'</textarea></td>';
						else
							html += '<td colspan="2"><input style="width:100%;" type="text" id="pop_data_'+parameter.name+'" value="'+parameter.value+'" placeholder="'+parameter.placeholder+'" onkeyup="POP.validate(this);" /></td>';
						}
					}
				}
			else if(parameter.function != undefined){
				//custom function
				if(typeof parameter.function == 'string')
					var result = window[parameter.function]();
				else
					var result = parameter.function();
				html += '<td colspan="3">'+result+'</td>';
				}
			else if(parameter.html != undefined){
				//html
				html += '<td style="padding-bottom:3px;padding-top:3px;" colspan="2">'+parameter.html+'</td>';
				}
			else{
				//locked fields
				str = ""+parameter.value;
				var id_tmp = parameter.title.toLowerCase().replace(/[^\w]+/g,'').replace(/ +/g,'-');
				id_tmp = id_tmp.substring(0, 10);
				if(str.length < 40)
					html += '<td colspan="2"><input style="width:100%;color:#393939;padding-left:5px;" disabled="disabled" type="text" id="pop_data_'+id_tmp+'" value="'+parameter.value+'" /></td>';
				else
					html += '<td style="font-size:11px;" colspan="2"><textarea disabled="disabled">'+parameter.value+'</textarea></td>';
				}
			html += '</tr>';
			}
		html += '</table>';
		if(this.preview !== false && this.preview_in_main == false){
			html += '<div style="margin-top:15px;">';
			html += '<canvas style="position:relative;float:left;margin-right:5px;border:1px solid #393939;" width="'+POP.width_mini+'" height="'+POP.height_mini+'" id="pop_pre"></canvas>';
			html += '<canvas style="position:relative;border:1px solid #393939;background-color:#ffffff;" width="'+POP.width_mini+'" height="'+POP.height_mini+'" id="pop_post"></canvas>';
			html += '</div>';
			}
		html += '<div style="text-align:center;margin-top:20px;margin-bottom:15px;">';
		html += '<input type="button" onclick="POP.save();" class="button" value="OK" />';
		html += '<input type="button" onclick="POP.hide();" class="button" value="Cancel" />';
		if(this.preview_in_main !== false)
			html += '<input type="button" onclick="POP.view();" class="button" value="Preview" />';	
		html += '</div>';
			
		document.getElementById("popup").innerHTML = html;
		document.getElementById("popup").style.display="block";
		if(parameters.length > 15)
			document.getElementById("popup").style.overflowY="scroll";
		else
			document.getElementById("popup").style.overflowY='hidden';
		
		//onload
		if(this.onload != ''){
			if(typeof this.onload == "string")
				window[this.onload]();
			else
				this.onload();
			}
		
		//some events for effects browser
		if(this.effects == true){
			document.getElementById('previous_filter').disabled = false;
			document.getElementById('next_filter').disabled = false;
			if(index == 0){
				document.getElementById('previous_filter').disabled = true;
				}
			if(index == FILTERS_LIST.length-1){
				document.getElementById('next_filter').disabled = true;
				}
			//previous
			document.getElementById('previous_filter').addEventListener('click', function(event){
				POP.hide();
				MENU.last_menu = FILTERS_LIST[prev_index].name;
				MENU.do_menu([FILTERS_LIST[prev_index].name]);
				});
			//next
			document.getElementById('next_filter').addEventListener('click', function(event){
				POP.hide();
				MENU.last_menu = FILTERS_LIST[next_index].name;
				MENU.do_menu([FILTERS_LIST[next_index].name]);
				});
			//onchange
			var effect_browser = document.getElementById('effect_browser');
			effect_browser.addEventListener('change', function(event){
				var value = effect_browser.options[effect_browser.selectedIndex].value;
				POP.hide();
				MENU.last_menu = FILTERS_LIST[value].name;
				MENU.do_menu([FILTERS_LIST[value].name]);
				});
			}
	
		//load preview?
		if(this.preview !== false && this.preview_in_main == false){
			//original
			var pop_pre = document.getElementById("pop_pre").getContext("2d");
			pop_pre.rect(0, 0, POP.width_mini, POP.height_mini);
			pop_pre.fillStyle = "#ffffff";
			pop_pre.fill();
			DRAW.draw_background(pop_pre, POP.width_mini, POP.height_mini, 5);
			pop_pre.drawImage(document.getElementById(LAYERS[LAYER.layer_active].name), 0, 0, POP.width_mini, POP.height_mini);
			
			//copy
			pop_post = document.getElementById("pop_post").getContext("2d");
			pop_post.rect(0, 0, POP.width_mini, POP.height_mini);
			pop_post.fillStyle = "#ffffff";
			pop_post.fill();
			DRAW.draw_background(pop_post, POP.width_mini, POP.height_mini, 5);
			pop_post.drawImage(document.getElementById(LAYERS[LAYER.layer_active].name), 0, 0, POP.width_mini, POP.height_mini);
			
			//prepare temp canvas
			layer_active_small.width = POP.width_mini;
			layer_active_small.height = POP.height_mini;
			layer_active_small_ctx.drawImage(document.getElementById(LAYERS[LAYER.layer_active].name), 0, 0, POP.width_mini, POP.height_mini);	
			POP.view();
			}
		};
	//hide popup
	this.hide = function(){
		document.getElementById('popup').style.display='none';
		parameters = [];
		this.handler = '';
		this.active = false;
		this.preview = false;
		this.onload = false;
		this.preview_in_main = false;
		this.effects = false;
		canvas_front.clearRect(0, 0, WIDTH, HEIGHT);
		};
	//renders preview. If input=range supported, is called on every param update - must be fast...
	this.view = function(){
		if(this.preview !== false){
			if(this.preview_in_main == false){
				//reset mini view
				pop_post.clearRect(0, 0, POP.width_mini, POP.height_mini);
				pop_post.drawImage(layer_active_small, 0, 0);
				}
				
			//prepare
			var response = {};
			inputs = document.getElementsByTagName('input');
			for (i = 0; i<inputs.length; i++){
				if(inputs[i].id.substr(0,9)=='pop_data_'){
					var key = inputs[i].id.substr(9);
					if(HELPER.strpos(key, "_poptmp") != false)
						key = key.substring(0, HELPER.strpos(key, "_poptmp"));
					var value = inputs[i].value;
					if(inputs[i].type == 'radio'){
						if(inputs[i].checked==true)
							response[key] = value;
						}
					else
						response[key] = value;
					}
				}
			selects = document.getElementsByTagName('select');
			for (i = 0; i<selects.length; i++) {
				if(selects[i].id.substr(0,9)=='pop_data_'){
					var key = selects[i].id.substr(9);
					var value = selects[i].value;
					response[key] = value;
					}
				}
			textareas = document.getElementsByTagName('textarea');
			for (i = 0; i<textareas.length; i++){
				if(textareas[i].id.substr(0,9)=='pop_data_'){
					var key = textareas[i].id.substr(9);
					var value = textareas[i].value;
					response[key] = value;
					}
				}
				
			//call handler
			if(this.preview_in_main == false)
				this.preview(response, pop_post, POP.width_mini, POP.height_mini);
			else
				this.preview(response);
			}
		};
	//OK pressed - prepare data and call handlers
	this.save = function(){
		this.active = false;
		document.getElementById("popup").style.display="none";
		var response={};
		inputs = document.getElementsByTagName('input');
		for (i = 0; i<inputs.length; i++){
			if(inputs[i].id.substr(0,9)=='pop_data_'){
				var key = inputs[i].id.substr(9);
				if(HELPER.strpos(key, "_poptmp") != false)
					key = key.substring(0, HELPER.strpos(key, "_poptmp"));
				var value = inputs[i].value;
				if(inputs[i].type == 'radio'){
					if(inputs[i].checked==true)
						response[key] = value;
					}
				else
					response[key] = value;
				
				}
			}
		selects = document.getElementsByTagName('select');
		for (i = 0; i<selects.length; i++) {
			if(selects[i].id.substr(0,9)=='pop_data_'){
				var key = selects[i].id.substr(9);
				var value = selects[i].value;
				response[key] = value;
				}
			}
		textareas = document.getElementsByTagName('textarea');
		for (i = 0; i<textareas.length; i++){
			if(textareas[i].id.substr(0,9)=='pop_data_'){
				var key = textareas[i].id.substr(9);
				var value = textareas[i].value;
				response[key] = value;
				}
			}
		parameters = [];
		this.preview = false;
		this.onload = false;
		this.preview_in_main = false;
		this.effects = false;
		if(this.handler != ''){
			if(typeof this.handler == "string")
				window[this.handler](response);
			else
				this.handler(response);
			}
		this.handler = '';
		};
	//validate input field, unless browser supports input=range
	this.validate = function(field){
		for(var i in parameters){
			var parameter = parameters[i];
			if("pop_data_"+parameter.name == field.id && parameter.range != undefined){
				if(field.value == '-' || field.value == '') return true;
				
				var value = parseFloat(field.value);
				if(isNaN(value) || value != field.value)
					field.value = parameter.value;	//not number
				if(value < parameter.range[0])
					field.value = parameter.range[0];	//less then min
				else if(value > parameter.range[1])
					field.value = parameter.range[1];	//more then max
				}
			}
		};
	}
