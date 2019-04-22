/**
 * user dialogs library
 * 
 * @author ViliusL
 * 
 * Usage:
 * 
 * import Dialog_class from './libs/popup.js';
 * var POP = new popup();
 * 
 * var settings = {
 *		title: 'Differences',
 *		comment: '',
 *		preview: true,
 *		className: '',
 *		params: [
 *			{name: "param1", title: "Parameter #1:", value: "111"},
 *			{name: "param2", title: "Parameter #2:", value: "222"},
 *		],
 *		on_load: function(params){...},
 *		on_change: function(params, canvas_preview, w, h){...},
 *		on_finish: function(params){...},
 *		on_cancel: function(params){...},
 * };
 * this.POP.show(settings);
 * 
 * Params types:
 * - name		type				example
 * - ---------------------------------------------------------------
 * - name		string				'parameter1'
 * - title		string				'enter value:'
 * - type		string				'select', 'textarea', 'color'
 * - value		string				'314'
 * - values		array fo strings	['one', 'two', 'three']
 * - range		numbers interval	[0, 255]
 * - step		int/float			1	
 * - placeholder	text			'enter number here'
 * - html		html text			'<b>bold</b>'
 * - function	function			'custom_function'
 */
import './../../css/popup.css';
import app_config from './../config.js';
import Base_layers_class from './../core/base-layers.js';
import Base_gui_class from './../core/base-gui.js';
import Help_translate_class from './../modules/help/translate.js';

var instance = null;

var template = `
	<button type="button" class="close" id="popup_close">&times;</button>
	<div id="pretitle_area"></div>
	<span class="grey right" id="popup_comment"></span>
	<h2 class="trn" id="popup_title"></h2>
	<div id="dialog_content">
		<div id="preview_content"></div>
		<div id="params_content"></div>
	</div>
	<div class="buttons">
		<button type="button" id="popup_ok" class="button trn">Ok</button>
		<button type="button" id="popup_cancel" class="button trn">Cancel</button>
	</div>
`;

