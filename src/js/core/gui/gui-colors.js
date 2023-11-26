/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../../config.js';
import Helper_class from './../../libs/helpers.js';
import Tools_translate_class from './../../modules/tools/translate.js';

const Helper = new Helper_class();

const sidebarTemplate = `
	<div class="ui_flex_group justify_content_space_between stacked">
		<div id="selected_color_sample" class="ui_color_sample" title="Current Color Preview"></div>
		<div class="ui_button_group">
			<button id="toggle_color_picker_section_button" aria-pressed="true" class="ui_icon_button trn" title="Toggle Color Picker">
				<span class="sr_only">Toggle Color Picker</span>
				<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
					<rect width="24" height="24" opacity="0" />
					<path d="M19.54 5.08A10.61 10.61 0 0 0 11.91 2a10 10 0 0 0-.05 20 2.58 2.58 0 0 0 2.53-1.89 2.52 2.52 0 0 0-.57-2.28.5.5 0 0 1 .37-.83h1.65A6.15 6.15 0 0 0 22 11.33a8.48 8.48 0 0 0-2.46-6.25zM15.88 15h-1.65a2.49 2.49 0 0 0-1.87 4.15.49.49 0 0 1 .12.49c-.05.21-.28.34-.59.36a8 8 0 0 1-7.82-9.11A8.1 8.1 0 0 1 11.92 4H12a8.47 8.47 0 0 1 6.1 2.48 6.5 6.5 0 0 1 1.9 4.77A4.17 4.17 0 0 1 15.88 15z" />
					<circle cx="12" cy="6.5" r="1.5" />
					<path d="M15.25 7.2a1.5 1.5 0 1 0 2.05.55 1.5 1.5 0 0 0-2.05-.55z" />
					<path d="M8.75 7.2a1.5 1.5 0 1 0 .55 2.05 1.5 1.5 0 0 0-.55-2.05z" />
					<path d="M6.16 11.26a1.5 1.5 0 1 0 2.08.4 1.49 1.49 0 0 0-2.08-.4z" />
				</svg>
			</button>
			<button id="toggle_color_channels_section_button" aria-pressed="true" class="ui_icon_button trn" title="Toggle Color Channels">
				<span class="sr_only">Toggle Color Channels</span>
				<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-card-list" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
					<path fill-rule="evenodd" d="M14.5 3h-13a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/>
					<path fill-rule="evenodd" d="M5 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 5 8zm0-2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0 5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z"/>
					<circle cx="3.5" cy="5.5" r=".5"/>
					<circle cx="3.5" cy="8" r=".5"/>
					<circle cx="3.5" cy="10.5" r=".5"/>
				</svg>
			</button>
			<button id="toggle_color_swatches_section_button" aria-pressed="true" class="ui_icon_button trn" title="Toggle Swatches">
				<span class="sr_only">Toggle Swatches</span>
				<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-grid-3x2" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
					<path fill-rule="evenodd" d="M0 3.5A1.5 1.5 0 0 1 1.5 2h13A1.5 1.5 0 0 1 16 3.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 11.5v-8zM1.5 3a.5.5 0 0 0-.5.5V7h4V3H1.5zM5 8H1v3.5a.5.5 0 0 0 .5.5H5V8zm1 0h4v4H6V8zm4-1H6V3h4v4zm1 1v4h3.5a.5.5 0 0 0 .5-.5V8h-4zm0-1V3h3.5a.5.5 0 0 1 .5.5V7h-4z"/>
				</svg>
			</button>
		</div>
	</div>
	<div id="color_section_swatches" class="block_section">
		<div id="color_swatches"></div>
	</div>
	<div id="color_section_picker" class="block_section">
		<input id="color_picker_gradient" type="color" aria-label="Color Selection">
		<div class="ui_input_group stacked">
			<label id="color_hex_label" title="Hex" class="label_width_small trn">Hex</label>
			<input id="color_hex" aria-labelledby="color_hex_label" value="#000000" maxlength="7" type="text" />
		</div>
	</div>
	<div id="color_section_channels" class="block_section color_section_channels">
		<div class="ui_input_grid stacked">
			<div class="ui_input_group">
				<label id="rgb_r_label" title="Red" class="label_width_character text_red"><strong>R<span class="sr_only">ed</span></strong></label>
				<input id="rgb_r_range" aria-labelledby="rgb_r_label" type="range" min="0" max="255" class="color_picker" />
				<input id="rgb_r" min="0" aria-labelledby="rgb_r_label" max="255" type="number" class="input_cw_3" />
			</div>
			<div class="ui_input_group">
				<label id="rgb_g_label" title="Green" class="label_width_character text_green"><strong>G<span class="sr_only">reen</span></strong></label>
				<input id="rgb_g_range" aria-labelledby="rgb_g_label" type="range" min="0" max="255" class="color_picker" />
				<input id="rgb_g" min="0" aria-labelledby="rgb_g_label" max="255" type="number" class="input_cw_3" />
			</div>
			<div class="ui_input_group">
				<label id="rgb_b_label" title="Blue" class="label_width_character text_blue"><strong>B<span class="sr_only">lue</span></strong></label>
				<input id="rgb_b_range" aria-labelledby="rgb_b_label" type="range" min="0" max="255" class="color_picker" />
				<input id="rgb_b" min="0" aria-labelledby="rgb_b_label" max="255" type="number" class="input_cw_3" />
			</div>
			<div class="ui_input_group">
				<label id="rgb_a_label" title="Alpha" class="label_width_character text_muted"><strong>A<span class="sr_only">lpha</span></strong></label>
				<input id="rgb_a_range" aria-labelledby="rgb_a_label" type="range" min="0" max="255" class="color_picker" />
				<input id="rgb_a" min="0" aria-labelledby="rgb_a_label" max="255" type="number" class="input_cw_3" />
			</div>
		</div>
		<div class="ui_input_grid stacked">
			<div class="ui_input_group">
				<label id="hsl_h_label" title="Hue" class="label_width_character"><strong>H<span class="sr_only">ue</span></strong></label>
				<input id="hsl_h_range" aria-labelledby="hsl_h_label" type="range" min="0" max="360" class="color_picker" />
				<input id="hsl_h" min="0" aria-labelledby="hsl_h_label" max="360" type="number" class="input_cw_3" />
			</div>
			<div class="ui_input_group">
				<label id="hsl_s_label" title="Saturation" class="label_width_character"><strong>S<span class="sr_only">aturation</span></strong></label>
				<input id="hsl_s_range" aria-labelledby="hsl_s_label" type="range" min="0" max="100" class="color_picker" />
				<input id="hsl_s" min="0" aria-labelledby="hsl_s_label"max="100" type="number" class="input_cw_3" />
			</div>
			<div class="ui_input_group">
				<label id="hsl_l_label" title="Luminosity" class="label_width_character"><strong>L<span class="sr_only">uminosity</span></strong></label>
				<input id="hsl_l_range" aria-labelledby="hsl_l_label" type="range" min="0" max="100" class="color_picker" />
				<input id="hsl_l" min="0" aria-labelledby="hsl_l_label"max="100" type="number" class="input_cw_3" />
			</div>
		</div>
	</div>
`;

