/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import app from './../../app.js';
import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Text_class from './../../tools/text.js';
import Base_layers_class from "../base-layers";
import Tools_settings_class from './../../modules/tools/settings.js';
import Helper_class from './../../libs/helpers.js';
import Tools_translate_class from './../../modules/tools/translate.js';

var template = `
	<div class="row">
		<span class="trn label">X</span>
		<input type="number" id="detail_x" step="any" />
		<button class="extra reset trn" type="button" id="reset_x" title="Reset">Reset</button>
	</div>
	<div class="row">
		<span class="trn label">Y:</span>
		<input type="number" id="detail_y" step="any" />
		<button class="extra reset trn" type="button" id="reset_y" title="Reset">Reset</button>
	</div>
	<div class="row">
		<span class="trn label">Width:</span>
		<input type="number" id="detail_width" step="any" />
		<button class="extra reset trn" type="button" id="reset_size" title="Reset">Reset</button>
	</div>
	<div class="row">
		<span class="trn label">Height:</span>
		<input type="number" id="detail_height" step="any" />
	</div>
	<hr />
	<div class="row">
		<span class="trn label">Rotate:</span>
		<input type="number" min="-360" max="360" id="detail_rotate" />
		<button class="extra reset trn" type="button" id="reset_rotate" title="Reset">Reset</button>
	</div>
	<div class="row">
		<span class="trn label">Opacity:</span>
		<input type="number" min="0" max="100" id="detail_opacity" />
		<button class="extra reset trn" type="button" id="reset_opacity" title="Reset">Reset</button>
	</div>
	<div class="row">
		<span class="trn label">Color:</span>
		<input style="padding: 0px;" type="color" id="detail_color" />
	</div>
	<div id="parameters_container"></div>
	<div id="text_detail_params">
		<div class="row center">
			<span class="trn label">&nbsp;</span>
			<button type="button" class="trn dots" id="detail_param_text">Edit text...</button>
		</div>
		<div class="row">
			<span class="trn label" title="Resize Boundary">Bounds:</span>
			<select id="detail_param_boundary">
				<option value="box">Box</option>
				<option value="dynamic">Dynamic</option>
			</select>
		</div>
		<div class="row">
			<span class="trn label" title="Auto Kerning">Kerning:</span>
			<select id="detail_param_kerning">
				<option value="none">None</option>
				<option value="metrics">Metrics</option>
			</select>
		</div>
		<div class="row" hidden> <!-- Future implementation -->
			<span class="trn label">Direction:</span>
			<select id="detail_param_text_direction">
				<option value="ltr">Left to Right</option>
				<option value="rtl">Right to Left</option>
				<option value="ttb">Top to Bottom</option>
				<option value="btt">Bottom to Top</option>
			</select>
		</div>
		<div class="row" hidden> <!-- Future implementation -->
			<span class="trn label">Wrap:</span>
			<select id="detail_param_wrap_direction">
				<option value="ltr">Left to Right</option>
				<option value="rtl">Right to Left</option>
				<option value="ttb">Top to Bottom</option>
				<option value="btt">Bottom to Top</option>
			</select>
		</div>
		<div class="row">
			<span class="trn label">Wrap At:</span>
			<select id="detail_param_wrap">
				<option value="letter">Word + Letter</option>
				<option value="word">Word</option>
			</select>
		</div>
		<div class="row">
			<span class="trn label" title="Horizontal Alignment">H. Align:</span>
			<select id="detail_param_halign">
				<option value="left">Left</option>
				<option value="center">Center</option>
				<option value="right">Right</option>
			</select>
		</div>
		<div class="row" hidden> <!-- Future implementation -->
			<span class="trn label" title="Vertical Alignment">V. Align:</span>
			<select id="detail_param_valign">
				<option value="top">Top</option>
				<option value="middle">Middle</option>
				<option value="bottom">Bottom</option>
			</select>
		</div>
	<div>
`;

/**
 * GUI class responsible for rendering selected layer details block on right sidebar
 */
class GUI_details_class {