class Dialog_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;
		window.POP = this;

		this.active = false;
		this.title = null;
		this.onfinish = false;
		this.oncancel = false;
		this.preview = false;
		this.onload = false;
		this.onchange = false;
		this.width_mini = 225;
		this.height_mini = 200;
		this.effects = false;
		this.id = 0;
		this.parameters = [];
		this.Base_layers = new Base_layers_class();
		this.Base_gui = new Base_gui_class();
		this.Help_translate = new Help_translate_class();
		this.last_params_hash = '';
		this.layer_active_small = document.createElement("canvas");
		this.layer_active_small_ctx = this.layer_active_small.getContext("2d");
		this.ef_index = null; //current effect list key
		this.ef_prev_index = null;
		this.ef_next_index = null;

		this.set_events();
	}

	/**
	 * shows dialog
	 * 
	 * @param {array} config
	 */
	show(config) {

		if (this.active == true) {
			this.hide();
		}

		this.title = config.title || '';
		this.parameters = config.params || [];
		this.onfinish = config.on_finish || false;
		this.oncancel = config.on_cancel || false;
		this.preview = config.preview || false;
		this.onchange = config.on_change || false;
		this.onload = config.on_load || false;
		this.effects = config.effects || false;
		this.className = config.className || '';
		this.comment = config.comment || '';

		this.show_action();
	}

	/**
	 * hides dialog
	 * 
	 * @param {boolean} success
	 * @returns {undefined}
	 */
	hide(success) {
		var params = this.get_params();

		if (success === false && this.oncancel) {
			this.oncancel(params);
		}
		document.getElementById("popup").style.display = 'none';
		this.parameters = [];
		this.active = false;
		this.preview = false;
		this.onload = false;
		this.onchange = false;
		this.effects = false;
		this.title = null;
		this.className = '';
		this.comment = '';
		this.onfinish = false;
		this.oncancel = false;
	}

	/* ----------------- private functions ---------------------------------- */

	set_events() {
		var _this = this;

		document.addEventListener('keydown', function (event) {
			var code = event.keyCode;

			if (code == 27) {
				//escape
				_this.hide(false);
			}
		}, false);
	}

	onChangeEvent(e) {
		var params = this.get_params();

		var hash = JSON.stringify(params);
		if (this.last_params_hash == hash) {
			//nothing changed
			return;
		}
		this.last_params_hash = hash;

		if (this.onchange != false) {
			if (this.preview != false) {
				var canvas_right = document.getElementById("pop_post");
				var ctx_right = canvas_right.getContext("2d");

				ctx_right.clearRect(0, 0, this.width_mini, this.height_mini);
				ctx_right.drawImage(this.layer_active_small, 0, 0, this.width_mini, this.height_mini);

				this.onchange(params, ctx_right, this.width_mini, this.height_mini, canvas_right);
			}
			else {
				this.onchange(params);
			}
		}
	}

	//renders preview. If input=range supported, is called on every param update - must be fast...
	preview_handler(e) {
		if (this.preview !== false) {
			this.onChangeEvent(e);
		}
	}

	//OK pressed - prepare data and call handlers
	save() {
		var params = this.get_params();

		if (this.onfinish) {
			this.onfinish(params);
		}

		this.hide(true);
	}
	
	//"Cancel" pressed
	cancel() {
		if (this.oncancel) {
			var params = this.get_params();
			this.oncancel(params);
		}
	}

	get_params() {
		var response = {};
		var inputs = document.getElementsByTagName('input');
		for (var i = 0; i < inputs.length; i++) {
			if (inputs[i].id.substr(0, 9) == 'pop_data_') {
				var key = inputs[i].id.substr(9);
				if (this.strpos(key, "_poptmp") != false)
					key = key.substring(0, this.strpos(key, "_poptmp"));
				var value = inputs[i].value;
				if (inputs[i].type == 'radio') {
					if (inputs[i].checked == true)
						response[key] = value;
				}
				else if (inputs[i].type == 'number') {
					response[key] = parseFloat(value);
				}
				else if (inputs[i].type == 'checkbox') {
					if (inputs[i].checked == true)
						response[key] = true;
					else
						response[key] = false;
				}
				else if (inputs[i].type == 'range') {
					response[key] = parseFloat(value);
				}
				else {
					response[key] = value;
				}

			}
		}
		var selects = document.getElementsByTagName('select');
		for (var i = 0; i < selects.length; i++) {
			if (selects[i].id.substr(0, 9) == 'pop_data_') {
				var key = selects[i].id.substr(9);
				var value = selects[i].value;
				response[key] = value;
			}
		}
		var textareas = document.getElementsByTagName('textarea');
		for (var i = 0; i < textareas.length; i++) {
			if (textareas[i].id.substr(0, 9) == 'pop_data_') {
				var key = textareas[i].id.substr(9);
				var value = textareas[i].value;
				response[key] = value;
			}
		}

		return response;
	}

	/**
	 * show popup window.
	 * used strings: "Ok", "Cancel", "Preview"
	 */
	show_action() {
		this.id = this.getRandomInt(0, 999999999);
		if (this.active == true) {
			this.hide();
			return false;
		}
		this.active = true;

		//build content
		var html_pretitle_area = this.render_effect_browser();
		var html_preview_content = '';
		var html_params = '';


		//preview area
		if (this.preview !== false) {
			html_preview_content += '<div style="margin-top:10px;margin-bottom:15px;">';
			html_preview_content += '<canvas style="position:relative;float:left;margin:0 5px 5px 0;border:1px solid #393939;" width="' + this.width_mini + '" height="' + this.height_mini + '" id="pop_pre"></canvas>';
			html_preview_content += '<div id="canvas_preview_container">';
			html_preview_content += '	<canvas style="position:absolute;border:1px solid #393939;background-color:#ffffff;" width="' + this.width_mini + '" height="' + this.height_mini + '" id="pop_post_back"></canvas>';
			html_preview_content += '	<canvas style="position:relative;border:1px solid #393939;" width="' + this.width_mini + '" height="' + this.height_mini + '" id="pop_post"></canvas>';
			html_preview_content += '</div>';
			html_preview_content += '</div>';
		}

		//generate params
		html_params += this.generateParamsHtml();

		document.getElementById("popup").innerHTML = template;
		document.getElementById("pretitle_area").innerHTML = html_pretitle_area;
		document.getElementById("popup_title").innerHTML = this.title;
		document.getElementById("popup_comment").innerHTML = this.comment;
		document.getElementById("preview_content").innerHTML = html_preview_content;
		document.getElementById("params_content").innerHTML = html_params;
		if (this.onfinish != false) {
			document.getElementById("popup_cancel").style.display = '';
		}
		else {
			document.getElementById("popup_cancel").style.display = 'none';
		}

		document.getElementById("popup").style.display = "block";
		document.getElementById("popup").className = this.className;

		//events
		var _this = this;
		document.getElementById('popup_ok').addEventListener('click', function (event) {
			_this.save();
		});
		document.getElementById('popup_cancel').addEventListener('click', function (event) {
			_this.hide(false);
		});
		document.getElementById('popup_close').addEventListener('click', function (event) {
			_this.hide(false);
		});
		var targets = document.querySelectorAll('#popup input');
		for (var i = 0; i < targets.length; i++) {
			targets[i].addEventListener('keyup', function (event) {
				_this.onkeyup(event);
			});
		}

		//onload
		if (this.onload) {
			var params = this.get_params();
			this.onload(params);
		}

		//some events for effects browser
		this.add_effects_browser_events();

		//load preview
		if (this.preview !== false) {
			//get canvas from layer
			var canvas = this.Base_layers.convert_layer_to_canvas();

			//draw original image
			var canvas_left = document.getElementById("pop_pre");
			var pop_pre = canvas_left.getContext("2d");
			pop_pre.clearRect(0, 0, this.width_mini, this.height_mini);
			pop_pre.rect(0, 0, this.width_mini, this.height_mini);
			pop_pre.fillStyle = "#ffffff";
			pop_pre.fill();
			this.draw_background(pop_pre, this.width_mini, this.height_mini, 10);

			pop_pre.scale(this.width_mini / canvas.width, this.height_mini / canvas.height);
			pop_pre.drawImage(canvas, 0, 0);
			pop_pre.scale(1, 1);

			//prepare temp canvas for faster repaint
			this.layer_active_small.width = POP.width_mini;
			this.layer_active_small.height = POP.height_mini;
			this.layer_active_small_ctx.scale(this.width_mini / canvas.width, this.height_mini / canvas.height);
			this.layer_active_small_ctx.drawImage(canvas, 0, 0);
			this.layer_active_small_ctx.scale(1, 1);

			//draw right background
			var canvas_right_back = document.getElementById("pop_post_back").getContext("2d");
			this.draw_background(canvas_right_back, this.width_mini, this.height_mini, 10);

			//copy to right side
			var canvas_right = document.getElementById("pop_post").getContext("2d");
			canvas_right.clearRect(0, 0, this.width_mini, this.height_mini);
			canvas_right.drawImage(canvas_left, 0, 0, this.width_mini, this.height_mini);

			//prepare temp canvas
			this.preview_handler();
		}

		//call translation again to translate popup
		this.Help_translate.translate(app_config.LANG);
	}

	generateParamsHtml() {
		var html = '<table style="width:99%;">';
		for (var i in this.parameters) {
			var parameter = this.parameters[i];

			html += '<tr id="popup-tr-' + this.parameters[i].name + '">';
			if (title != 'Error' && parameter.title != undefined)
				html += '<th class="trn">' + parameter.title + '</th>';
			if (parameter.name != undefined) {
				if (parameter.values != undefined) {
					if (parameter.values.length > 10 || parameter.type == 'select') {
						//drop down
						html += '<td colspan="2"><select onchange="POP.onChangeEvent();" style="font-size:12px;" id="pop_data_' + parameter.name + '">';
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

							var title = parameter.values[j];
							var parts = parameter.values[j].split(" - ");
							if (parts.length > 1) {
								title = parts[0] + ' - <span class="trn">' + parts[1] + '</span>';
							}

							html += '<input type="radio" onchange="POP.onChangeEvent();" ' + ch + ' name="' + parameter.name + '" id="pop_data_' + parameter.name + "_poptmp" + j + '" value="' + parameter.values[j] + '">';
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
						html += '<td><input type="range" name="' + parameter.name + '" id="pop_data_' + parameter.name + '" value="' + parameter.value + '" min="' + parameter.range[0] + '" max="' + parameter.range[1] + '" step="' + step + '" oninput="document.getElementById(\'pv' + i + '\').innerHTML=Math.round(this.value*100)/100;POP.preview_handler();" onchange="POP.onChangeEvent();" /></td>';
						html += '<td style="padding-left:10px;width:50px;" id="pv' + i + '">' + parameter.value + '</td>';
					}
					else if (parameter.type == 'color') {
						//color
						html += '<td><input type="color" id="pop_data_' + parameter.name + '" value="' + parameter.value + '" onchange="POP.onChangeEvent();" /></td>';
					}
					else if (typeof parameter.value == 'boolean') {
						var checked = '';
						if (parameter.value === true)
							checked = 'checked';
						html += '<td class="checkbox"><input type="checkbox" id="pop_data_' + parameter.name + '" ' + checked + ' onclick="POP.onChangeEvent();" > <label class="trn" for="pop_data_' + parameter.name + '">Toggle</label></td>';
					}
					else {
						//input or textarea
						if (parameter.placeholder == undefined)
							parameter.placeholder = '';
						if (parameter.type == 'textarea') {
							html += '<td><textarea rows="10" id="pop_data_' + parameter.name + '" onchange="POP.onChangeEvent();" placeholder="' + parameter.placeholder + '">' + parameter.value + '</textarea></td>';
						}
						else {
							var input_type = "text";
							if (parameter.placeholder != undefined && parameter.placeholder != '' && !isNaN(parameter.placeholder))
								input_type = 'number';
							if (parameter.value != undefined && typeof parameter.value == 'number')
								input_type = 'number';

							html += '<td colspan="2"><input type="' + input_type + '" id="pop_data_' + parameter.name + '" onchange="POP.onChangeEvent();" value="' + parameter.value + '" placeholder="' + parameter.placeholder + '" /></td>';
						}
					}
				}
			}
			else if (parameter.function != undefined) {
				//custom function
				var result;
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
				var str = "" + parameter.value;
				var id_tmp = parameter.title.toLowerCase().replace(/[^\w]+/g, '').replace(/ +/g, '-');
				id_tmp = id_tmp.substring(0, 10);
				if (str.length < 40)
					html += '<td colspan="2"><div class="trn" id="pop_data_' + id_tmp + '" style="padding: 2px 0px;">' + parameter.value + '</div></td>';
				else
					html += '<td style="font-size:11px;" colspan="2"><textarea disabled="disabled">' + parameter.value + '</textarea></td>';
			}
			html += '</tr>';
		}
		html += '</table>';

		return html;
	}

	//validate input field, unless browser supports input=range
	validate(field) {
		for (var i in this.parameters) {
			var parameter = this.parameters[i];
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
	}

	//on key press inside input text
	onkeyup(event) {
		if (event.keyCode == "13") {
			//Enter was pressed
			this.save();
		}
	}

	get_dimensions() {
		var theWidth, theHeight;
		if (window.innerWidth) {
			theWidth = window.innerWidth;
		}
		else if (document.documentElement && document.documentElement.clientWidth) {
			theWidth = document.documentElement.clientWidth;
		}
		else if (document.body) {
			theWidth = document.body.clientWidth;
		}
		if (window.innerHeight) {
			theHeight = window.innerHeight;
		}
		else if (document.documentElement && document.documentElement.clientHeight) {
			theHeight = document.documentElement.clientHeight;
		}
		else if (document.body) {
			theHeight = document.body.clientHeight;
		}
		return [theWidth, theHeight];
	}

	getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	strpos(haystack, needle, offset) {
		var i = (haystack + '').indexOf(needle, (offset || 0));
		return i === -1 ? false : i;
	}

	draw_background(canvas, W, H, gap, force) {
		if (app_config.TRANSPARENCY == false && force == undefined) {
			canvas.beginPath();
			canvas.rect(0, 0, W, H);
			canvas.fillStyle = "#ffffff";
			canvas.fill();
			return false;
		}
		if (gap == undefined)
			gap = 10;
		var fill = true;
		for (var i = 0; i < W; i = i + gap) {
			if (i % (gap * 2) == 0)
				fill = true;
			else
				fill = false;
			for (var j = 0; j < H; j = j + gap) {
				if (fill == true) {
					canvas.fillStyle = '#eeeeee';
					canvas.fillRect(i, j, gap, gap);
					fill = false;
				}
				else
					fill = true;
			}
		}
	}

	ucfirst(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	get_effects_list() {
		var list = [];

		for (var i in this.Base_gui.modules) {
			if (i.indexOf("effects") == -1 || i.indexOf("abstract") > -1)
				continue;

			list[i] = this.Base_gui.modules[i];
		}

		return list;
	}

	render_effect_browser() {
		if (this.effects == false)
			return '';

		var html = '';
		var filters_config = this.get_effects_list();
		var breaking = false;
		this.ef_index = null;
		this.ef_next_index = null;
		this.ef_prev_index = null;
		for (var key in filters_config) {
			if (breaking == true) {
				this.ef_next_index = key;
				break;
			}
			var title = this.get_filter_title(key);
			if (title.toLowerCase() == this.title.toLowerCase()) {
				this.ef_index = key;
				breaking = true;
				continue;
			}
			this.ef_prev_index = key;
		}

		html += '<span style="float:right;">';
		html += '<input id="previous_filter" type="button" value="&lt;"> ';
		html += '<select id="effect_browser">';
		html += '<option class="trn" value="">--- Select effect ---</option>';
		for (var key in filters_config) {
			var title = this.get_filter_title(key);
			title = this.ucfirst(title);
			var selected = '';
			if (title.toLowerCase() == this.title.toLowerCase())
				var selected = 'selected';
			html += ' <option ' + selected + ' value="' + key + '">' + title + '</option>';
		}
		html += '</select>';
		html += ' <input id="next_filter" onclick="" type="button" value="&gt;"> ';
		html += '</span>';

		return html;
	}

	add_effects_browser_events() {
		if (this.effects == false)
			return;

		var _this = this;
		var filters_config = this.get_effects_list();
		var prev_index = this.ef_prev_index;
		var next_index = this.ef_next_index;

		document.getElementById('previous_filter').disabled = false;
		document.getElementById('next_filter').disabled = false;
		if (prev_index == null) {
			document.getElementById('previous_filter').disabled = true;
		}
		if (next_index == null) {
			document.getElementById('next_filter').disabled = true;
		}
		//previous
		document.getElementById('previous_filter').addEventListener('click', function (event) {
			_this.hide(false);
			var function_name = prev_index.toLowerCase().replace(/ /g, '_').replace('effects/', '');
			filters_config[prev_index][function_name]();
		});
		//next
		document.getElementById('next_filter').addEventListener('click', function (event) {
			_this.hide(false);
			var function_name = next_index.toLowerCase().replace(/ /g, '_').replace('effects/', '');
			filters_config[next_index][function_name]();
		});
		//onchange
		var effect_browser = document.getElementById('effect_browser');
		effect_browser.addEventListener('change', function (event) {
			_this.hide(false);
			var value = effect_browser.options[effect_browser.selectedIndex].value;
			var function_name = value.toLowerCase().replace(/ /g, '_').replace('effects/', '');
			filters_config[value][function_name]();
		});
	}

	get_filter_title(key) {
		var title = key.replace('effects/', '').replace(/_/g, ' ');

		//exceptions
		if (title == 'negative')
			title = 'invert';

		return title;
	}
}

export default Dialog_class;