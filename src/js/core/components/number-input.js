import Helper_class from './../../libs/helpers.js';

var Helper = new Helper_class();

/**
 * The purpose of using this class vs a native input[type="number"] is for custom styling and
 * to allow for gestures on mobile that makes it easier to use with a thumb on a touch screen (future implementation)
 */

(function ($) {

    const template = `
        <div class="ui_number_input">
            <input type="number">
            <button class="increase_number" tabindex="-1"><span class="sr_only">Increase</span></button>
            <button class="decrease_number" tabindex="-1"><span class="sr_only">Decrease</span></button>
        </div>
    `;

    const on_focus_number_input = (event) => {
        const $el = $(event.target.closest('.ui_number_input'));
        $el.trigger('focus', event);
    };

    const on_blur_number_input = (event) => {
        const $el = $(event.target.closest('.ui_number_input'));
        $el.trigger('blur', event);
    };

    const on_input_number_input = (event) => {
        const $el = $(event.target.closest('.ui_number_input'));
        set_value($el, $el.data('input').value);
        $el.trigger('input', event);
    };

    const on_change_number_input = (event) => {
        const $el = $(event.target.closest('.ui_number_input'));
        set_value($el, $el.data('input').value);
        $el.trigger('change', event);
    };

    const on_touch_start_increase_button = (event) => {
        const $el = $(event.target.closest('.ui_number_input'));
        const { value, step, buttonRepeatTimeout, buttonRepeatInterval, disabled } = $el.data();
        if (!disabled) {
            clearTimeout(buttonRepeatTimeout);
            clearInterval(buttonRepeatInterval);
            set_value($el, value + step);
            $el.trigger('input');
        }
    };

    const on_mouse_down_increase_button = (event) => {
        const $el = $(event.target.closest('.ui_number_input'));
        const { value, step, buttonRepeatTimeout, buttonRepeatInterval, disabled } = $el.data();
        if (!disabled) {
            clearTimeout(buttonRepeatTimeout);
            clearInterval(buttonRepeatInterval);
            set_value($el, value + step);
            $el.trigger('input');
            $el.data('buttonRepeatTimeout', setTimeout(() => {
                $el.data('buttonRepeatInterval', setInterval(() => {
                    const { value, step } = $el.data();
                    set_value($el, value + step);
                    $el.trigger('input');
                }, 50));
            }, 400));
        }
    };

    const on_mouse_up_increase_button = (event) => {
        const $el = $(event.target.closest('.ui_number_input'));
        const { buttonRepeatTimeout, buttonRepeatInterval } = $el.data();
        clearTimeout(buttonRepeatTimeout);
        clearInterval(buttonRepeatInterval);
    };

    const on_touch_start_decrease_button = (event) => {
        const $el = $(event.target.closest('.ui_number_input'));
        const { value, step, buttonRepeatTimeout, buttonRepeatInterval, disabled } = $el.data();
        if (!disabled) {
            clearTimeout(buttonRepeatTimeout);
            clearInterval(buttonRepeatInterval);
            set_value($el, value - step);
            $el.trigger('input');
        }
    };

    const on_mouse_down_decrease_button = (event) => {
        const $el = $(event.target.closest('.ui_number_input'));
        const { value, step, buttonRepeatTimeout, buttonRepeatInterval, disabled } = $el.data();
        if (!disabled) {
            clearTimeout(buttonRepeatTimeout);
            clearInterval(buttonRepeatInterval);
            set_value($el, value - step);
            $el.trigger('input');
            $el.data('buttonRepeatTimeout', setTimeout(() => {
                $el.data('buttonRepeatInterval', setInterval(() => {
                    const { value, step } = $el.data();
                    set_value($el, value - step);
                    $el.trigger('input');
                }, 50));
            }, 400));
        }
    };

    const on_mouse_up_decrease_button = (event) => {
        const $el = $(event.target.closest('.ui_number_input'));
        const { buttonRepeatTimeout, buttonRepeatInterval } = $el.data();
        clearTimeout(buttonRepeatTimeout);
        clearInterval(buttonRepeatInterval);
    };

    const set_value = ($el, value) => {
        const { min, max, step, input } = $el.data();
        if (typeof value === 'string') {
            value = parseFloat(value);
        }
        value = step * Math.round(value / step);
        value = Math.max(min, Math.min(max, value));
        if (value + '.' !== input.value) {
            input.value = value;
        }
        $el.data('value', value);
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

    $.fn.uiNumberInput = function(behavior, ...args) {
        let returnValues = [];
        for (let i = 0; i < this.length; i++) {
            let el = this[i];

            // Constructor
            if (Object.prototype.toString.call(behavior) !== '[object String]') {
                const definition = behavior || {};

                const classList = el.className;
                const id = definition.id != null ? definition.id : el.getAttribute('id');
                const min = definition.min != null ? definition.min : parseFloat(el.getAttribute('min')) || 0;
                const max = definition.max != null ? definition.max : parseFloat(el.getAttribute('max')) || 0;
                const step = definition.step != null ? definition.step : el.hasAttribute('step') ? parseFloat(el.getAttribute('step')) : 1;
                const disabled = definition.disabled != null ? definition.disabled : el.hasAttribute('disabled') ? true : false;
                const value = definition.value != null ? definition.value : parseFloat(el.value) || 0;
                const ariaLabeledBy = el.getAttribute('aria-labelledby');

                $(el).after(template);
                const oldEl = el;
                el = el.nextElementSibling;
                $(oldEl).remove();
                this[i] = el;
                const $el = $(el);

                const input = $el.find('input[type="number"]')[0];
                const increaseButton = $el.find('.increase_number')[0];
                const decreaseButton = $el.find('.decrease_number')[0];

                if (classList) {
                    el.classList.add(classList);
                }
                if (id) {
                    el.setAttribute('id', id);
                }
                if (ariaLabeledBy) {
                    el.setAttribute('aria-labelledby', ariaLabeledBy);
                }
                input.setAttribute('min', min);
                input.setAttribute('max', max);
                input.setAttribute('step', step);

                $el.data({
                    input,
                    increaseButton,
                    decreaseButton,
                    buttonRepeatTimeout: undefined,
                    buttonRepeatInterval: undefined,
                    value,
                    min,
                    max,
                    step
                });

                $(input)
                    .on('focus', on_focus_number_input)
                    .on('blur', on_blur_number_input)
                    .on('input', on_input_number_input)
                    .on('change', on_change_number_input);
                $(increaseButton)
                    .on('touchstart', on_touch_start_increase_button)
                    .on('mousedown', on_mouse_down_increase_button)
                    .on('mouseup mouseleave touchend', on_mouse_up_increase_button);
                $(decreaseButton)
                    .on('touchstart', on_touch_start_decrease_button)
                    .on('mousedown', on_mouse_down_decrease_button)
                    .on('mouseup mouseleave', on_mouse_up_decrease_button);
                
                set_value($el, value);
                set_disabled($el, disabled);
            }
            // Behaviors
            else if (behavior === 'set_value') {
                const newValue = parseFloat(args[0]);
                const $el = $(el);
                if ($el.data('value') !== newValue) {
                    set_value($(el), newValue);
                }
            }
            else if (behavior === 'get_value') {
                returnValues.push($(el).data('value'));
            }
            else if (behavior === 'set_disabled') {
                const newValue = !!args[0];
                set_disabled($(el), newValue);
            }
            else if (behavior === 'get_disabled') {
                returnValues.push($(el).data('disabled'));
            }
        }
        if (returnValues.length > 0) {
            return returnValues.length === 1 ? returnValues[0] : returnValues;
        } else {
            return this;
        }
    };

})(jQuery);