	constructor() {
		this.POP = new Dialog_class();
		this.Text = new Text_class();
		this.Base_layers = new Base_layers_class();
		this.Tools_settings = new Tools_settings_class();
		this.Helper = new Helper_class();
		this.layer_details_active = false;
		this.Tools_translate = new Tools_translate_class();
	}

	render_main_details() {
		document.getElementById('toggle_details').innerHTML = template;
		if (config.LANG != 'en') {
			this.Tools_translate.translate(config.LANG, document.getElementById('toggle_details'));
		}
		this.render_details(true);
	}

	render_details(events = false) {
		this.render_general('x', events);
		this.render_general('y', events);
		this.render_general('width', events);
		this.render_general('height', events);

		this.render_general('rotate', events);
		this.render_general('opacity', events);
		this.render_color(events);
		this.render_reset(events);

		//text - special case
		if (config.layer != undefined && config.layer.type == 'text') {
			document.getElementById('text_detail_params').style.display = 'block';
			document.getElementById('detail_color').closest('.row').style.display = 'none';
		}
		else{
			document.getElementById('text_detail_params').style.display = 'none';

			if (config.layer != undefined && (config.layer.color === null || config.layer.type == 'image')) {
				//hide color
				document.getElementById('detail_color').closest('.row').style.display = 'none';
			}
			else {
				//show color
				document.getElementById('detail_color').closest('.row').style.display = 'block';
			}
		}

		//add params
		this.render_more_parameters();

		this.render_text(events);
		this.render_general_select_param('boundary', events);
		this.render_general_select_param('kerning', events);
		this.render_general_select_param('text_direction', events);
		this.render_general_select_param('wrap', events);
		this.render_general_select_param('wrap_direction', events);
		this.render_general_select_param('halign', events);
		this.render_general_select_param('valign', events);
	}

	render_general(key, events) {
		var layer = config.layer;
		var _this = this;
		var units = this.Tools_settings.get_setting('default_units');
		var resolution = this.Tools_settings.get_setting('resolution');

		if (layer != undefined) {
			var target = document.getElementById('detail_' + key);
			target.dataset.layer = layer.id;
			if (layer[key] == null) {
				target.value = '';
				target.disabled = true;
			}
			else {
				var value = layer[key];

				if(key == 'x' || key == 'y' || key == 'width' || key == 'height'){
					//convert units
					value = this.Helper.get_user_unit(value, units, resolution);
				}
				else {
					value = Math.round(value);
				}

				//set
				target.value = value;
				target.disabled = false;
			}
		}

		if (events) {
			//events
			var target = document.getElementById('detail_' + key);
			if(target == undefined){
				console.log('Error: missing details event target ' + 'detail_' + key);
				return;
			}
			let focus_value = null;
			target.addEventListener('focus', function (e) {
				focus_value = parseFloat(this.value);
			});
			target.addEventListener('blur', function (e) {
				if(key == 'x' || key == 'y' || key == 'width' || key == 'height'){
					//convert units
					var value = _this.Helper.get_internal_unit(this.value, units, resolution);
				}
				else {
					var value = parseInt(this.value);
				}
				var layer = _this.Base_layers.get_layer(e.target.dataset.layer);
				layer[key] = focus_value;
				if (focus_value !== value) {
					app.State.do_action(
						new app.Actions.Bundle_action('change_layer_details', 'Change Layer Details', [
							new app.Actions.Update_layer_action(layer.id, {
								[key]: value
							})
						])
					);
				}
			});
			target.addEventListener('change', function (e) {
				if(key == 'x' || key == 'y' || key == 'width' || key == 'height'){
					//convert units
					var value = _this.Helper.get_internal_unit(this.value, units, resolution);
				}
				else {
					var value = parseInt(this.value);
				}
				
				if(this.min != undefined && this.min != '' && value < this.min){
					document.getElementById('detail_opacity').value = value;
					value = this.min;
				}
				if(this.max != undefined && this.min != '' && value > this.max){
					document.getElementById('detail_opacity').value = value;
					value = this.max;
				}
				
				config.layer[key] = value;
				config.need_render = true;
			});
			target.addEventListener('keyup', function (e) {
				//for edge....
				if (e.keyCode != 13) {
					return;
				}

				if(key == 'x' || key == 'y' || key == 'width' || key == 'height'){
					//convert units
					var value = _this.Helper.get_internal_unit(this.value, units, resolution);
				}
				else {
					var value = parseInt(this.value);
				}
				
				if(this.min != undefined && this.min != '' && value < this.min){
					document.getElementById('detail_opacity').value = value;
					value = this.min;
				}
				if(this.max != undefined && this.min != '' && value > this.max){
					document.getElementById('detail_opacity').value = value;
					value = this.max;
				}
				
				config.layer[key] = value;
				config.need_render = true;
			});
		}
	}