const dialogTemplate = `
	<div class="ui_flex_group">
		<div id="dialog_color_picker_group" class="ui_flex_group column">
			<input id="dialog_color_picker_gradient" type="color" aria-label="Color Selection">
			<div class="block_section">
				<div class="ui_input_grid stacked">
					<div class="ui_input_group">
						<label class="label_width_medium trn">Current</label>
						<div id="dialog_selected_color_sample" class="ui_color_sample"></div>
					</div>
					<div class="ui_input_group">
						<label class="label_width_medium trn">Previous</label>
						<div id="dialog_previous_color_sample" class="ui_color_sample"></div>
					</div>
				</div>
			</div>
		</div>
		<div id="dialog_color_channel_group">
			<div class="ui_input_group stacked">
				<label id="dialog_color_hex_label" title="Hex" class="label_width_small trn">Hex</label>
				<input id="dialog_color_hex" aria-labelledby="dialog_color_hex_label" value="#000000" maxlength="7" type="text" />
			</div>
			<div class="ui_input_grid stacked">
				<div class="ui_input_group">
					<label id="dialog_rgb_r_label" title="Red" class="label_width_character text_red"><strong>R<span class="sr_only">ed</span></strong></label>
					<input id="dialog_rgb_r_range" aria-labelledby="dialog_rgb_r_label" type="range" min="0" max="255" class="color_picker" />
					<input id="dialog_rgb_r" min="0" aria-labelledby="dialog_rgb_r_label" max="255" type="number" class="input_cw_3" />
				</div>
				<div class="ui_input_group">
					<label id="dialog_rgb_g_label" title="Green" class="label_width_character text_green"><strong>G<span class="sr_only">reen</span></strong></label>
					<input id="dialog_rgb_g_range" aria-labelledby="dialog_rgb_g_label" type="range" min="0" max="255" class="color_picker" />
					<input id="dialog_rgb_g" min="0" aria-labelledby="dialog_rgb_g_label" max="255" type="number" class="input_cw_3" />
				</div>
				<div class="ui_input_group">
					<label id="dialog_rgb_b_label" title="Blue" class="label_width_character text_blue"><strong>B<span class="sr_only">lue</span></strong></label>
					<input id="dialog_rgb_b_range" aria-labelledby="dialog_rgb_b_label" type="range" min="0" max="255" class="color_picker" />
					<input id="dialog_rgb_b" min="0" aria-labelledby="dialog_rgb_b_label" max="255" type="number" class="input_cw_3" />
				</div>
				<div class="ui_input_group">
					<label id="dialog_rgb_a_label" title="Alpha" class="label_width_character text_muted"><strong>A<span class="sr_only">lpha</span></strong></label>
					<input id="dialog_rgb_a_range" aria-labelledby="dialog_rgb_a_label" type="range" min="0" max="255" class="color_picker" />
					<input id="dialog_rgb_a" min="0" aria-labelledby="dialog_rgb_a_label" max="255" type="number" class="input_cw_3" />
				</div>
			</div>
			<div class="ui_input_grid stacked">
				<div class="ui_input_group">
					<label id="dialog_hsl_h_label" title="Hue" class="label_width_character"><strong>H<span class="sr_only">ue</span></strong></label>
					<input id="dialog_hsl_h_range" aria-labelledby="dialog_hsl_h_label" type="range" min="0" max="360" class="color_picker" />
					<input id="dialog_hsl_h" min="0" aria-labelledby="dialog_hsl_h_label" max="360" type="number" class="input_cw_3" />
				</div>
				<div class="ui_input_group">
					<label id="dialog_hsl_s_label" title="Saturation" class="label_width_character"><strong>S<span class="sr_only">aturation</span></strong></label>
					<input id="dialog_hsl_s_range" aria-labelledby="dialog_hsl_s_label" type="range" min="0" max="100" class="color_picker" />
					<input id="dialog_hsl_s" min="0" aria-labelledby="dialog_hsl_s_label"max="100" type="number" class="input_cw_3" />
				</div>
				<div class="ui_input_group">
					<label id="dialog_hsl_l_label" title="Luminosity" class="label_width_character"><strong>L<span class="sr_only">uminosity</span></strong></label>
					<input id="dialog_hsl_l_range" aria-labelledby="dialog_hsl_l_label" type="range" min="0" max="100" class="color_picker" />
					<input id="dialog_hsl_l" min="0" aria-labelledby="dialog_hsl_l_label"max="100" type="number" class="input_cw_3" />
				</div>
			</div>
			<div class="block_section">
				<div id="dialog_color_swatches"></div>
			</div>
		</div>
	</div>
`;

