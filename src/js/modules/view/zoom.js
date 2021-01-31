import GUI_preview_class from './../../core/gui/gui-preview.js';

class View_zoom_class {

	constructor() {
		this.GUI_preview = new GUI_preview_class();
	}

	in() {
		this.GUI_preview.zoom(1);
	}

	out() {
		this.GUI_preview.zoom(-1);
	}

	original() {
		this.GUI_preview.zoom(100);
	}

	auto() {
		this.GUI_preview.zoom_auto();
	}
}

export default View_zoom_class;
