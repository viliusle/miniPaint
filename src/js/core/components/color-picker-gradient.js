import Helper_class from './../../libs/helpers.js';

var Helper = new Helper_class();

(function ($) {

    const template = `
        <div class="ui_color_picker_gradient">
            <div class="secondary_pick" tabindex="0" role="figure" aria-label="Saturation vs value selection. Use left/right arrow keys to control saturation. Use up/down arrow keys to control value.">
                <div class="saturation_gradient"></div>
                <div class="value_gradient"></div>
                <div class="handle"></div>
            </div>
            <div class="primary_pick">
                <input aria-label="Hue" type="range" min="0" max="360" step="1" class="color_picker_thin" />
            </div>
        </div>
    `;

    const on_key_down_secondary_pick = (event) => {
        const $el = $(event.target.closest('.ui_color_picker_gradient'));
        const { hsv } = $el.data();
        const key = event.key;
        if (['Left', 'ArrowLeft'].includes(key)) {
            event.preventDefault();
            set_hsv($el, {
                h: hsv.h,
                s: hsv.s - 1/100,
                v: hsv.v
            });
            $el.trigger('input');
        }
        else if (['Right', 'ArrowRight'].includes(key)) {
            event.preventDefault();
            set_hsv($el, {
                h: hsv.h,
                s: hsv.s + 1/100,
                v: hsv.v
            });
            $el.trigger('input');
        }
        else if (['Up', 'ArrowUp'].includes(key)) {
            event.preventDefault();
            set_hsv($el, {
                h: hsv.h,
                s: hsv.s,
                v: hsv.v + 1/100
            });
            $el.trigger('input');
        }
        else if (['Down', 'ArrowDown'].includes(key)) {
            event.preventDefault();
            set_hsv($el, {
                h: hsv.h,
                s: hsv.s,
                v: hsv.v - 1/100
            });
            $el.trigger('input');
        }
    };

    const on_mouse_down_secondary_pick = (event) => {
        event.preventDefault();
        const $el = $(event.target.closest('.ui_color_picker_gradient'));
        const { secondaryPick, secondaryPickHandle, hsv } = $el.data();
        const clientX = event.touches && event.touches.length > 0 ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches && event.touches.length > 0 ? event.touches[0].clientY : event.clientY;
        const mouseDownSecondaryPickRect = secondaryPick.getBoundingClientRect();

        const xRatio = (clientX - mouseDownSecondaryPickRect.left) / (mouseDownSecondaryPickRect.right - mouseDownSecondaryPickRect.left);
        const yRatio = (clientY - mouseDownSecondaryPickRect.top) / (mouseDownSecondaryPickRect.bottom - mouseDownSecondaryPickRect.top);

        set_hsv($el, {
            h: hsv.h,
            s: xRatio,
            v: 1 - yRatio
        });
        
        $el.trigger('input');

        $el.data({
            mouseDownSecondaryPickRect,
            mouseMoveWindowHandler: generate_on_mouse_move_window($el),
            mouseUpWindowHandler: generate_on_mouse_up_window($el)
        });

        const $window = $(window);
        $window.on('mousemove touchmove', $el.data('mouseMoveWindowHandler'));
        $window.on('mouseup touchend', $el.data('mouseUpWindowHandler'));
    };

    const on_touch_move_secondary_pick = (event) => {
        event.preventDefault();
    };

    const generate_on_mouse_move_window = ($el) => {
        return (event) => {
            const { hsv, mouseDownSecondaryPickRect } = $el.data();
            const clientX = event.touches && event.touches.length > 0 ? event.touches[0].clientX : event.clientX;
            const clientY = event.touches && event.touches.length > 0 ? event.touches[0].clientY : event.clientY;
            const xRatio = (clientX - mouseDownSecondaryPickRect.left) / (mouseDownSecondaryPickRect.right - mouseDownSecondaryPickRect.left);
            const yRatio = (clientY - mouseDownSecondaryPickRect.top) / (mouseDownSecondaryPickRect.bottom - mouseDownSecondaryPickRect.top);
            set_hsv($el, {
                h: hsv.h,
                s: xRatio,
                v: 1 - yRatio
            });
            $el.trigger('input');
        };
    };

    const generate_on_mouse_up_window = ($el) => {
        return (event) => {
            const $window = $(window);
            $window.off('mousemove touchmove', $el.data('mouseMoveWindowHandler'));
            $window.off('mouseup touchend', $el.data('mouseUpWindowHandler'));
        };
    };

    // All hsv values range from 0 to 1.
    const set_hsv = ($el, hsv) => {
        const { secondaryPick, secondaryPickHandle, primaryRange } = $el.data();
        hsv.h  = Math.max(0, Math.min(1, hsv.h));
        hsv.s = Math.max(0, Math.min(1, hsv.s));
        hsv.v = Math.max(0, Math.min(1, hsv.v));
        $el.data('hsv', hsv);
        $(primaryRange).uiRange('set_value', (1 - hsv.h) * 360);
        secondaryPick.style.background = Helper.hsvToHex(hsv.h, 1, 1);
        secondaryPickHandle.style.left = ((hsv.s) * 100) + '%';
        secondaryPickHandle.style.top = ((1 - hsv.v) * 100) + '%';
    };

    $.fn.uiColorPickerGradient = function(behavior, ...args) {
        let returnValues = [];
        for (let i = 0; i < this.length; i++) {
            let el = this[i];

            // Constructor
            if (Object.prototype.toString.call(behavior) !== '[object String]') {
                const definition = behavior || {};

                const id = definition.id != null ? definition.id : el.getAttribute('id'); 
                const label = definition.label != null ? definition.label : el.getAttribute('aria-label');
                const hsv = definition.hsv || { h: 0, s: 0, v: 0 };

                $(el).after(template);
                const oldEl = el;
                el = el.nextElementSibling;
                $(oldEl).remove();
                this[i] = el;

                if (id) {
                    el.setAttribute('id', id);
                }
                if (label) {
                    el.setAttribute('aria-label', label);
                }

                const $el = $(el);

                const $primaryRange = $($el.find('.primary_pick input').get(0));
                $primaryRange
                    .uiRange({ vertical: true })
                    .uiRange('set_background', 'linear-gradient(to bottom, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)')
                    .on('input', () => {
                        const { hsv } = $el.data();
                        set_hsv($el, {
                            h: 1 - ($primaryRange.uiRange('get_value') / 360),
                            s: hsv.s,
                            v: hsv.v
                        });
                        $el.trigger('input');
                    });

                $el.find('> input').uiRange();

                const secondaryPick = $el.find('.secondary_pick')[0];

                $el.data({
                    primaryRange: $primaryRange[0],
                    secondaryPick,
                    secondaryPickHandle: $el.find('.secondary_pick .handle')[0],
                    hsv
                });

                set_hsv($el, hsv);

                $(secondaryPick).on('keydown', on_key_down_secondary_pick);
                $(secondaryPick).on('mousedown touchstart', on_mouse_down_secondary_pick);
                $(secondaryPick).on('touchmove', on_touch_move_secondary_pick);
            }
            // Behaviors
            else if (behavior === 'set_hsv') {
                const $el = $(el);
                const hsv = $el.data('hsv');
                const newHsv = args[0];
                if (newHsv && (hsv.h !== newHsv.h || hsv.s !== newHsv.s || hsv.v !== newHsv.v)) {
                    set_hsv($(el), newHsv);
                }
            }
            else if (behavior === 'get_hsv') {
                const hsv = $(el).data('hsv');
                returnValues.push(JSON.parse(JSON.stringify(hsv)));
            }
        }
        if (returnValues.length > 0) {
            return returnValues.length === 1 ? returnValues[0] : returnValues;
        } else {
            return this;
        }
    };

})(jQuery);