/**
 * GUI class responsible for rendering colors block on right sidebar
 */
class GUI_colors_class {

	constructor() {
		this.el = null;
		this.COLOR = '#000000';
		this.ALPHA = 255;
		this.colorNotSet = true;
		this.uiType = null;
		this.butons = null;
		this.sections = null;
		this.inputs = null;
		this.Helper = new Helper_class();
		this.Tools_translate = new Tools_translate_class();
	}

	render_main_colors(uiType) {
		this.uiType = uiType || 'sidebar';
		if (this.uiType === 'dialog') {
			this.el = document.getElementById('dialog_color_picker');
			this.el.innerHTML = dialogTemplate;
		} else {
			var saved_color = this.Helper.getCookie('color');
			if (saved_color != null) config.COLOR = saved_color;
			this.el = document.getElementById('toggle_colors');
			this.el.innerHTML = sidebarTemplate;
		}
		if (config.LANG != 'en') {
			this.Tools_translate.translate(config.LANG, this.el);
		}
		this.init_components();
		this.render_ui_deferred = Helper.throttle(this.render_ui_deferred, 50);
	}

	init_components() {

		// Store button references
		this.buttons = {
			toggleColorSwatches: $('#toggle_color_swatches_section_button', this.el),
			toggleColorPicker: $('#toggle_color_picker_section_button', this.el),
			toggleColorChannels: $('#toggle_color_channels_section_button', this.el)
		};

		// Store UI section references
		this.sections = {
			swatches: $('#color_section_swatches', this.el),
			swatchesPlaceholder: document.createComment('Placeholder comment for color swatches'),
			picker: $('#color_section_picker', this.el),
			pickerPlaceholder: document.createComment('Placeholder comment for color picker'),
			channels: $('#color_section_channels', this.el),
			channelsPlaceholder: document.createComment('Placeholder comment for color channels')
		};

		// Store references to all inputs in DOM
		const idPrefix = this.uiType === 'dialog' ? 'dialog_' : '';
		this.inputs = {
			sample: $(`#${idPrefix}selected_color_sample`, this.el),
			swatches: $(`#${idPrefix}color_swatches`, this.el),
			pickerGradient: $(`#${idPrefix}color_picker_gradient`, this.el),
			hex: $(`#${idPrefix}color_hex`, this.el),
			rgb: {
				r: {
					range: $(`#${idPrefix}rgb_r_range`, this.el),
					number: $(`#${idPrefix}rgb_r`, this.el)
				},
				g: {
					range: $(`#${idPrefix}rgb_g_range`, this.el),
					number: $(`#${idPrefix}rgb_g`, this.el)
				},
				b: {
					range: $(`#${idPrefix}rgb_b_range`, this.el),
					number: $(`#${idPrefix}rgb_b`, this.el)
				},
				a: {
					range: $(`#${idPrefix}rgb_a_range`, this.el),
					number: $(`#${idPrefix}rgb_a`, this.el)
				}
			},
			hsl: {
				h: {
					range: $(`#${idPrefix}hsl_h_range`, this.el),
					number: $(`#${idPrefix}hsl_h`, this.el)
				},
				s: {
					range: $(`#${idPrefix}hsl_s_range`, this.el),
					number: $(`#${idPrefix}hsl_s`, this.el)
				},
				l: {
					range: $(`#${idPrefix}hsl_l_range`, this.el),
					number: $(`#${idPrefix}hsl_l`, this.el)
				}
			}
		};

		// Handle toggle for color swatches section
		this.buttons.toggleColorSwatches
			.on('click', () => {
				this.buttons.toggleColorSwatches.attr('aria-pressed', 'true' === this.buttons.toggleColorSwatches.attr('aria-pressed') ? 'false' : 'true');
				const isPressed = this.buttons.toggleColorSwatches.attr('aria-pressed') === 'true';
				if (isPressed) {
					this.sections.swatchesPlaceholder.parentNode.insertBefore(this.sections.swatches[0], this.sections.swatchesPlaceholder.nextSibling);
					this.sections.swatchesPlaceholder.parentNode.removeChild(this.sections.swatchesPlaceholder);
				} else {
					this.sections.swatches[0].parentNode.insertBefore(this.sections.swatchesPlaceholder, this.sections.swatches[0].nextSibling);
					this.sections.swatches[0].parentNode.removeChild(this.sections.swatches[0]);	
				}
				Helper.setCookie('toggle_color_swatches', isPressed ? 1 : 0);
			});
		// Restore toggle preference, default to hidden for swatches
		const saved_toggle_color_swatches = Helper.getCookie('toggle_color_swatches');
		if (saved_toggle_color_swatches === 0 || saved_toggle_color_swatches == null) {
			this.buttons.toggleColorSwatches.trigger('click');
		}

		// Handle toggle for color picker section
		this.buttons.toggleColorPicker
			.on('click', () => {
				this.buttons.toggleColorPicker.attr('aria-pressed', 'true' === this.buttons.toggleColorPicker.attr('aria-pressed') ? 'false' : 'true');
				const isPressed = this.buttons.toggleColorPicker.attr('aria-pressed') === 'true';
				if (isPressed) {
					this.sections.pickerPlaceholder.parentNode.insertBefore(this.sections.picker[0], this.sections.pickerPlaceholder.nextSibling);
					this.sections.pickerPlaceholder.parentNode.removeChild(this.sections.pickerPlaceholder);
				} else {
					this.sections.picker[0].parentNode.insertBefore(this.sections.pickerPlaceholder, this.sections.picker[0].nextSibling);
					this.sections.picker[0].parentNode.removeChild(this.sections.picker[0]);	
				}
				Helper.setCookie('toggle_color_picker', isPressed ? 1 : 0);
			});
		this.inputs.sample.on('click', (event) => {
			this.buttons.toggleColorPicker.click();
		});

		// Restore toggle preference, default to visible for picker
		const saved_toggle_color_picker = Helper.getCookie('toggle_color_picker');
		if (saved_toggle_color_picker === 0) {
			this.buttons.toggleColorPicker.trigger('click');
		}

		// Handle toggle for color channels section
		this.buttons.toggleColorChannels
			.on('click', () => {
				this.buttons.toggleColorChannels.attr('aria-pressed', 'true' === this.buttons.toggleColorChannels.attr('aria-pressed') ? 'false' : 'true');
				const isPressed = this.buttons.toggleColorChannels.attr('aria-pressed') === 'true';
				if (isPressed) {
					this.sections.channelsPlaceholder.parentNode.insertBefore(this.sections.channels[0], this.sections.channelsPlaceholder.nextSibling);
					this.sections.channelsPlaceholder.parentNode.removeChild(this.sections.channelsPlaceholder);
				} else {
					this.sections.channels[0].parentNode.insertBefore(this.sections.channelsPlaceholder, this.sections.channels[0].nextSibling);
					this.sections.channels[0].parentNode.removeChild(this.sections.channels[0]);	
				}
				Helper.setCookie('toggle_color_channels', isPressed ? 1 : 0);
			});
		// Restore toggle preference, default to hidden for swatches
		const saved_toggle_color_channels = Helper.getCookie('toggle_color_channels');
		if (saved_toggle_color_channels === 0 || saved_toggle_color_channels == null) {
			this.buttons.toggleColorChannels.trigger('click');
		}

		// Initialize color swatches
		this.inputs.swatches
			.uiSwatches({ rows: 3, cols: 7, count: 21, readonly: this.uiType === 'dialog' })
			.on('input', () => {
				this.set_color({
					hex: this.inputs.swatches.uiSwatches('get_selected_hex')
				});
			});
		if (this.uiType === 'dialog') {
			this.inputs.swatches.uiSwatches('set_all_hex', config.swatches.default);
		}

		// Initialize color picker gradient
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

		// Initialize hex entry
		this.inputs.hex
			.on('input', (event) => {
				const value = this.inputs.hex.val();
				const trimmedValue = value.trim();
				if (value !== trimmedValue) {
					this.inputs.hex.val(trimmedValue);
				}
				this.inputs.hex[0].setCustomValidity(/^\#[0-9A-F]{6}$/gi.test(trimmedValue) ? '' : 'Invalid Hex Code');
				this.set_color({ hex: this.inputs.hex.val() });
			})
			.on('blur', () => {
				const value = this.inputs.hex.val();
				if (!/^\#[0-9A-F]{6}$/gi.test(value)) {
					this.inputs.hex.val(this.uiType === 'dialog' ? this.COLOR : config.COLOR);
					this.inputs.hex[0].setCustomValidity('');
				}
			});
		
		// Initialize the color sliders
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
				.uiNumberInput()
				.on('input', () => {
					this.set_color({ [key]: input.number.uiNumberInput('get_value') });
				})
		}

		// Update all inputs from config.COLOR
		this.render_selected_color();
	}

