/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../../config.js';
import menu_template from './../../config-menu.js';
import ddsmoothmenu from './../../libs/menu.js';

/**
 * class responsible for rendering main menu
 */
class GUI_menu_class {

	render_main() {
		document.getElementById('main_menu').innerHTML = menu_template;
		ddsmoothmenu.init({
			mainmenuid: "main_menu",
			method: 'toggle', //'hover' (default) or 'toggle'
			contentsource: "markup",
		});

		// Additional logic for ddsmoothmenu library:
		// Add CSS class to primary dropdown to identify when to toggle scrolling for mobile.
		document.getElementById('main_menu').addEventListener('click', (e) => {
			const target = e.target;
			if (!target || !target.parentNode) return;
			if (target.parentNode.classList.contains('more')) {
				var parentList = target.closest('ul');
				var wasSelected = target.classList.contains('selected');
				setTimeout(() => {
					parentList.classList.toggle('expanded', !wasSelected);
				}, 1);
			} else if (target.tagName === 'A' && target.matches('#main_menu > ul > li > a')) {
				target.nextElementSibling.classList.remove('expanded');
			}
		}, true);
	}

}

export default GUI_menu_class;
