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
import Base_layers_class from './../core/base-layers.js';
import Base_gui_class from './../core/base-gui.js';
import Tools_translate_class from './../modules/tools/translate.js';

var template = `
	<button type="button" class="close" data-id="popup_close" title="Close">&times;</button>
	<div data-id="pretitle_area"></div>
	<span class="text_muted right" data-id="popup_comment"></span>
	<h2 class="trn" data-id="popup_title"></h2>
	<div class="dialog_content" data-id="dialog_content">
		<div data-id="preview_content"></div>
		<div data-id="params_content"></div>
	</div>
	<div class="buttons">
		<button type="button" data-id="popup_ok" class="button trn">Ok</button>
		<button type="button" data-id="popup_cancel" class="button trn">Cancel</button>
	</div>
`;

class Dialog_class {

	constructor() {
		if (!window.POP) {
			window.POP = this;
		}

		this.previousPOP = null;
		this.el = null;
		this.eventHandles = [];
		this.active = false;
		this.title = null;
		this.onfinish = false;
		this.oncancel = false;
		this.preview = false;
		this.preview_padding = 0;
		this.onload = false;
		this.onchange = false;
		this.width_mini = 225;
		this.height_mini = 200;
		this.id = 0;
		this.parameters = [];
		this.Base_layers = new Base_layers_class();
		this.Base_gui = new Base_gui_class();
		this.Tools_translate = new Tools_translate_class();
		this.last_params_hash = '';
		this.layer_active_small = document.createElement("canvas");
		this.layer_active_small_ctx = this.layer_active_small.getContext("2d");
		this.caller = null;
		this.resize_clicked = {x: null, y: null}
		this.element_offset = {x: null, y: null}
	}

	/**
	 * shows dialog
	 * 
	 * @param {array} config
	 */
	show(config) {
		this.previousPOP = window.POP;
		window.POP = this;

		if (this.active == true) {
			this.hide();
		}

		this.title = config.title || '';
		this.parameters = config.params || [];
		this.onfinish = config.on_finish || false;
		this.oncancel = config.on_cancel || false;
		this.preview = config.preview || false;
		this.preview_padding = config.preview_padding || 0;
		this.onchange = config.on_change || false;
		this.onload = config.on_load || false;
		this.className = config.className || '';
		this.comment = config.comment || '';

		//reset position
		this.el = document.createElement('div');
		this.el.classList = 'popup';
		this.el.role = 'dialog';
		document.querySelector('#popups').appendChild(this.el);
		this.el.style.top = null;
		this.el.style.left = null;

		this.show_action();
		this.set_events();
	}

	/**
	 * hides dialog
	 * 
	 * @param {boolean} success
	 * @returns {undefined}
	 */
	hide(success) {
		window.POP = this.previousPOP;
		var params = this.get_params();

		if (success === false && this.oncancel) {
			this.oncancel(params);
		}
		if (this.el && this.el.parentNode) {
			this.el.parentNode.removeChild(this.el);
		}
		this.parameters = [];
		this.active = false;
		this.preview = false;
		this.preview_padding = 0;
		this.onload = false;
		this.onchange = false;
		this.title = null;
		this.className = '';
		this.comment = '';
		this.onfinish = false;
		this.oncancel = false;

		this.remove_events();
	}

	get_active_instances() {
		return document.getElementById('popups').children.length;
	}

	/* ----------------- private functions ---------------------------------- */

	addEventListener(target, type, listener, options) {
		target.addEventListener(type, listener, options);
		const handle = {
			target, type, listener,
			remove() {
				target.removeEventListener(type, listener);
			}
		};
		this.eventHandles.push(handle);
	}