	/**
	 * Changes the config.COLOR variable based on the given input.
	 * @param {*} definition object contains the value of the color to change:
	 *                       hex   - set the color as a hex code
	 *                       r,g,b - set the color as red, green, blue values [0-255]
	 *                       a     - set the color alpha [0-255]
	 *                       h,s,l - set the color as hue [0-360], saturation [0-100], luminosity [0-100]
	 *                       h,s,v - set the color as hue [0-360], saturation [0-100], value [0-100]
	 */
	set_color(definition) {
		let newColor = null;
		let newAlpha = null;
		let hsl = null;
		let hsv = null;
		// Set new color by hex code
		if ('hex' in definition) {
			const hex = '#' + definition.hex.replace(/[^0-9A-F]*/gi, '');
			if (/^\#[0-9A-F]{6}$/gi.test(hex)) {
				newColor = '#' + definition.hex.trim().replace(/^\#/, '');
			}
		}
		// Set new color by rgb
		else if ('r' in definition || 'b' in definition || 'g' in definition) {
			const previousRgb = Helper.hexToRgb(this.uiType === 'dialog' ? this.COLOR : config.COLOR);
			newColor = Helper.rgbToHex(
				'r' in definition ? Math.min(255, Math.max(0, parseInt(definition.r, 10) || 0)) : previousRgb.r,
				'g' in definition ? Math.min(255, Math.max(0, parseInt(definition.g, 10) || 0)) : previousRgb.g,
				'b' in definition ? Math.min(255, Math.max(0, parseInt(definition.b, 10) || 0)) : previousRgb.b
			);
		}
		// Set new color by hsv
		else if ('v' in definition) {
			const previousRgb = Helper.hexToRgb(this.uiType === 'dialog' ? this.COLOR : config.COLOR);
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
				h: ('h' in definition ? Math.min(360, Math.max(0, parseInt(definition.h, 10) || 0)) : parseInt(this.inputs.hsl.h.number.uiNumberInput('get_value'), 10)) / 360,
				s: ('s' in definition ? Math.min(100, Math.max(0, parseInt(definition.s, 10) || 0)) : parseInt(this.inputs.hsl.s.number.uiNumberInput('get_value'), 10)) / 100,
				l: ('l' in definition ? Math.min(100, Math.max(0, parseInt(definition.l, 10) || 0)) : parseInt(this.inputs.hsl.l.number.uiNumberInput('get_value'), 10)) / 100
			};
			newColor = Helper.hslToHex(hsl.h, hsl.s, hsl.l);
		}
		// Set new alpha
		if ('a' in definition) {
			newAlpha = Math.min(255, Math.max(0, parseInt(Math.ceil(definition.a), 10)));
		}
		// Re-render UI if changes made
		if (newColor != null || newAlpha != null) {
			if (this.uiType === 'dialog') {
				this.COLOR = newColor != null ? newColor : this.COLOR;
				this.ALPHA = newAlpha != null ? newAlpha : this.ALPHA;
				if (this.colorNotSet) {
					this.colorNotSet = false;
					$('#dialog_previous_color_sample', this.el)[0].style.background = this.COLOR;
				}
			} else {
				config.COLOR = newColor != null ? newColor : config.COLOR;
				config.ALPHA = newAlpha != null ? newAlpha : config.ALPHA;
			}
			if (hsl && !hsv) {
				hsv = Helper.hslToHsv(hsl.h, hsl.s, hsl.l);
			}
			if (hsv && !hsl) {
				hsl = Helper.hsvToHsl(hsv.h, hsv.s, hsv.v);
			}
			this.render_selected_color({ hsl, hsv });
		}

		if (this.uiType === 'sidebar') {
			this.Helper.setCookie('color', config.COLOR);
		}
	}

