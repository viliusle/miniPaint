/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';
import Text_class from './../../tools/text.js';

var template = `
	<div class="row">
		<span class="trn label">X</span>
		<input type="number" id="detail_x" />
		<button class="extra reset" type="button" id="reset_x" title="Reset">Reset</button>
	</div>
	<div class="row">
		<span class="trn label">Y:</span>
		<input type="number" id="detail_y" />
		<button class="extra reset" type="button" id="reset_y" title="Reset">Reset</button>
	</div>
	<div class="row">
		<span class="trn label">Width:</span>
		<input type="number" id="detail_width" />
		<button class="extra reset" type="button" id="reset_size" title="Reset">Reset</button>
	</div>
	<div class="row">
		<span class="trn label">Height:</span>
		<input type="number" id="detail_height" />
	</div>
	<hr />
	<div class="row">
		<span class="trn label">Rotate:</span>
		<input type="number" min="-360" max="360" id="detail_rotate" />
	</div>
	<div class="row">
		<span class="trn label">Opacity:</span>
		<input type="number" min="0" max="100" id="detail_opacity" />
	</div>
	<div class="row">
		<span class="trn label">Color:</span>
		<input style="padding: 0px;" type="color" id="detail_color" />
	</div>
	<div id="params_details">
		<hr />
		<div class="row">
			<button type="button" class="" id="detail_param_text">Edit text...</button>
			<button type="button" class="" id="detail_param_bold">Bold</button>
			<button type="button" class="" id="detail_param_italic">Italic</button>
			<button type="button" class="" id="detail_param_stroke">Stroke</button>
		</div>
		<div class="row">
			<span class="trn label">Size:</span>
			<input type="number" min="1" id="detail_param_size" />
		</div>
		<div class="row">
			<span class="trn label">Align:</span>
			<select id="detail_param_align">
				<option value="Left">Left</option>
				<option value="Center">Center</option>
				<option value="Right">Right</option>
			</select>
		</div>
		<div class="row">
			<span class="trn label">Font:</span>
			<select id="detail_param_family"></select>
		</div>
		<div class="row">
			<span class="trn label">Stroke:</span>
			<input type="number" min="0" id="detail_param_stroke_size" />
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
	}

	render_main_details() {
		document.getElementById('toggle_details').innerHTML = template;

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
			document.getElementById('params_details').style.display = 'block';
		}
		else {
			document.getElementById('params_details').style.display = 'none';
		}
		this.render_text(events);
		this.render_general_param('size', events);
		this.render_general_param('bold', events);
		this.render_general_param('italic', events);
		this.render_general_param('stroke', events);
		this.render_general_param('stroke_size', events);
		this.render_general_select_param('align', events);
		this.render_general_select_param('family', events);
	}

	render_general(key, events) {
		var layer = config.layer;

		if (layer != undefined) {
			var target = document.getElementById('detail_' + key);
			if (layer[key] == null) {
				target.value = '';
				target.disabled = true;
			}
			else {
				target.value = Math.round(layer[key]);
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
			target.addEventListener('change', function (e) {
				var value = parseInt(this.value);
				
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
				if (e.keyCode != 13) 
					return;
				var value = parseInt(this.value);
				
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
			document.getElementById('detail_param_' + key).addEventListener('change', function (e) {
				var value = parseInt(this.value);
				config.layer.params[key] = value;
				config.need_render = true;
			});
			document.getElementById('detail_param_' + key).addEventListener('click', function (e) {
				if (typeof config.layer.params[key] != 'boolean')
					return;
				this.classList.toggle('active');
				config.layer.params[key] = !config.layer.params[key];
				config.need_render = true;
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
			document.getElementById('detail_param_' + key).addEventListener('change', function (e) {
				var value = this.value;
				config.layer.params[key] = value;
				config.need_render = true;
			});
		}
	}

	/**
	 * item: color
	 */
	render_color(events) {
		var layer = config.layer;

		if (layer != undefined) {
			document.getElementById('detail_color').value = layer.color;
		}

		if (events) {
			//events
			document.getElementById('detail_color').addEventListener('change', function (e) {
				var value = this.value;
				config.layer.color = value;
				config.need_render = true;
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
				if(config.layer.x != null)
					config.layer.x = 0;
				config.need_render = true;
			});
			document.getElementById('reset_y').addEventListener('click', function (e) {
				if(config.layer.x != null)
					config.layer.y = 0;
				config.need_render = true;
			});
			document.getElementById('reset_size').addEventListener('click', function (e) {
				config.layer.width = config.layer.width_original;
				config.layer.height = config.layer.height_original;
				config.need_render = true;
			});
		}
	}

	/**
	 * item: text
	 */
	render_text(events) {
		var _this = this;
		var layer = config.layer;

		if (events) {
			//events
			document.getElementById('detail_param_text').addEventListener('click', function (e) {
				var settings = {
					title: 'Edit text',
					params: [
						{name: "text", title: "Text:", value: config.layer.params.text || "", type: "textarea"},
					],
					on_finish: function (params) {
						config.layer.params.text = params.text;
						config.need_render = true;
					},
				};
				_this.POP.show(settings);
			});
			
			//also show font families
			var families = this.Text.get_fonts();
			var select = document.getElementById('detail_param_family');
			for(var i in families){
				var opt = document.createElement('option');
				opt.value = families[i];
				opt.innerHTML = families[i];
				select.appendChild(opt);
			}
		}
	}

}

export default GUI_details_class;
