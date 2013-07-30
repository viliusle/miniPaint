/*
Usage:
var POP = new popup();
POP.add({name: "param1",	title: "Value1:",	values: ["PNG", "JPG"],	});	
POP.add({name: "param2",	title: "Value2:",	value: 92, range: [0, 100], step: 1	});
POP.add({title: 'title:', function: 'custom_function'});

POP.show('title', main_handler, 'preview_handler', 'onload_handler');
*/

function popup(WIDTH, HEIGHT){
	this.active = false;
	this.handler = '';
	this.preview = false;
	this.onload = false;
	
	var WIDTH = WIDTH;
	var HEIGHT = HEIGHT;
	var parameters = [];
	var width_mini = 195;
	var height_mini = Math.round(width_mini * HEIGHT / WIDTH);
	var layer_active_small = document.createElement("canvas");
	var layer_active_small_ctx = layer_active_small.getContext("2d");
	
	//add parameter
	this.add = function(object){
		if(this.active == true){
			parameters = [];
			this.active = false;
			}
		parameters.push(object);
		}
	//show popup window
	this.show = function(title, handler, preview_handler, onload_handler){
		this.active = true;
		this.handler = handler;
		if(preview_handler != undefined)
			this.preview = preview_handler;
		if(onload_handler != undefined)
			this.onload = onload_handler;
		var html = '';
		var can_be_canceled = false;
		
		html += '<h2>'+title+'</h2>';
		html += '<table style="width:99%;">';
		for(var i in parameters){
			var parameter = parameters[i];
			html += '<tr>';
			html += '<td style="font-weight:bold;padding-right:3px;width:130px;">'+parameter.title+'</td>';
			if(parameter.name != undefined){
				can_be_canceled = true;
				if(parameter.value != undefined){
					var colspan = 1;
					if(parameter.range != undefined)
						colspan = 2;
					var step = 1;
					if(parameter.step != undefined)
						step = parameter.step;
					if(parameter.range != undefined){
						var preview_code = '';
						if(this.preview !== false)
							preview_code = 'POP.view();';
						html += '<td colspan="'+colspan+'"><input style="width:100%;" type="range" id="pop_data_'+parameter.name+'" value="'+parameter.value+'" min="'+parameter.range[0]+'" max="'+parameter.range[1]+'" step="'+step+'" " oninput="document.getElementById(\'pv'+i+'\').innerHTML=Math.round(this.value*100)/100;'+preview_code+'" /></td>';
						html += '<td style="padding-left:10px;width:50px;" id="pv'+i+'">'+parameter.value+'</td>';
						}
					else
						html += '<td colspan="'+colspan+'"><input style="width:100%;" type="text" id="pop_data_'+parameter.name+'" value="'+parameter.value+'" onkeyup="POP.validate(this);" /></td>';
					//if(parameter.range != undefined)
						//html += '<td style="padding-left:10px;">'+parameter.range[0]+' - '+parameter.range[1]+'</td>';
					}
				else if(parameter.values != undefined){
					html += '<td colspan="2"><select style="font-size:12px;" id="pop_data_'+parameter.name+'">';
					for(var j in parameter.values)
						html += '<option name="'+parameter.values[j]+'">'+parameter.values[j]+'</option>';
					html += '</select></td>';
					}
				}
			else if(parameter.function != undefined){
				if(typeof parameter.function == 'string')
					var result = window[parameter.function]();
				else
					var result = parameter.function();
				html += '<td colspan="3">'+result+'</td>';
				}
			else{
				//locked fields
				str = ""+parameter.value;
				if(str.length < 40)
					html += '<td colspan="2"><input style="width:100%;color:#393939;padding-left:5px;" disabled="disabled" type="text" id="pop_data_'+parameter.name+'" value="'+parameter.value+'" /></td>';
				else
					html += '<td style="font-size:11px;" colspan="2"><textarea disabled="disabled">'+parameter.value+'</textarea></td>';
				}
			html += '</tr>';
			}
		html += '</table>';
		if(this.preview !== false){
			html += '<div style="margin-top:15px;">';
			html += '<canvas style="position:relative;float:left;margin-right:5px;border:1px solid #393939;" width="'+width_mini+'" height="'+height_mini+'" id="pop_pre"></canvas>';
			html += '<canvas style="position:relative;border:1px solid #393939;background-color:#ffffff;" width="'+width_mini+'" height="'+height_mini+'" id="pop_post"></canvas>';
			html += '</div>';
			}
		html += '<div style="text-align:center;margin-top:20px;margin-bottom:15px;">';
		html += '<input type="button" onclick="POP.save();" class="button" value="OK" />';
		if(can_be_canceled==true)
			html += '<input type="button" onclick="POP.hide();" class="button" value="Cancel" />';
		if(this.preview !== false)
			html += '<input type="button" onclick="POP.view();" class="button" value="Preview" />';	
		html += '</div>';
			
		document.getElementById("popup").innerHTML = html;
		document.getElementById("popup").style.display="block";
		if(parameters.length > 20)
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
		
		//load preview?
		if(this.preview !== false){
			//original
			var pop_pre = document.getElementById("pop_pre").getContext("2d");
			pop_pre.rect(0, 0, WIDTH, HEIGHT);
			pop_pre.fillStyle = "#ffffff";
			pop_pre.fill();
			DRAW.draw_background(pop_pre, 5, true);
			pop_pre.drawImage(document.getElementById(LAYERS[LAYER.layer_active].name), 0, 0, width_mini, height_mini);
			
			//copy
			pop_post = document.getElementById("pop_post").getContext("2d");
			pop_post.rect(0, 0, width_mini, height_mini);
			pop_post.fillStyle = "#ffffff";
			pop_post.fill();
			DRAW.draw_background(pop_post, 5, true);
			pop_post.drawImage(document.getElementById(LAYERS[LAYER.layer_active].name), 0, 0, width_mini, height_mini);
			
			//prepare temp canvas
			layer_active_small.width = width_mini;
			layer_active_small.height = height_mini;
			layer_active_small_ctx.drawImage(document.getElementById(LAYERS[LAYER.layer_active].name), 0, 0, width_mini, height_mini);	
			}
		}
	//hide popup
	this.hide = function(){
		document.getElementById('popup').style.display='none';
		parameters = [];
		this.handler = '';
		this.active = false;
		this.preview = false;
		this.onload = false;
		}
	//renders preview. If input=range supported, is called on every param update - must be fast...
	this.view = function(){
		if(this.preview !== false){
			//reset mini view
			pop_post.clearRect(0, 0, width_mini, height_mini);
			pop_post.drawImage(layer_active_small, 0, 0);
			
			//prepare
			var response = {};
			inputs = document.getElementsByTagName('input');
			for (i = 0; i<inputs.length; i++) {	
				if(inputs[i].id.substr(0,9)=='pop_data_'){
					var key = inputs[i].id.substr(9);
					var value = inputs[i].value;
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
			//update mini view
			this.preview(response, pop_post, width_mini, height_mini);
			}
		}
	//OK pressed - prepare data and call handlers
	this.save = function(){
		this.active = false;
		document.getElementById("popup").style.display="none";
		var response={};
		inputs = document.getElementsByTagName('input');
		for (i = 0; i<inputs.length; i++) {	
			if(inputs[i].id.substr(0,9)=='pop_data_'){
				var key = inputs[i].id.substr(9);
				var value = inputs[i].value;
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
		parameters = [];
		this.preview = false;
		this.onload = false;
		if(this.handler != ''){
			if(typeof this.handler == "string")
				window[this.handler](response);
			else
				this.handler(response);
			}
		this.handler = '';
		}
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
		}
	}