	/**
	 * Renders current color defined in the config to all color fields
	 * @param {*} options additional options:
	 *                    hsl - override for hsl values so it isn't calculated based on rgb (can lose selected hue/saturation otherwise)
	 *                    hsv - override for hsv values so it isn't calculated based on rgb (can lose selected hue/saturation otherwise)
	 */
	render_selected_color(options) {
		options = options || {};
		const COLOR = this.uiType === 'dialog' ? this.COLOR : config.COLOR;
		const ALPHA = this.uiType === 'dialog' ? this.ALPHA : config.ALPHA;

		this.inputs.sample.css('background', COLOR);

		if (this.uiType !== 'dialog') {
			this.inputs.swatches.uiSwatches('set_selected_hex', COLOR);
		}

		const hexInput = this.inputs.hex[0];
		hexInput.value = COLOR;
		hexInput.setCustomValidity('');

		const rgb = Helper.hexToRgb(COLOR);
		delete rgb.a;
		for (let rgbKey in rgb) {
			this.inputs.rgb[rgbKey].range.uiRange('set_value', rgb[rgbKey]);
			this.inputs.rgb[rgbKey].number.uiNumberInput('set_value', rgb[rgbKey]);
		}
		this.inputs.rgb.a.range.uiRange('set_value', ALPHA);
		this.inputs.rgb.a.number.uiNumberInput('set_value', ALPHA);

		const hsv = options.hsv || Helper.rgbToHsv(rgb.r, rgb.g, rgb.b);

		const hsl = options.hsl || Helper.rgbToHsl(rgb.r, rgb.g, rgb.b);
		for (let hslKey in hsl) {
			const hslValue = Math.round(hsl[hslKey] * (hslKey === 'h' ? 360 : 100));
			this.inputs.hsl[hslKey].range.uiRange('set_value', hslValue);
			this.inputs.hsl[hslKey].number.uiNumberInput('set_value', hslValue);
		}

		this.render_ui_deferred({ hsl, hsv });
	}

	/**
	 * Renders the color gradients in each channel's color range selection.
	 * This function is throttled due to expensive operations on low-end systems.
	 * @param {*} options additional options:
	 *                    hsl - override for hsl values so it isn't calculated based on rgb (can lose selected hue/saturation otherwise)
	 *                    hsv - override for hsv values so it isn't calculated based on rgb (can lose selected hue/saturation otherwise)
	 */
	render_ui_deferred(options) {
		options = options || {};
		const COLOR = this.uiType === 'dialog' ? this.COLOR : config.COLOR;

		// RGB
		const rgb = Helper.hexToRgb(COLOR);
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
			`linear-gradient(to right, transparent, ${ COLOR })`
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

		// Store swatch values
		if (this.uiType === 'sidebar') {
			config.swatches.default = this.inputs.swatches.uiSwatches('get_all_hex');
		}
	}

}

export default GUI_colors_class;