	render_general_param(key, events) {
		var layer = config.layer;

		if (layer != undefined) {
			var target = document.getElementById('detail_param_' + key);
			if (layer.params[key] == null) {
				target.value = '';
				target.disabled = true;
			}
			else {
				if (typeof layer.params[key] == 'boolean') {
					//boolean
					if(target.tagName == 'BUTTON'){
						if(layer.params[key]){
							target.classList.add('active');
						}
						else{
							target.classList.remove('active');
						}
					}
				}
				else {
					//common
					target.value = layer.params[key];
				}
				target.disabled = false;
			}
		}

		if (events) {
			//events
			var target = document.getElementById('detail_param_' + key);
			let focus_value = null;
			target.addEventListener('focus', function (e) {
				focus_value = parseInt(this.value);
			});
			target.addEventListener('blur', function (e) {
				var value = parseInt(this.value);
				config.layer.params[key] = focus_value;
				let params_copy = JSON.parse(JSON.stringify(config.layer.params));
				params_copy[key] = value;
				if (focus_value !== value) {
					app.State.do_action(
						new app.Actions.Bundle_action('change_layer_details', 'Change Layer Details', [
							new app.Actions.Update_layer_action(config.layer.id, {
								params: params_copy
							})
						])
					);
				}
			});
			target.addEventListener('change', function (e) {
				var value = parseInt(this.value);
				config.layer.params[key] = value;
				config.need_render = true;
				config.need_render_changed_params = true;

			});
			target.addEventListener('click', function (e) {
				if (typeof config.layer.params[key] != 'boolean')
					return;
				this.classList.toggle('active');
				config.layer.params[key] = !config.layer.params[key];
				config.need_render = true;
				config.need_render_changed_params = true;
			});
		}
	}

	render_general_select_param(key, events){
		var layer = config.layer;

		if (layer != undefined) {
			var target = document.getElementById('detail_param_' + key);

			if (layer.params[key] == null) {
				target.value = '';
				target.disabled = true;
			}
			else {
				if(typeof layer.params[key] == 'object')
					target.value = layer.params[key].value; //legacy
				else
					target.value = layer.params[key];
				target.disabled = false;
			}
		}

		if (events) {
			//events
			var target = document.getElementById('detail_param_' + key);
			let focus_value = null;
			target.addEventListener('focus', function (e) {
				focus_value = this.value;
			});
			target.addEventListener('blur', function (e) {
				var value = this.value;
				config.layer.params[key] = focus_value;
				let params_copy = JSON.parse(JSON.stringify(config.layer.params));
				params_copy[key] = value;
				if (focus_value !== value) {
					app.State.do_action(
						new app.Actions.Bundle_action('change_layer_details', 'Change Layer Details', [
							new app.Actions.Update_layer_action(config.layer.id, {
								params: params_copy
							})
						])
					);
				}
			});
			target.addEventListener('change', function (e) {
				var value = this.value;
				config.layer.params[key] = value;
				config.need_render = true;
				config.need_render_changed_params = true;
			});
		}
	}

