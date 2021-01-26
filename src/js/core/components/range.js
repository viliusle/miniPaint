
(function ($) {

	const template = `
		<div class="ui_range" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0">
			<div class="padded_track"></div>
			<div class="bar">
				<div class="handle"></div>
			</div>
		</div>
	`;

	const on_keydown_range = (event) => {
		const $el = $(event.target.closest('.ui_range'));
		const key = event.key;
		const { value, step, min, max } = $el.data();
		if (['Left', 'ArrowLeft', 'Down', 'ArrowDown'].includes(key)) {
			event.preventDefault();
			set_value($el, value - step);
			$el.trigger('input');
		}
		else if (['Right', 'ArrowRight', 'Up', 'ArrowUp'].includes(key)) {
			event.preventDefault();
			set_value($el, value + step);
			$el.trigger('input');
		}
		else if (['PageUp'].includes(key)) {
			event.preventDefault();
			set_value($el, value + (step * 10));
			$el.trigger('input');
		}
		else if (['PageDown'].includes(key)) {
			event.preventDefault();
			set_value($el, value - (step * 10));
			$el.trigger('input');
		}
		else if (['Home'].includes(key)) {
			event.preventDefault();
			set_value($el, min);
			$el.trigger('input');
		}
		else if (['End'].includes(key)) {
			event.preventDefault();
			set_value($el, max);
			$el.trigger('input');
		}
	};

	const on_wheel_range = (event) => {
		const $el = $(event.target.closest('.ui_range'));
		if (document.activeElement === $el[0]) {
			const { value, step } = $el.data();
			if (event.originalEvent.deltaY < 0) {
				event.preventDefault();
				set_value($el, value + step);
				$el.trigger('input');
			}
			else if (event.originalEvent.deltaY > 0) {
				event.preventDefault();
				set_value($el, value - step);
				$el.trigger('input');
			}
		}
	};

	const on_mouse_down_range = (event) => {
		event.preventDefault();
		const target = event.touches && event.touches.length > 0 ? event.touches[0].target : event.target;
		const $el = $(target.closest('.ui_range'));
		const { handle, paddedTrack, value, min, max, vertical } = $el.data();
		const mouseDownClientX = event.touches && event.touches.length > 0 ? event.touches[0].clientX : event.clientX;
		const mouseDownClientY = event.touches && event.touches.length > 0 ? event.touches[0].clientY : event.clientY;
		const mouseDownPaddedTrackRect = paddedTrack.getBoundingClientRect();
		let mouseDownValue = value;
		if (target !== handle) {
			let range, valueInRange;
			if (vertical) {
				range = mouseDownPaddedTrackRect.top - mouseDownPaddedTrackRect.bottom;
				valueInRange = mouseDownClientY - mouseDownPaddedTrackRect.bottom;
			} else {
				range = mouseDownPaddedTrackRect.right - mouseDownPaddedTrackRect.left;
				valueInRange = mouseDownClientX - mouseDownPaddedTrackRect.left;
			}
			const ratio = Math.max(0, Math.min(1, valueInRange / range));
			mouseDownValue = (max - min) * ratio;
			set_value($el, mouseDownValue);
			$el.trigger('input');
		}
		$el.data({
			mouseDownValue,
			mouseDownClientX,
			mouseDownClientY,
			mouseDownPaddedTrackRect,
			mouseMoveWindowHandler: generate_on_mouse_move_window($el),
			mouseUpWindowHandler: generate_on_mouse_up_window($el)
		});
		$el.addClass('active');
		const $window = $(window);
		$window.on('mousemove touchmove', $el.data('mouseMoveWindowHandler'));
		$window.on('mouseup touchend', $el.data('mouseUpWindowHandler'));
		$el[0].focus();
	};

	const on_touch_move_range = (event) => {
		event.preventDefault();
	};

	const generate_on_mouse_move_window = ($el) => {
		return (event) => {
			event.preventDefault();
			event.stopPropagation();
			const { mouseDownValue, min, max, vertical, mouseDownClientX, mouseDownClientY, mouseDownPaddedTrackRect } = $el.data();
			let range, offset, startValue;
			if (vertical) {
				const clientY = event.touches && event.touches.length > 0 ? event.touches[0].clientY : event.clientY;
				range = mouseDownPaddedTrackRect.top - mouseDownPaddedTrackRect.bottom;
				const mouseDownValueInPixelRange = ((mouseDownValue - min) / (max - min)) * range;
				startValue = mouseDownClientY - mouseDownPaddedTrackRect.bottom;
				offset = clientY - mouseDownClientY + (mouseDownValueInPixelRange - startValue);
			} else {
				const clientX = event.touches && event.touches.length > 0 ? event.touches[0].clientX : event.clientX;
				range = mouseDownPaddedTrackRect.right - mouseDownPaddedTrackRect.left;
				const mouseDownValueInPixelRange = ((mouseDownValue - min) / (max - min)) * range;
				startValue = mouseDownClientX - mouseDownPaddedTrackRect.left;
				offset = clientX - mouseDownClientX + (mouseDownValueInPixelRange - startValue);
			}
			const ratio = Math.max(0, Math.min(1, (startValue + offset) / range));
			const value = (max - min) * ratio;
			set_value($el, value);
			$el.trigger('input');
		};
	};

	const generate_on_mouse_up_window = ($el) => {
		return (event) => {
			const $window = $(window);
			$el.removeClass('active');
			$window.off('mousemove touchmove', $el.data('mouseMoveWindowHandler'));
			$window.off('mouseup touchend', $el.data('mouseUpWindowHandler'));
		};
	};

	const set_value = ($el, value) => {
		const { bar, min, max, step, vertical } = $el.data();
		value = step * Math.round(value / step);
		value = Math.max(min, Math.min(max, value));
		$el.data('value', value);
		$el.attr('aria-valuemin', min);
		$el.attr('aria-valuemax', max);
		$el.attr('aria-valuenow', value);
		if (vertical) {
			bar.style.height = (((value - min) / (max - min)) * 100) + '%';
		} else {
			bar.style.width = (((value - min) / (max - min)) * 100) + '%';
		}
	};

	$.fn.uiRange = function(behavior, ...args) {
		let returnValues = [];
		for (let i = 0; i < this.length; i++) {
			let el = this[i];

			// Constructor
			if (Object.prototype.toString.call(behavior) !== '[object String]') {
				const definition = behavior || {};

				const classList = el.className;
				const id = definition.id != null ? definition.id : el.getAttribute('id'); 
				const value = definition.value != null ? definition.value : parseFloat(el.value) || 0;
				const min = definition.min != null ? definition.min : parseFloat(el.getAttribute('min')) || 0;
				const max = definition.max != null ? definition.max : parseFloat(el.getAttribute('max')) || 0;
				const step = definition.step != null ? definition.step : el.hasAttribute('step') ? parseFloat(el.getAttribute('step')) : 1;
				const vertical = !!definition.vertical;

				$(el).after(template);
				const oldEl = el;
				el = el.nextElementSibling;
				$(oldEl).remove();
				this[i] = el;
				const $el = $(el);

				if (classList) {
					el.classList.add(classList);
				}
				if (vertical) {
					el.classList.add('vertical');
				}
				if (id) {
					el.setAttribute('id', id);
				}

				$el.data({
					paddedTrack: $('.padded_track', el).get(0),
					bar: $('.bar', el).get(0),
					handle: $('.handle', el).get(0),
					vertical,
					value,
					min,
					max,
					step
				});

				set_value($el, value);

				$el
					.on('mousedown touchstart', on_mouse_down_range)
					.on('touchmove', on_touch_move_range)
					.on('keydown', on_keydown_range)
					.on('wheel', on_wheel_range);
			}
			// Behaviors
			else if (behavior === 'set_background') {
				const backgroundStyle = args[0];
				$(el).data('paddedTrack').style.background = backgroundStyle;
			}
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
		}
		if (returnValues.length > 0) {
			return returnValues.length === 1 ? returnValues[0] : returnValues;
		} else {
			return this;
		}
	};

})(jQuery);