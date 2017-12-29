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
	}

}

export default GUI_menu_class;