	/**
	 * item: color
	 */
	render_color(events) {
		var layer = config.layer;

		let $colorInput;
		if (events) {
			$colorInput = $(document.getElementById('detail_color')).uiColorInput();
		} else {
			$colorInput = $(document.getElementById('detail_color'));
		}

		if (layer != undefined) {
			$colorInput.uiColorInput('set_value', layer.color);
		}

		if (events) {
			//events
			let focus_value = null;
			$colorInput.on('focus', function (e) {
				focus_value = $colorInput.uiColorInput('get_value');
			});
			$colorInput.on('change', function (e) {
				const value = $colorInput.uiColorInput('get_value');
				config.layer.color = focus_value;
				if (focus_value !== value) {
					app.State.do_action(
						new app.Actions.Bundle_action('change_layer_details', 'Change Layer Details', [
							new app.Actions.Update_layer_action(config.layer.id, {
								color: value
							})
						])
					);
				}
			});
		}
	}

	/**
	 * item: size reset button
	 */
	render_reset(events) {
		var layer = config.layer;

		if (layer != undefined) {
			//size
			if (layer.width_original != null) {
				document.getElementById('reset_size').classList.remove('hidden');
			}
			else {
				document.getElementById('reset_size').classList.add('hidden');
			}
		}

		if (events) {
			//events
			document.getElementById('reset_x').addEventListener('click', function (e) {
				if (config.layer.x) {
					app.State.do_action(
						new app.Actions.Bundle_action('change_layer_details', 'Change Layer Details', [
							new app.Actions.Update_layer_action(config.layer.id, {
								x: 0
							})
						])
					);
				}
			});
			document.getElementById('reset_y').addEventListener('click', function (e) {
				if (config.layer.y) {
					app.State.do_action(
						new app.Actions.Bundle_action('change_layer_details', 'Change Layer Details', [
							new app.Actions.Update_layer_action(config.layer.id, {
								y: 0
							})
						])
					);
				}
			});
			document.getElementById('reset_size').addEventListener('click', function (e) {
				if (config.layer.width !== config.layer.width_original
					|| config.layer.height !== config.layer.height_original) {
					app.State.do_action(
						new app.Actions.Bundle_action('change_layer_details', 'Change Layer Details', [
							new app.Actions.Update_layer_action(config.layer.id, {
								width: config.layer.width_original,
								height: config.layer.height_original
							})
						])
					);
				}
			});
			document.getElementById('reset_rotate').addEventListener('click', function (e) {
				if (config.layer.rotate) {
					app.State.do_action(
						new app.Actions.Bundle_action('change_layer_details', 'Change Layer Details', [
							new app.Actions.Update_layer_action(config.layer.id, {
								rotate: 0
							})
						])
					);
				}
			});
			document.getElementById('reset_opacity').addEventListener('click', function (e) {
				if (config.layer.opacity != 100) {
					app.State.do_action(
						new app.Actions.Bundle_action('change_layer_details', 'Change Layer Details', [
							new app.Actions.Update_layer_action(config.layer.id, {
								opacity: 100
							})
						])
					);
				}
			});
		}
	}

	/**
	 * item: text
	 */
	render_text(events) {
		if (events) {
			//events
			document.getElementById('detail_param_text').addEventListener('click', function (e) {
				document.querySelector('#tools_container #text').click();
				document.getElementById('text_tool_keyboard_input').focus();
				config.need_render = true;
			});
		}
	}

