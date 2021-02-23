import Helper_class from './../../libs/helpers.js';
import Dialog_class from './../../libs/popup.js';
import GUI_colors_class from './../gui/gui-colors.js';

const Helper = new Helper_class();

/**
 * This input opens a custom color picker dialog that is more tightly integrated with the application (swatch selection, etc).
 * It can also handle alpha values, whereas native color input can't.
 */

(function ($) {

	const template = `
		<div class="ui_color_input" tabindex="-1">
			<input type="color">
			<div class="alpha_overlay"></div>
		</div>
	`;

	const on_focus_color_input = (event) => {
		const $el = $(event.target.closest('.ui_color_input'));
		$el.trigger('focus');
	};

	const on_blur_color_input = (event) => {
		const $el = $(event.target.closest('.ui_color_input'));
		$el.trigger('blur');
	};

	const on_click_color_input = (event) => {
		event.preventDefault();
		const $el = $(event.target.closest('.ui_color_input'));
		const { value } = $el.data();
		const POP = new Dialog_class();
		let colorsDialog = new GUI_colors_class();
		var settings = {
			title: 'Color Picker',
			on_finish() {
				set_value($el, colorsDialog.COLOR + (colorsDialog.ALPHA < 255 ? colorsDialog.ALPHA.toString(16).padStart(2, '0') : ''));
				$el.trigger('input');
				$el.trigger('change');
				colorsDialog = null;
			},
			params: [
				{
					function() {
						var html = '<div id="dialog_color_picker"></div>';
						return html;
					}
				}
			],
		};
		let colorValue;
		let alpha = 255;
		if (/^\#[0-9A-F]{8}$/gi.test(value)) {
			// Hex with alpha
			colorValue = value.slice(0, 7);
			alpha = parseInt(value.slice(7, 9), 16);
		} else if (/^\#[0-9A-F]{6}$/gi.test(value)) {
			// Hex without alpha
			colorValue = value;
		} else {
			colorValue = '#000000';
		}
		POP.show(settings);
		colorsDialog.render_main_colors('dialog');
		colorsDialog.set_color({ hex: colorValue, a: alpha });
	};

	const set_value = ($el, value) => {
		const trimmedValue = (value + '').trim();
		let colorValue;
		let opacity = 0;
		if (/^\#[0-9A-F]{8}$/gi.test(trimmedValue)) {
			// Hex with alpha
			colorValue = trimmedValue.slice(0, 7);
			opacity = 1 - (parseInt(value.slice(7, 9), 16) * (1 / 255));
		} else if (/^\#[0-9A-F]{6}$/gi.test(trimmedValue)) {
			// Hex without alpha
			colorValue = trimmedValue;
		} else {
			return;
		}
		const { input, overlay } = $el.data();
		overlay.style.opacity = opacity;
		input.value = colorValue;
        $el.data('value', trimmedValue);
	};

	const set_disabled = ($el, disabled) => {
		const { input } = $el.data();
        if (disabled) {
            input.setAttribute('disabled', 'disabled');
        } else {
            input.removeAttribute('disabled');
        }
        $el.data('disabled', disabled);
	};

	$.fn.uiColorInput = function(behavior, ...args) {
		let returnValues = [];
		for (let i = 0; i < this.length; i++) {
			let el = this[i];

			// Constructor
			if (Object.prototype.toString.call(behavior) !== '[object String]') {
				const definition = behavior || {};

				const classList = el.className;
				const id = definition.id != null ? definition.id : el.getAttribute('id');
				const inputId = definition.inputId || '';
				const disabled = definition.disabled != null ? definition.disabled : el.hasAttribute('disabled') ? true : false;
				const value = definition.value != null ? definition.value : el.value || 0;
				const ariaLabeledBy = el.getAttribute('aria-labelledby');

				let $el;
				if (el.parentNode) {
					$(el).after(template);
					const oldEl = el;
					el = el.nextElementSibling;
					$(oldEl).remove();
				} else {
					const orphanedParent = document.createElement('div');
					orphanedParent.innerHTML = template;
					el = orphanedParent.firstElementChild;
				}
				this[i] = el;
				$el = $(el);

				const input = $el.find('input[type="color"]')[0];
				const overlay = $el.find('.alpha_overlay')[0];

				if (classList) {
					el.classList.add(classList);
				}
				if (id) {
					el.setAttribute('id', id);
				}
				if (inputId) {
					input.setAttribute('id', inputId);
				}
				if (ariaLabeledBy) {
					input.setAttribute('aria-labelledby', ariaLabeledBy);
				}

				$el.data({
					id,
					input,
					overlay,
					value
				});

				$(input)
					.on('click', on_click_color_input)
					.on('focus', on_focus_color_input)
					.on('blur', on_blur_color_input)

				set_value($el, value);
				set_disabled($el, disabled);
			}
			// Behaviors
			else if (behavior === 'set_value') {
                const newValue = args[0];
                const $el = $(el);
                if ($el.data('value') !== newValue) {
                    set_value($(el), newValue);
                }
            }
            else if (behavior === 'get_value') {
                returnValues.push($(el).data('value'));
            }
            else if (behavior === 'get_id') {
                returnValues.push($(el).data('id'));
            }
		}
		if (returnValues.length > 0) {
			return returnValues.length === 1 ? returnValues[0] : returnValues;
		} else {
			return this;
		}
	}

})(jQuery);