/* global MAIN, HELPER, POP, LAYER, EFFECTS, GUI, HELP */
/* global canvas_front, WIDTH, HEIGHT, LANG */

var POP = new popup();

/**
 * user dialogs library
 * 
 * @author ViliusL
 * 
 * Usage:
 * var POP = new popup();
 * POP.add({name: "param1", title: "value1:" });
 * POP.add(...);
 * POP.show('title', main_handler, preview_handler, onload_handler);
 * 
 * POP.add() parameters:
 * - name		type			example
 * - ---------------------------------------------------------------
 * - name		string		'parameter1'
 * - title		string		'enter value:'
 * - type		string		'select', 'textarea', 'color'
 * - value		string		'314'
 * - values		array fo strings	['one', 'two', 'three']
 * - range		numbers interval	[0, 255]
 * - step		int/float		1	
 * - placeholder	text			'enter number here'
 * - html		html text		'<b>bold</b>'
 * - function	function		'cutom_function'
 * - onchange	function		'class.onchange_function()'
 */
function popup() {
	this.active = false;
	this.handler = '';
	this.preview = false;
	this.onload = false;
	this.width_mini = 225;
	this.height_mini = 200;
	this.preview_in_main = false;
	this.effects = false;
	this.id = 0;
	var parameters = [];
	var layer_active_small = document.createElement("canvas");
	var layer_active_small_ctx = layer_active_small.getContext("2d");

	//add parameter
	this.add = function (object) {
		parameters.push(object);
	};
	
	/**
	 * reset dialog position
	 */
	this.reset_position = function(){
		popup = document.getElementById('popup');
		var dim = HELPER.get_dimensions();
		
		popup.style.top = 150 + 'px';
		var left = Math.round(dim[0] / 2 - 500/2);
		left = Math.max(left, 0);
		popup.style.left = left + 'px';
	};
	
	/**
	 * show popup window.
	 * used strings: "Ok", "Cancel", "Preview"
	 * 
	 * @param {string} title
	 * @param {function} handler
	 * @param {function} preview_handler
	 * @param {function} onload_handler
	 */
	this.show = function (title, handler, preview_handler, onload_handler) {
		POP.id = HELPER.getRandomInt(0, 999999999);
		if (this.active == true) {
			this.hide();
			return false;
		}
		this.active = true;
		this.handler = handler;
		if (preview_handler != undefined)
			this.preview = preview_handler;
		if (onload_handler != undefined)
			this.onload = onload_handler;
		var html = '';

		this.reset_position();

		if (this.effects == true) {
			var index;
			for (var i = 0; i < EFFECTS.FILTERS_LIST.length; i++) {
				if (EFFECTS.FILTERS_LIST[i].name == GUI.last_menu) {
					index = i;
					break;
				}
			}
			var prev_index = index - 1;
			if (prev_index < 0) {
				prev_index = 0;
			}
			var next_index = index + 1;
			if (next_index > EFFECTS.FILTERS_LIST.length - 1) {
				next_index = EFFECTS.FILTERS_LIST.length - 1;
			}
			html += '<span style="float:right;">';
			html += '<input id="previous_filter" type="button" value="&lt;"> ';
			html += '<select id="effect_browser">';
			html += '<option class="trn" value="">--- Select effect ---</option>';
			for (var i = 0; i < EFFECTS.FILTERS_LIST.length; i++) {
				var selected = '';
				if (EFFECTS.FILTERS_LIST[i].name == GUI.last_menu)
					var selected = 'selected';
				html += ' <option ' + selected + ' value="' + i + '">' + EFFECTS.FILTERS_LIST[i].title + '</option>';
			}
			html += '</select>';
			html += ' <input id="next_filter" onclick="" type="button" value="&gt;"> ';
			html += '</span>';
		}
		html += '<h2 id="popup_drag" class="trn">' + title + '</h2>';

		//preview area
		if (this.preview !== false && this.preview_in_main == false) {
			html += '<div style="margin-top:15px;margin-bottom:15px;">';
			html += '<canvas style="position:relative;float:left;margin:0 5px 5px 0;border:1px solid #393939;" width="' + POP.width_mini + '" height="' + POP.height_mini + '" id="pop_pre"></canvas>';
			html += '<div id="canvas_preview_container">';
			html += '	<canvas style="position:absolute;border:1px solid #393939;background-color:#ffffff;" width="' + POP.width_mini + '" height="' + POP.height_mini + '" id="pop_post_back"></canvas>';
			html += '	<canvas style="position:relative;border:1px solid #393939;" width="' + POP.width_mini + '" height="' + POP.height_mini + '" id="pop_post"></canvas>';
			html += '</div>';
			html += '</div>';
		}

		//settings
		html += '<table style="width:99%;">';
		for (var i in parameters) {
			var parameter = parameters[i];
			
			html += '<tr id="popup-tr-'+parameters[i].name+'">';
			if (title != 'Error' && parameter.title != undefined)
				html += '<th class="trn">' + parameter.title + '</th>';
			if (parameter.name != undefined) {
				if (parameter.values != undefined) {
					var onchange = '';
					if (parameter.onchange != undefined)
						onchange = ' onchange="' + parameter.onchange + ';" ';
					if (parameter.values.length > 10 || parameter.type == 'select') {
						//drop down
						if (onchange == '' && preview_handler != undefined)
							onchange = ' onchange="POP.view();" ';
						html += '<td colspan="2"><select ' + onchange + ' style="font-size:12px;" id="pop_data_' + parameter.name + '">';
						var k = 0;
						for (var j in parameter.values) {
							var sel = '';
							if (parameter.value == parameter.values[j])
								sel = 'selected="selected"';
							if (parameter.value == undefined && k == 0)
								sel = 'selected="selected"';
							html += '<option ' + sel + ' name="' + parameter.values[j] + '">' + parameter.values[j] + '</option>';
							k++;
						}
						html += '</select></td>';
					}
					else {
						//radio
						html += '<td colspan="2">';
						if (parameter.values.length > 2)
							html += '<div class="group">';
						var k = 0;
						for (var j in parameter.values) {
							var ch = '';
							if (parameter.value == parameter.values[j])
								ch = 'checked="checked"';
							if (parameter.value == undefined && k == 0)
								ch = 'checked="checked"';
							if (onchange == '' && preview_handler != undefined)
								onchange = ' onchange="POP.view();" ';
							
							var title = parameter.values[j];
							var parts = parameter.values[j].split(" - ");
							if(parts.length > 1){
								title = parts[0] + ' - <span class="trn">'+parts[1]+'</span>';
							}
							
							html += '<input type="radio" ' + onchange + ' ' + ch + ' name="' + parameter.name + '" id="pop_data_' + parameter.name + "_poptmp" + j + '" value="' + parameter.values[j] + '">';
							html += '<label style="margin-right:20px;" class="trn" for="pop_data_' + parameter.name + "_poptmp" + j + '">' + title + '</label>';
							if (parameter.values.length > 2)
								html += '<br />';
							k++;
						}
						if (parameter.values.length > 2)
							html += '</div>';
						html += '</td>';
					}
				}
				else if (parameter.value != undefined) {
					//input, range, textarea, color
					var step = 1;
					if (parameter.step != undefined)
						step = parameter.step;
					if (parameter.range != undefined) {
						//range
						var preview_code = '';
						if (this.preview !== false)
							preview_code = 'POP.view();';
						html += '<td><input type="range" name="' + parameter.name + '" id="pop_data_' + parameter.name + '" value="' + parameter.value + '" min="' + parameter.range[0] + '" max="' + parameter.range[1] + '" step="' + step + '" " oninput="document.getElementById(\'pv' + i + '\').innerHTML=Math.round(this.value*100)/100;'+ preview_code + '" ' + onchange + ' /></td>';
						html += '<td style="padding-left:10px;width:50px;" id="pv' + i + '">' + parameter.value + '</td>';
					}
					else if (parameter.type == 'color') {
						//color
						var preview_code = '';
						if (this.preview !== false)
							preview_code = 'POP.view();';
						html += '<td><input type="color" id="pop_data_' + parameter.name + '" value="' + parameter.value + '" onchange="'+preview_code+'" /></td>';
					}
					else {
						//input or textarea
						if (parameter.placeholder == undefined)
							parameter.placeholder = '';
						if (parameter.type == 'textarea'){
							html += '<td><textarea style="height:80px;" id="pop_data_' + parameter.name + '" placeholder="' + parameter.placeholder + '">' + parameter.value + '</textarea></td>';
						}
						else{
							var input_type="text";
							if(parameter.placeholder != undefined && parameter.placeholder != '' && !isNaN(parameter.placeholder))
								input_type = 'number';
							if(parameter.value != undefined && typeof parameter.value == 'number')
								input_type = 'number';
							
							html += '<td colspan="2"><input type="'+input_type+'" id="pop_data_' + parameter.name + '" onkeyup="POP.onkeyup(event);" value="' + parameter.value + '" placeholder="' + parameter.placeholder + '" onkeyup="POP.validate(this);" /></td>';
						}
					}
				}
			}
			else if (parameter.function != undefined) {
				//custom function
				var result;
				if (typeof parameter.function == 'string')
					result = window[parameter.function]();
				else
					result = parameter.function();
				html += '<td colspan="3">' + result + '</td>';
			}
			else if (parameter.html != undefined) {
				//html
				html += '<td style="padding-bottom:3px;padding-top:3px;" colspan="2">' + parameter.html + '</td>';
			}
			else if (parameter.title == undefined) {
				//gap
				html += '<td style="padding-bottom:3px;padding-top:3px;" colspan="2"></td>';
			}
			else {
				//locked fields without name
				str = "" + parameter.value;
				var id_tmp = parameter.title.toLowerCase().replace(/[^\w]+/g, '').replace(/ +/g, '-');
				id_tmp = id_tmp.substring(0, 10);
				if (str.length < 40)
					html += '<td colspan="2"><div class="trn" id="pop_data_'+id_tmp+'" style="padding: 2px 0px;">' + parameter.value + '</div></td>';
				else
					html += '<td style="font-size:11px;" colspan="2"><textarea disabled="disabled">' + parameter.value + '</textarea></td>';
			}
			html += '</tr>';
		}
		html += '</table>';

		//action buttons
		html += '<div style="text-align:center;margin-top:20px;margin-bottom:5px;">';
		html += '	<button onclick="POP.save();" class="button trn">Ok</button>';
		html += '	<button onclick="POP.hide();" class="button trn">Cancel</button>';
		if (this.preview_in_main !== false)
			html += '	<button onclick="POP.view();" class="button trn">Preview</button>';
		html += '</div>';

		document.getElementById("popup").innerHTML = html;
		document.getElementById("popup").style.display = "block";
		if (parameters.length > 10)
			document.getElementById("popup").style.overflowY = "scroll";
		else
			document.getElementById("popup").style.overflowY = 'hidden';

		//onload
		if (this.onload) {
			if (typeof this.onload == "string")
				window[this.onload]();
			else
				this.onload();
		}

		//some events for effects browser
		if (this.effects == true) {
			document.getElementById('previous_filter').disabled = false;
			document.getElementById('next_filter').disabled = false;
			if (index == 0) {
				document.getElementById('previous_filter').disabled = true;
			}
			if (index == EFFECTS.FILTERS_LIST.length - 1) {
				document.getElementById('next_filter').disabled = true;
			}
			//previous
			document.getElementById('previous_filter').addEventListener('click', function (event) {
				POP.hide();
				GUI.last_menu = EFFECTS.FILTERS_LIST[prev_index].name;
				call_menu(EFFECTS, EFFECTS.FILTERS_LIST[prev_index].name);
			});
			//next
			document.getElementById('next_filter').addEventListener('click', function (event) {
				POP.hide();
				GUI.last_menu = EFFECTS.FILTERS_LIST[next_index].name;
				call_menu(EFFECTS, EFFECTS.FILTERS_LIST[next_index].name);
			});
			//onchange
			var effect_browser = document.getElementById('effect_browser');
			effect_browser.addEventListener('change', function (event) {
				var value = effect_browser.options[effect_browser.selectedIndex].value;
				POP.hide();
				GUI.last_menu = EFFECTS.FILTERS_LIST[value].name;
				call_menu(EFFECTS, EFFECTS.FILTERS_LIST[value].name);
			});
		}

		//load preview?
		if (this.preview !== false && this.preview_in_main == false) {
			//original
			var pop_pre = document.getElementById("pop_pre").getContext("2d");
			pop_pre.rect(0, 0, POP.width_mini, POP.height_mini);
			pop_pre.fillStyle = "#ffffff";
			pop_pre.fill();
			GUI.draw_background(pop_pre, POP.width_mini, POP.height_mini, 10);
			pop_pre.drawImage(document.getElementById(LAYER.layers[LAYER.layer_active].name), 0, 0, POP.width_mini, POP.height_mini);

			//copy
			pop_post = document.getElementById("pop_post").getContext("2d");
			pop_post.rect(0, 0, POP.width_mini, POP.height_mini);
			pop_post.drawImage(document.getElementById(LAYER.layers[LAYER.layer_active].name), 0, 0, POP.width_mini, POP.height_mini);
			
			//copy back
			pop_post_back = document.getElementById("pop_post_back").getContext("2d");
			GUI.draw_background(pop_post_back, POP.width_mini, POP.height_mini, 10);
			
			//prepare temp canvas
			layer_active_small.width = POP.width_mini;
			layer_active_small.height = POP.height_mini;
			layer_active_small_ctx.drawImage(document.getElementById(LAYER.layers[LAYER.layer_active].name), 0, 0, POP.width_mini, POP.height_mini);
			POP.view();
		}
		
		//call translation again to translate popup
		HELP.help_translate(LANG);
	};
	
	//hide popup
	this.hide = function () {
		document.getElementById('popup').style.display = 'none';
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
	this.view = function () {
		if (this.preview !== false) {
			if (this.preview_in_main == false) {
				//reset mini view
				pop_post.clearRect(0, 0, POP.width_mini, POP.height_mini);
				pop_post.drawImage(layer_active_small, 0, 0);
			}

			//prepare
			var response = {};
			inputs = document.getElementsByTagName('input');
			for (i = 0; i < inputs.length; i++) {
				if (inputs[i].id.substr(0, 9) == 'pop_data_') {
					var key = inputs[i].id.substr(9);
					if (HELPER.strpos(key, "_poptmp") != false)
						key = key.substring(0, HELPER.strpos(key, "_poptmp"));
					var value = inputs[i].value;
					if (inputs[i].type == 'radio') {
						if (inputs[i].checked == true)
							response[key] = value;
					}
					else
						response[key] = value;
				}
			}
			selects = document.getElementsByTagName('select');
			for (i = 0; i < selects.length; i++) {
				if (selects[i].id.substr(0, 9) == 'pop_data_') {
					var key = selects[i].id.substr(9);
					var value = selects[i].value;
					response[key] = value;
				}
			}
			textareas = document.getElementsByTagName('textarea');
			for (i = 0; i < textareas.length; i++) {
				if (textareas[i].id.substr(0, 9) == 'pop_data_') {
					var key = textareas[i].id.substr(9);
					var value = textareas[i].value;
					response[key] = value;
				}
			}

			//call handler
			if (this.preview_in_main == false)
				this.preview(response, pop_post, POP.width_mini, POP.height_mini);
			else
				this.preview(response);
		}
	};
	
	//OK pressed - prepare data and call handlers
	this.save = function () {
		this.active = false;
		document.getElementById("popup").style.display = "none";
		var response = {};
		inputs = document.getElementsByTagName('input');
		for (i = 0; i < inputs.length; i++) {
			if (inputs[i].id.substr(0, 9) == 'pop_data_') {
				var key = inputs[i].id.substr(9);
				if (HELPER.strpos(key, "_poptmp") != false)
					key = key.substring(0, HELPER.strpos(key, "_poptmp"));
				var value = inputs[i].value;
				if (inputs[i].type == 'radio') {
					if (inputs[i].checked == true)
						response[key] = value;
				}
				else
					response[key] = value;

			}
		}
		selects = document.getElementsByTagName('select');
		for (i = 0; i < selects.length; i++) {
			if (selects[i].id.substr(0, 9) == 'pop_data_') {
				var key = selects[i].id.substr(9);
				var value = selects[i].value;
				response[key] = value;
			}
		}
		textareas = document.getElementsByTagName('textarea');
		for (i = 0; i < textareas.length; i++) {
			if (textareas[i].id.substr(0, 9) == 'pop_data_') {
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
		if (this.handler) {
			if (typeof this.handler == "object")
				this.handler[0][this.handler[1]](response);
			else if (typeof this.handler == "function")
				this.handler(response);
			else
				console.log('error: wrong function type: ' + this.handler);
		}
		this.handler = '';
	};
	
	//validate input field, unless browser supports input=range
	this.validate = function (field) {
		for (var i in parameters) {
			var parameter = parameters[i];
			if ("pop_data_" + parameter.name == field.id && parameter.range != undefined) {
				if (field.value == '-' || field.value == '')
					return true;

				var value = parseFloat(field.value);
				if (isNaN(value) || value != field.value)
					field.value = parameter.value;	//not number
				if (value < parameter.range[0])
					field.value = parameter.range[0];	//less then min
				else if (value > parameter.range[1])
					field.value = parameter.range[1];	//more then max
			}
		}
	};
	
	//on key press inside input text
	this.onkeyup = function(event) {
		if(event.keyCode == "13"){
			//Enter was pressed
			POP.save();
		}
	};
}