	set_events() {
		this.addEventListener(document, 'keydown', (event) => {
			var code = event.code;

			if (code == "Escape") {
				//escape
				this.hide(false);
			}
		}, false);

		//register events
		this.addEventListener(document, 'mousedown', (event) => {
			if(event.target != this.el.querySelector('h2'))
				return;
			event.preventDefault();
			this.resize_clicked.x = event.pageX;
			this.resize_clicked.y = event.pageY;

			var target = this.el;
			this.element_offset.x = target.offsetLeft;
			this.element_offset.y = target.offsetTop;
		}, false);

		this.addEventListener(document, 'mousemove', (event) => {
			if(this.resize_clicked.x != null){
				var dx = this.resize_clicked.x - event.pageX;
				var dy = this.resize_clicked.y - event.pageY;

				var target = this.el;
				target.style.left = (this.element_offset.x - dx) + "px";
				target.style.top = (this.element_offset.y - dy) + "px";
			}
		}, false);

		this.addEventListener(document, 'mouseup', (event) => {
			if(event.target != this.el.querySelector('h2'))
				return;
			event.preventDefault();
			this.resize_clicked.x = null;
			this.resize_clicked.y = null;
		}, false);

		this.addEventListener(window, 'resize', (event) => {
			var target = this.el;
			target.style.top = null;
			target.style.left = null;
		}, false);
	}

	remove_events() {
		for (let handle of this.eventHandles) {
			handle.remove();
		}
		this.eventHandles = [];
	}

