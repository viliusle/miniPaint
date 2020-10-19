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
	<input id="color_picker_gradient" type="color" aria-label="Color Selection">
	<div class="ui_input_group">
		<label id="color_hex_label" title="Hex" class="label_width_small">Hex</label>
		<input id="color_hex" aria-labelledby="color_hex_label" value="#000000" type="text" />
	</div>
	<div class="ui_input_grid">
		<div class="ui_input_group">
			<label id="rgb_r_label" title="Red" class="label_width_character text_red"><strong>R<span class="sr_only">ed</span></strong></label>
			<input id="rgb_r_range" aria-labelledby="rgb_r_label" type="range" min="0" max="255" class="color_picker" />
			<input id="rgb_r" min="0" aria-labelledby="rgb_r_label" max="255" type="number" />
		</div>
		<div class="ui_input_group">
			<label id="rgb_g_label" title="Green" class="label_width_character text_green"><strong>G<span class="sr_only">reen</span></strong></label>
			<input id="rgb_g_range" aria-labelledby="rgb_g_label" type="range" min="0" max="255" class="color_picker" />
			<input id="rgb_g" min="0" aria-labelledby="rgb_g_label" max="255" type="number" />
		</div>
		<div class="ui_input_group">
			<label id="rgb_b_label" title="Blue" class="label_width_character text_blue"><strong>B<span class="sr_only">lue</span></strong></label>
			<input id="rgb_b_range" aria-labelledby="rgb_b_label" type="range" min="0" max="255" class="color_picker" />
			<input id="rgb_b" min="0" aria-labelledby="rgb_b_label" max="255" type="number" />
		</div>
		<div class="ui_input_group">
			<label id="rgb_a_label" title="Alpha" class="label_width_character text_muted"><strong>A<span class="sr_only">lpha</span></strong></label>
			<input id="rgb_a_range" aria-labelledby="rgb_a_label" type="range" min="0" max="255" class="color_picker" />
			<input id="rgb_a" min="0" aria-labelledby="rgb_a_label" max="255" type="number" />
		</div>
	</div>
	<div class="ui_input_grid">
		<div class="ui_input_group">
			<label id="hsl_h_label" title="Hue" class="label_width_character"><strong>H<span class="sr_only">ue</span></strong></label>
			<input id="hsl_h_range" aria-labelledby="hsl_h_label" type="range" min="0" max="360" class="color_picker" />
			<input id="hsl_h" min="0" aria-labelledby="hsl_h_label" max="360" type="number" />
		</div>
		<div class="ui_input_group">
			<label id="hsl_s_label" title="Saturation" class="label_width_character"><strong>S<span class="sr_only">aturation</span></strong></label>
			<input id="hsl_s_range" aria-labelledby="hsl_s_label" type="range" min="0" max="100" class="color_picker" />
			<input id="hsl_s" min="0" aria-labelledby="hsl_s_label"max="100" type="number" />
		</div>
		<div class="ui_input_group">
			<label id="hsl_l_label" title="Luminosity" class="label_width_character"><strong>L<span class="sr_only">uminosity</span></strong></label>
			<input id="hsl_l_range" aria-labelledby="hsl_l_label" type="range" min="0" max="100" class="color_picker" />
			<input id="hsl_l" min="0" aria-labelledby="hsl_l_label"max="100" type="number" />
		</div>
	</div>