	render_more_parameters() {
		var _this = this;
		var target_id = "parameters_container";
		const itemContainer = document.getElementById(target_id);

		if(this.layer_details_active == true){
			return;
		}

		itemContainer.innerHTML = "";

		if(!config.layer || typeof config.layer.params == 'undefined' || config.layer.type == 'text') {
			return;
		}

		//find layer parameters settings
		var params_config = null;
		for (var i in config.TOOLS) {
			if (config.TOOLS[i].name == config.layer.type) {
				params_config =  config.TOOLS[i];
			}
		}
		if(params_config == null){
			return;
		}

		for (var k in params_config.attributes) {
			var item = params_config.attributes[k];

			//hide some fields, in future name should start with underscore
			if(params_config.name == 'rectangle' && k == 'square'
				|| params_config.name == 'ellipse' && k == 'circle'
				|| params_config.name == 'pencil' && k == 'pressure'
				|| params_config.name == 'pencil' && k == 'size'){
				continue;
			}

			//row
			let item_row = document.createElement('div');
			item_row.className = 'row';
			itemContainer.appendChild(item_row);

			//title
			var title = k[0].toUpperCase() + k.slice(1);
			title = title.replace("_", " ");
			let item_title = document.createElement('span');
			item_title.className = 'trn label';
			item_title.innerHTML = title;
			item_row.appendChild(item_title);

			//value
			if (typeof item == 'boolean' || (typeof item == 'object' && typeof item.value == 'boolean')) {
				//boolean - true, false

				const elementInput = document.createElement('button');
				elementInput.type = 'button';
				elementInput.className = 'trn ui_toggle_button';
				elementInput.innerHTML = title;

				elementInput.dataset.key = k;
				item_row.appendChild(elementInput);

				let value = config.layer.params[k];
				elementInput.setAttribute('aria-pressed', value);

				//events
				elementInput.addEventListener('click', function (e) {
					//on leave
					let layer = config.layer;
					let key = this.dataset.key;
					let new_value = elementInput.getAttribute('aria-pressed') !== 'true';
					let params = JSON.parse(JSON.stringify(config.layer.params));
					params[key] = new_value;

					app.State.do_action(
						new app.Actions.Update_layer_action(layer.id, {
							params: params
						})
					);
				});
			}
			else if (typeof item == 'number' || (typeof item == 'object' && typeof item.value == 'number')) {
				//numbers

				const elementInput = document.createElement('input');
				elementInput.type = 'number';
				elementInput.dataset.key = k;
				item_row.appendChild(elementInput);

				let min = 1;
				let max = k === 'power' ? 100 : 999;
				let step = null;
				let value = config.layer.params[k];
				if (typeof item == 'object') {
					value = item.value;
					if (item.min != null) {
						min = item.min;
					}
					if (item.max != null) {
						max = item.max;
					}
					if (item.step != null) {
						step = item.step;
					}
				}
				elementInput.setAttribute('min', min);
				elementInput.setAttribute('max', max);
				if (item.step != null) {
					elementInput.setAttribute('step', step);
				}
				elementInput.setAttribute('value', config.layer.params[k]);

				//events
				let focus_value = null;
				elementInput.addEventListener('focus', function (e) {
					focus_value = parseFloat(this.value);
					_this.layer_details_active = true;
				});
				elementInput.addEventListener('blur', function (e) {
					//on leave
					_this.layer_details_active = false;
					let layer = config.layer;
					let key = this.dataset.key;
					let new_value = parseInt(this.value);
					let params = JSON.parse(JSON.stringify(config.layer.params));
					params[key] = new_value;

					if (focus_value !== new_value) {
						app.State.do_action(
							new app.Actions.Update_layer_action(layer.id, {
								params: params
							})
						);
					}
				});
				elementInput.addEventListener('change', function (e) {
					//on change - lots of events here in short time
					let key = this.dataset.key;
					let new_value = parseInt(this.value);

					config.layer.params[key] = new_value;
					config.need_render = true;
				});
			}
			else if (typeof item == 'string' && item[0] == '#') {
				//color

				var elementInput = document.createElement('input');
				elementInput.type = 'color';
				let focus_value = null;
				const $colorInput = $(elementInput).uiColorInput({
						id: k,
						value: item
					})
					.on('change', () => {
						let layer = config.layer;
						let key = $colorInput.uiColorInput('get_id');
						let new_value = $colorInput.uiColorInput('get_value');
						let params = JSON.parse(JSON.stringify(config.layer.params));
						params[key] = new_value;

						app.State.do_action(
							new app.Actions.Update_layer_action(layer.id, {
								params: params
							})
						);
					});
				$colorInput.uiColorInput('set_value', config.layer.params[k]);

				item_row.appendChild($colorInput[0]);
			}
			else {
				alertify.error('Error: unsupported attribute type:' + typeof item + ', ' + k);
			}
		}
	}

}

export default GUI_details_class;