	onChangeEvent(e) {
		var params = this.get_params();

		var hash = JSON.stringify(params);
		if (this.last_params_hash == hash && this.onchange == false) {
			//nothing changed
			return;
		}
		this.last_params_hash = hash;

		if (this.onchange != false) {
			if (this.preview != false) {
				var canvas_right = this.el.querySelector('[data-id="pop_post"]');
				var ctx_right = canvas_right.getContext("2d");

				ctx_right.clearRect(0, 0, this.width_mini, this.height_mini);
				ctx_right.drawImage(this.layer_active_small,
					this.preview_padding, this.preview_padding,
					this.width_mini - this.preview_padding * 2, this.height_mini - this.preview_padding * 2
				);

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
		if(this.el == undefined){
			return null;
		}
		var inputs = this.el.querySelectorAll('input');
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
		var selects = this.el.querySelectorAll('select');
		for (var i = 0; i < selects.length; i++) {
			if (selects[i].id.substr(0, 9) == 'pop_data_') {
				var key = selects[i].id.substr(9);
				response[key] = selects[i].value;
			}
		}
		var textareas = this.el.querySelectorAll('textarea');
		for (var i = 0; i < textareas.length; i++) {
			if (textareas[i].id.substr(0, 9) == 'pop_data_') {
				var key = textareas[i].id.substr(9);
				response[key] = textareas[i].value;
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
		var html_pretitle_area = '';
		var html_preview_content = '';
		var html_params = '';

		//preview area
		if (this.preview !== false) {
			html_preview_content += '<div class="preview_container">';
			html_preview_content += '<canvas class="preview_canvas_left" width="' + this.width_mini + '" height="'
				+ this.height_mini + '" data-id="pop_pre"></canvas>';
			html_preview_content += '<div class="canvas_preview_container">';
			html_preview_content += '	<canvas class="preview_canvas_post_back" width="' + this.width_mini
				+ '" height="' + this.height_mini + '" data-id="pop_post_back"></canvas>';
			html_preview_content += '	<canvas class="preview_canvas_post" width="' + this.width_mini + '" height="'
				+ this.height_mini + '" data-id="pop_post"></canvas>';
			html_preview_content += '</div>';
			html_preview_content += '</div>';
		}

		//generate params
		html_params += this.generateParamsHtml();

		this.el.innerHTML = template;
		this.el.querySelector('[data-id="pretitle_area"]').innerHTML = html_pretitle_area;
		this.el.querySelector('[data-id="popup_title"]').innerHTML = this.title;
		this.el.querySelector('[data-id="popup_comment"]').innerHTML = this.comment;
		this.el.querySelector('[data-id="preview_content"]').innerHTML = html_preview_content;
		this.el.querySelector('[data-id="params_content"]').innerHTML = html_params;
		if (this.onfinish != false) {
			this.el.querySelector('[data-id="popup_cancel"]').style.display = '';
		}
		else {
			this.el.querySelector('[data-id="popup_cancel"]').style.display = 'none';
		}

		this.el.style.display = "block";
		if (this.className) {
			this.el.classList.add(this.className);
		}

		//replace color inputs
		this.el.querySelectorAll('input[type="color"]').forEach((colorInput) => {
			const id = colorInput.getAttribute('id');
			colorInput.removeAttribute('id');
			$(colorInput)
				.uiColorInput({ inputId: id })
				.on('change', (e) => {
					this.onChangeEvent(e);
				});
		});

		//events
		this.el.querySelector('[data-id="popup_ok"]').addEventListener('click', (event) => {
			this.save();
		});
		this.el.querySelector('[data-id="popup_cancel"]').addEventListener('click', (event) => {
			this.hide(false);
		});
		this.el.querySelector('[data-id="popup_close"]').addEventListener('click', (event) => {
			this.hide(false);
		});
		var targets = this.el.querySelectorAll('input');
		for (var i = 0; i < targets.length; i++) {
			targets[i].addEventListener('keyup', (event) => {
				this.onkeyup(event);
			});
		}

		//onload
		if (this.onload) {
			var params = this.get_params();
			this.onload(params, this);
		}

		//load preview
		if (this.preview !== false) {
			//get canvas from layer
			var canvas = this.Base_layers.convert_layer_to_canvas();

			//draw original image
			var canvas_left = this.el.querySelector('[data-id="pop_pre"]');
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
			var canvas_right_back = this.el.querySelector('[data-id="pop_post_back"]').getContext("2d");
			this.draw_background(canvas_right_back, this.width_mini, this.height_mini, 10);

			//copy to right side
			var canvas_right = this.el.querySelector('[data-id="pop_post"]').getContext("2d");
			canvas_right.clearRect(0, 0, this.width_mini, this.height_mini);
			canvas_right.drawImage(canvas_left,
				this.preview_padding, this.preview_padding,
				this.width_mini - this.preview_padding * 2, this.height_mini - this.preview_padding * 2);

			//prepare temp canvas
			this.preview_handler();
		}

		//call translation again to translate popup
		var lang = this.Base_gui.get_language();
		this.Tools_translate.translate(lang);
	}

	generateParamsHtml() {
		var html = '<table>';
		var title = null;
		for (var i in this.parameters) {
			var parameter = this.parameters[i];

			html += '<tr id="popup-tr-' + this.parameters[i].name + '">';
			if (title != 'Error' && parameter.title != undefined)
				html += '<th class="trn">' + parameter.title + '</th>';
			if (parameter.name != undefined) {
				if (parameter.values != undefined) {
					if (parameter.values.length > 10 || parameter.type == 'select') {
						//drop down
						html += '<td colspan="2"><select onchange="POP.onChangeEvent();" id="pop_data_' + parameter.name
							+ '">';
						var k = 0;
						for (var j in parameter.values) {
							var sel = '';
							if (parameter.value == parameter.values[j])
								sel = 'selected="selected"';
							if (parameter.value == undefined && k == 0)
								sel = 'selected="selected"';
							html += '<option ' + sel + ' name="' + parameter.values[j] + '">' + parameter.values[j]
								+ '</option>';
							k++;
						}
						html += '</select></td>';
					}
					else {
						//radio
						html += '<td class="radios" colspan="2">';
						if (parameter.values.length > 2)
							html += '<div class="group" id="popup-group-' + this.parameters[i].name + '">';
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

							html += '<input type="radio" onchange="POP.onChangeEvent();" ' + ch + ' name="'
								+ parameter.name + '" id="pop_data_' + parameter.name + "_poptmp" + j + '" value="'
								+ parameter.values[j] + '">';
							html += '<label class="trn" for="pop_data_' + parameter.name + "_poptmp" + j + '">' + title
								+ '</label>';
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
						html += '<td><input type="range" name="' + parameter.name + '" id="pop_data_' + parameter.name
							+ '" value="' + parameter.value + '" min="' + parameter.range[0] + '" max="'
							+ parameter.range[1] + '" step="' + step
							+ '" oninput="document.getElementById(\'pv' + i + '\').innerHTML = '
							+ 'Math.round(this.value*100) / 100;POP.preview_handler();" '
							+'onchange="POP.onChangeEvent();" /></td>';
						html += '<td class="range_value" id="pv' + i + '">' + parameter.value + '</td>';
					}
					else if (parameter.type == 'color') {
						//color
						html += '<td><input type="color" id="pop_data_' + parameter.name + '" value="' + parameter.value
							+ '" onchange="POP.onChangeEvent();" /></td>';
					}
					else if (typeof parameter.value == 'boolean') {
						var checked = '';
						if (parameter.value === true)
							checked = 'checked';
						html += '<td class="checkbox"><input type="checkbox" id="pop_data_' + parameter.name + '" '
							+ checked + ' onclick="POP.onChangeEvent();" > <label class="trn" for="pop_data_'
							+ parameter.name + '">Toggle</label></td>';
					}
					else {
						//input or textarea
						if (parameter.placeholder == undefined)
							parameter.placeholder = '';
						if (parameter.type == 'textarea') {
							//textarea
							html += '<td><textarea rows="10" id="pop_data_' + parameter.name
								+ '" onchange="POP.onChangeEvent();" placeholder="' + parameter.placeholder + '" ' + (parameter.prevent_submission ? 'data-prevent-submission=""' : '' ) + '>'
								+ parameter.value + '</textarea></td>';
						}
						else {
							//text or number
							var input_type = "text";
							if (parameter.placeholder != '' && !isNaN(parameter.placeholder))
								input_type = 'number';
							if (parameter.value != undefined && typeof parameter.value == 'number')
								input_type = 'number';

							var comment_html = '';
							if (typeof parameter.comment !== 'undefined') {
								comment_html = '<span class="field_comment trn">' + parameter.comment + '</span>';
							}

							html += '<td colspan="2"><input type="' + input_type + '" id="pop_data_' + parameter.name
								+ '" onchange="POP.onChangeEvent();" value="' + parameter.value + '" placeholder="'
								+ parameter.placeholder + '" ' + (parameter.prevent_submission ? 'data-prevent-submission=""' : '' ) + ' />'+comment_html+'</td>';
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
				html += '<td class="html_value" colspan="2">' + parameter.html + '</td>';
			}
			else if (parameter.title == undefined) {
				//gap
				html += '<td colspan="2"></td>';
			}
			else {
				//locked fields without name
				var str = "" + parameter.value;
				var id_tmp = parameter.title.toLowerCase().replace(/[^\w]+/g, '').replace(/ +/g, '-');
				id_tmp = id_tmp.substring(0, 10);
				if (str.length < 40)
					html += '<td colspan="2"><div class="trn" id="pop_data_' + id_tmp + '">' + parameter.value
						+ '</div></td>';
				else
					html += '<td class="long_text_value" colspan="2"><textarea disabled="disabled">' + parameter.value
						+ '</textarea></td>';
			}
			html += '</tr>';
		}
		html += '</table>';

		return html;
	}

	//on key press inside input text
	onkeyup(event) {
		if (event.key == 'Enter') {
			if (event.target.hasAttribute('data-prevent-submission')) {
				event.preventDefault();
			} else {
				this.save();
			}
		}
	}

	getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	strpos(haystack, needle, offset) {
		var i = (haystack + '').indexOf(needle, (offset || 0));
		return i === -1 ? false : i;
	}

	draw_background(canvas, W, H, gap, force) {
		var transparent = this.Base_gui.get_transparency_support();

		if (transparent == false && force == undefined) {
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

}

export default Dialog_class;