/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../../config.js';
import Helper_class from './../../libs/helpers.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import './../../../../node_modules/spectrum-colorpicker/spectrum.css';
import spectrum from './../../../../node_modules/spectrum-colorpicker/spectrum.js';

var Helper = new Helper_class();

var template = `
		<span class="trn bold hex">Hex:</span>
		<input type="text" class="color_hex" id="color_hex" value="#000000" />
		<br />
		<div class="main_color_rgb">
			<div>
				<span class="trn red">Red:</span>
				<input id="rgb_r" min="0" max="255" type="number" />
				<br />				
				<span class="trn green">Green:</span>
				<input id="rgb_g" min="0" max="255" type="number" />
				<br />
				<span class="trn blue">Blue:</span>
				<input id="rgb_b" min="0" max="255" type="number" />
				<br />
				<span class="trn alpha">Alpha:</span>
				<input id="rgb_a" min="0" max="255" type="number" />
			</div>
			<div>
				<span class="trn">Hue:</span>
				<input id="hsl_h" min="0" max="360" type="number" />
				<br />				
				<span class="trn">Sat:</span>
				<input id="hsl_s" min="0" max="100" type="number" />
				<br />
				<span class="trn">Lum:</span>
				<input id="hsl_l" min="0" max="100" type="number" />
			</div>
		</div>
`;

/**
 * GUI class responsible for rendering colors block on right sidebar
 */
class GUI_colors_class {

	render_main_colors() {
		document.getElementById('toggle_colors').innerHTML = template;
		this.render_colors();
		this.set_events();
	}

	set_events() {
		var _this = this;

		var rbg_input_ids = ['rgb_r', 'rgb_g', 'rgb_b', 'rgb_a'];
		for (var i in rbg_input_ids) {
			var target = document.getElementById(rbg_input_ids[i]);
			target.addEventListener('input', function (e) {
				_this.set_color_rgb(this);
			}, false);
		}

		var hsl_input_ids = ['hsl_h', 'hsl_s', 'hsl_l'];
		for (var i in hsl_input_ids) {
			var target = document.getElementById(hsl_input_ids[i]);
			target.addEventListener('input', function (e) {
				_this.set_color_hsl(this);
			}, false);
		}
		
		var changed = false;
		var last_color = config.COLOR;
		$("#main_color").spectrum({
			move: function(color) {				
				_this.change_color(color.toHexString());
				_this.render_colors();
			},
			show: function() {
				changed = false;
				last_color = config.COLOR;
			},
			change: function(color) {
				changed = true;
			},
			hide: function(color) {
				if(changed == false) {
					// revert
					_this.change_color(last_color);
					_this.render_colors();
				}
				else{
					//changed
					last_color = config.COLOR;
				}
			}
		});

		//colors
		document.getElementById('color_hex').addEventListener('keyup', function (e) {
			_this.set_color_manual(e);
		}, false);
		document.getElementById('main_color').addEventListener('change', function (e) {
			_this.set_color(this);
		}, false);
	}
	
	/**
	 * renders current color to all color fields
	 * 
	 * @param boolean can_change_hsl True by default
	 */
	render_colors(can_change_hsl) {
		document.getElementById("color_hex").value = config.COLOR;
		document.getElementById("main_color").value = config.COLOR;

		var colors = Helper.hex2rgb(config.COLOR);
		document.getElementById("rgb_r").value = colors.r;
		document.getElementById("rgb_g").value = colors.g;
		document.getElementById("rgb_b").value = colors.b;
		document.getElementById("rgb_a").value = config.ALPHA;

		if(can_change_hsl == undefined || can_change_hsl === true) {
			var hsl = Helper.rgbToHsl(colors.r, colors.g, colors.b, false);
			document.getElementById("hsl_h").value = Math.round(hsl.h * 360);
			document.getElementById("hsl_s").value = Math.round(hsl.s * 100);
			document.getElementById("hsl_l").value = Math.round(hsl.l * 100);
		}
	}

	set_color(object) {
		if (object.id == 'main_color')
			this.change_color(object.value);
		else
			this.change_color(Helper.rgb2hex_all(object.style.backgroundColor));

		document.getElementById("main_color").value = config.COLOR;
		document.getElementById("color_hex").value = config.COLOR;
		var colors = Helper.hex2rgb(config.COLOR);
		document.getElementById("rgb_r").value = colors.r;
		document.getElementById("rgb_g").value = colors.g;
		document.getElementById("rgb_b").value = colors.b;

		//also set alpha to max
		if (config.ALPHA == 0) {
			this.change_alpha(255);
		}

		this.render_colors();
	}

	set_color_manual(event) {
		var object = event.target;
		if (object.value.length == 6 && object.value[0] != '#') {
			this.change_color('#' + object.value);
			this.render_colors();
		}
		if (object.value.length == 7) {
			this.change_color(object.value);
			this.render_colors();
		}
		else if (object.value.length > 7) {
			object.value = config.COLOR;
		}
	}

	set_color_rgb(object) {
		var value = parseInt(object.value);
		if (isNaN(value) || value < 0) {
			object.value = 0;
			alertify.error('Error: bad rgb value.');
		}
		if (value > 255) {
			object.value = 255;
			alertify.error('Error: bad rgb value.');
		}
		this.change_color(
			null, 
			document.getElementById("rgb_r").value,
			document.getElementById("rgb_g").value,
			document.getElementById("rgb_b").value
		);
		this.change_alpha(document.getElementById("rgb_a").value);

		this.render_colors();
	}

	set_color_hsl(object) {
		var value = parseInt(object.value);
		if (isNaN(value) || value < 0) {
			object.value = 0;
			return false;
		}
		
		var max = 100;
		if(object.id == 'hsl_h'){
			max = 360;
		}
		
		if (value > max) {
			object.value = max;
			alertify.error('Error: bad hsl value.');
		}
		if (value < 0) {
			object.value = 0;
			alertify.error('Error: bad hsl value.');
		}
		var rgb = Helper.hslToRgb(
			document.getElementById("hsl_h").value / 360,
			document.getElementById("hsl_s").value / 100,
			document.getElementById("hsl_l").value / 100
		);
		this.change_color(null, rgb[0], rgb[1], rgb[2]);

		this.render_colors(false);
	}
	
	/**
	 * change global color value
	 * 
	 * @param {type} hex can be null, but r/g/b/ must be provided then. Can be #ff0000 or ff0000
	 * @param {type} r optional
	 * @param {type} g optional
	 * @param {type} b optional
	 * @returns {undefined}
	 */
	change_color(hex, r, g, b) {
		if(hex != '' && hex != null){
			if(hex[0] != '#'){
				hex = '#' + hex;
			}
			config.COLOR = hex;
		}
		else if(r != undefined && g != undefined && b != undefined){
			config.COLOR = Helper.rgbToHex(r, g, b);
		}
		else{
			alertify.error('Error: wrong color.');
			return;
		}
		
		$("#main_color").spectrum("set", config.COLOR);
	}

	/**
	 * change global alpha value
	 * 
	 * @param {int} value
	 */
	change_alpha(value) {
		value = Math.ceil(value);
		config.ALPHA = parseInt(value);
		document.getElementById("rgb_a").value = config.ALPHA;
	}

}

export default GUI_colors_class;