`;

/**
 * GUI class responsible for rendering colors block on right sidebar
 */
class GUI_colors_class {

	constructor() {
		this.el = null;
		this.inputs = null;
	}

	render_main_colors() {
		this.el = document.getElementById('toggle_colors');
		this.el.innerHTML = template;
		this.init_components();
		this.set_events();
		this.render_range_gradients = Helper.throttle(this.render_range_gradients, 50);
	}

	init_components() {
		this.inputs = {
			pickerGradient: $('#color_picker_gradient'),
			rgb: {
				r: {
					range: $('#rgb_r_range'),
					number: $('#rgb_r')
				},
				g: {
					range: $('#rgb_g_range'),
					number: $('#rgb_g')
				},
				b: {
					range: $('#rgb_b_range'),
					number: $('#rgb_b')
				},
				a: {
					range: $('#rgb_a_range'),
					number: $('#rgb_a')
				}
			},
			hsl: {
				h: {
					range: $('#hsl_h_range'),
					number: $('#hsl_h')
				},
				s: {
					range: $('#hsl_s_range'),
					number: $('#hsl_s')
				},
				l: {
					range: $('#hsl_l_range'),
					number: $('#hsl_l')
				}
			}
		};

		this.inputs.pickerGradient
			.uiColorPickerGradient()
			.on('input', () => {
				const hsv = this.inputs.pickerGradient.uiColorPickerGradient('get_hsv');
				this.set_color({
					h: hsv.h * 360,
					s: hsv.s * 100,
					v: hsv.v * 100
				});
			});

		const sliderInputs = [
			...Object.entries(this.inputs.rgb),
			...Object.entries(this.inputs.hsl)
		];
		for (const [key, input] of sliderInputs) {
			input.range && input.range
				.uiRange()
				.on('input', () => {
					this.set_color({ [key]: input.range.uiRange('get_value') });
				});
			input.number && input.number
				.on('input', () => {
					this.set_color({ [key]: input.number.val() });
				})
		}
		this.render_config_color();
	}

	set_events() {
		var _this = this;

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
			_this.set_color_spectrum(this);
		}, false);
	}

	/**
	 * Changes the config.COLOR variable based on the given input.
	 * @param {*} definition object contains the value of the color to change: "hex", "r", "g", "b", "a", "h", "s", "l", "v"
	 */
	set_color(definition) {
		let newColor = null;
		let newAlpha = null;
		let hsl = null;
		let hsv = null;
		// Set new color by hex code
		if ('hex' in definition) {
			const hex = '#' + definition.hex.replace(/[^0-9A-F]*/gi, '');
			if (/^\#[0-9A-F]{6}/gi.test(hex)) {
				newColor = '#' + definition.hex.trim().replace('^\#', '');
			}
		}
		// Set new color by rgb
		else if ('r' in definition || 'b' in definition || 'g' in definition) {
			const previousRgb = Helper.hexToRgb(config.COLOR);
			newColor = Helper.rgbToHex(
				'r' in definition ? Math.min(255, Math.max(0, parseInt(definition.r, 10) || 0)) : previousRgb.r,
				'g' in definition ? Math.min(255, Math.max(0, parseInt(definition.g, 10) || 0)) : previousRgb.g,
				'b' in definition ? Math.min(255, Math.max(0, parseInt(definition.b, 10) || 0)) : previousRgb.b
			);
		}
		// Set new color by hsv
		else if ('v' in definition) {
			const previousRgb = Helper.hexToRgb(config.COLOR);
			const previousHsv = Helper.rgbToHsv(previousRgb.r, previousRgb.g, previousRgb.b);
			hsv = {
				h: 'h' in definition ? Math.min(360, Math.max(0, parseInt(definition.h, 10) || 0)) / 360 : previousHsv.h,
				s: 's' in definition ? Math.min(100, Math.max(0, parseInt(definition.s, 10) || 0)) / 100 : previousHsv.s,
				v: 'v' in definition ? Math.min(100, Math.max(0, parseInt(definition.v, 10) || 0)) / 100 : previousHsv.v
			};
			newColor = Helper.hsvToHex(hsv.h, hsv.s, hsv.v);
		}
		// Set new color by hsl
		else if ('h' in definition || 's' in definition || 'l' in definition) {
			hsl = {
				h: ('h' in definition ? Math.min(360, Math.max(0, parseInt(definition.h, 10) || 0)) : parseInt(this.inputs.hsl.h.number.val(), 10)) / 360,
				s: ('s' in definition ? Math.min(100, Math.max(0, parseInt(definition.s, 10) || 0)) : parseInt(this.inputs.hsl.s.number.val(), 10)) / 100,
				l: ('l' in definition ? Math.min(100, Math.max(0, parseInt(definition.l, 10) || 0)) : parseInt(this.inputs.hsl.l.number.val(), 10)) / 100
			};
			newColor = Helper.hslToHex(hsl.h, hsl.s, hsl.l);
		}
		// Set new alpha
		if ('a' in definition) {
			newAlpha = Math.min(255, Math.max(0, parseInt(Math.ceil(definition.a), 10)));
		}
		// Re-render UI if changes made
		if (newColor != null || newAlpha != null) {
			config.COLOR = newColor != null ? newColor : config.COLOR;
			config.ALPHA = newAlpha != null ? newAlpha : config.ALPHA;
			if (hsl && !hsv) {
				hsv = Helper.hslTohsv(hsl.h, hsl.s, hsl.l);
			}
			if (hsv && !hsl) {
				hsl = Helper.hsvTohsl(hsv.h, hsv.s, hsv.v);
			}
			this.render_config_color({ hsl, hsv });
		}
	}

	/**
	 * Renders current color defined in the config to all color fields
	 * @param {*} options additional options:
	 *                    hsl - override for hsl values so it isn't calculated based on rgb (can lose selected hue/saturation otherwise)
	 *                    hsv - override for hsv values so it isn't calculated based on rgb (can lose selected hue/saturation otherwise)
	 */
	render_config_color(options) {
		options = options || {};

		document.getElementById("color_hex").value = config.COLOR;
		document.getElementById("main_color").value = config.COLOR;

		const rgb = Helper.hexToRgb(config.COLOR);
		delete rgb.a;
		for (let rgbKey in rgb) {
			this.inputs.rgb[rgbKey].range.uiRange('set_value', rgb[rgbKey]);
			this.inputs.rgb[rgbKey].number.val(rgb[rgbKey]);
		}
		this.inputs.rgb.a.range.uiRange('set_value', config.ALPHA);
		this.inputs.rgb.a.number.val(config.ALPHA);

		const hsv = options.hsv || Helper.rgbToHsv(rgb.r, rgb.g, rgb.b);

		const hsl = options.hsl || Helper.rgbToHsl(rgb.r, rgb.g, rgb.b);
		for (let hslKey in hsl) {
			const hslValue = Math.round(hsl[hslKey] * (hslKey === 'h' ? 360 : 100));
			this.inputs.hsl[hslKey].range.uiRange('set_value', hslValue);
			this.inputs.hsl[hslKey].number.val(hslValue);
		}

		this.render_range_gradients({ hsl, hsv });
	}

	/**
	 * Renders the color gradients in each channel's color range selection
	 * @param {*} options additional options:
	 *                    hsl - override for hsl values so it isn't calculated based on rgb (can lose selected hue/saturation otherwise)
	 *                    hsv - override for hsv values so it isn't calculated based on rgb (can lose selected hue/saturation otherwise)
	 */
	render_range_gradients(options) {
		options = options || {};

		// RGB
		const rgb = Helper.hexToRgb(config.COLOR);
		delete rgb.a;
		for (let rgbKey in rgb) {
			const rangeMin = JSON.parse(JSON.stringify(rgb));
			const rangeMax = JSON.parse(JSON.stringify(rgb));
			rangeMin[rgbKey] = 0;
			rangeMax[rgbKey] = 255;
			this.inputs.rgb[rgbKey].range.uiRange('set_background',
				`linear-gradient(to right, ${ Helper.rgbToHex(rangeMin.r, rangeMin.g, rangeMin.b) }, ${ Helper.rgbToHex(rangeMax.r, rangeMax.g, rangeMax.b) })`
			);
		}
		// A
		this.inputs.rgb.a.range.uiRange('set_background',
			`linear-gradient(to right, transparent, ${ config.COLOR })`
		);
		// HSV
		const hsv = options.hsv || Helper.rgbToHsv(rgb.r, rgb.g, rgb.b);
		this.inputs.pickerGradient.uiColorPickerGradient('set_hsv', hsv);
		// HSL
		const hsl = options.hsl || Helper.rgbToHsl(rgb.r, rgb.g, rgb.b);
		// HSL - H
		this.inputs.hsl.h.range.uiRange('set_background',
			`linear-gradient(to right, ${
				Helper.hex_set_hsl('#ff0000', { s: hsl.s, l: hsl.l })
			} 0%, ${
				Helper.hex_set_hsl('#ffff00', { s: hsl.s, l: hsl.l })
			} 17%, ${
				Helper.hex_set_hsl('#00ff00', { s: hsl.s, l: hsl.l })
			} 33%, ${
				Helper.hex_set_hsl('#00ffff', { s: hsl.s, l: hsl.l })
			} 50%, ${
				Helper.hex_set_hsl('#0000ff', { s: hsl.s, l: hsl.l })
			} 67%, ${
				Helper.hex_set_hsl('#ff00ff', { s: hsl.s, l: hsl.l })
			} 83%, ${
				Helper.hex_set_hsl('#ff0000', { s: hsl.s, l: hsl.l })
			} 100%)`
		);
		// HSL - S
		let rangeMin = JSON.parse(JSON.stringify(hsl));
		let rangeMax = JSON.parse(JSON.stringify(hsl));
		rangeMin.s = 0;
		rangeMax.s = 1;
		this.inputs.hsl.s.range.uiRange('set_background',
			`linear-gradient(to right, ${ Helper.hslToHex(rangeMin.h, rangeMin.s, rangeMin.l) }, ${ Helper.hslToHex(rangeMax.h, rangeMax.s, rangeMax.l) })`
		);
		// HSL - L
		let rangeMid = JSON.parse(JSON.stringify(hsl));
		rangeMid.l = 0.5;
		this.inputs.hsl.l.range.uiRange('set_background',
			`linear-gradient(to right, #000000 0%, ${ Helper.hslToHex(rangeMid.h, rangeMid.s, rangeMid.l) } 50%, #ffffff 100%)`
		);
	}

	/**
	 * renders current color to all color fields
	 * 
	 * @param boolean can_change_hsl True by default
	 */
	render_colors(can_change_hsl) {
		document.getElementById("color_hex").value = config.COLOR;
		document.getElementById("main_color").value = config.COLOR;

		var colors = Helper.hexToRgb(config.COLOR);
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

	set_color_spectrum(object) {
		if (object.id == 'main_color')
			this.change_color(object.value);
		else
			this.change_color(Helper.rgb2hex_all(object.style.backgroundColor));

		document.getElementById("main_color").value = config.COLOR;
		document.getElementById("color_hex").value = config.COLOR;
		var colors = Helper.hexToRgb(config.COLOR);
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
		this.change_color(null, rgb.r, rgb.g, rgb.b);

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
