(function ($) {

    const template = `
        <div class="ui_swatches">
			<div class="swatch_group" tabindex="0">
            </div>
        </div>
    `;

    const on_key_down_swatches = (event) => {
        const $el = $(event.target.closest('.ui_swatches'));
        const key = event.key;
        const { rows, count, selectedIndex } = $el.data();
        if (['Left', 'ArrowLeft'].includes(key)) {
            event.preventDefault();
            set_selected_index($el, selectedIndex - 1);
            $el.trigger('input');
        }
        else if (['Right', 'ArrowRight'].includes(key)) {
            event.preventDefault();
            set_selected_index($el, selectedIndex + 1);
            $el.trigger('input');
        }
        else if (['Up', 'ArrowUp'].includes(key)) {
            event.preventDefault();
            set_selected_index($el, selectedIndex - Math.floor(count / rows));
            $el.trigger('input');
        }
        else if (['Down', 'ArrowDown'].includes(key)) {
            event.preventDefault();
            set_selected_index($el, selectedIndex + Math.floor(count / rows));
            $el.trigger('input');
        }
    };

    const on_click_swatches = (event) => {
        const target = event.target;
        const $el = $(target.closest('.ui_swatches'));
        if (target.classList.contains('swatch')) {
            const { swatches } = $el.data();
            set_selected_index($el, swatches.indexOf(target));
            $el.trigger('input');
        }
    };

    const set_selected_index = ($el, index) => {
        const { swatches } = $el.data();
        if (swatches[index]) {
            $el.find('.active').removeClass('active');
            $el.data('selectedIndex', index);
            $(swatches[index]).addClass('active');
        }
    };

    const set_selected_hex = ($el, hex) => {
        const { selectedIndex, swatches } = $el.data();
        if (/^\#[0-9A-F]{6}$/gi.test(hex)) {
            const swatch = swatches[selectedIndex];
            $(swatch)
                .data('hex', hex)
                .css('background-color', hex);
        }
    };

    $.fn.uiSwatches = function(behavior, ...args) {
        let returnValues = [];
        for (let i = 0; i < this.length; i++) {
            let el = this[i];

            // Constructor
            if (Object.prototype.toString.call(behavior) !== '[object String]') {
                const definition = behavior || {};

                const id = definition.id != null ? definition.id : el.getAttribute('id');
                const rows = definition.rows || 1;
                const count = definition.count || 10;
                const selectedIndex = definition.selectedIndex != null ? definition.selectedIndex : 0;

                $(el).after(template);
                const oldEl = el;
                el = el.nextElementSibling;
                $(oldEl).remove();
                this[i] = el;

                const $el = $(el);

                const swatchGroup = $el.find('.swatch_group')[0];

                if (id) {
                    el.setAttribute('id', id);
                }
                swatchGroup.classList.add('rows_' + rows);

                const swatches = [];
                for (let i = 0; i < count; i++) {
                    const swatch = document.createElement('div');
                    swatch.classList.add('swatch');
                    $(swatch).data('hex', '#ffffff');
                    swatches.push(swatch);
                    swatchGroup.appendChild(swatch);
                    if (i === selectedIndex) {
                        swatch.classList.add('active');
                    }
                }

                $el.data({
                    selectedIndex,
                    swatchGroup,
                    swatches,
                    count,
                    rows
                });

                $el
                    .on('click', on_click_swatches)
                    .on('keydown', on_key_down_swatches);
            }
            // Behaviors
            else if (behavior === 'set_selected_hex') {
                const newValue = args[0] + '';
                set_selected_hex($(el), newValue);
            }
            else if (behavior === 'get_selected_hex') {
                const { selectedIndex, swatches } = $(el).data();
                returnValues.push($(swatches[selectedIndex]).data('hex'));
            }
        }
        if (returnValues.length > 0) {
            return returnValues.length === 1 ? returnValues[0] : returnValues;
        } else {
            return this;
        }
    };

})(jQuery);