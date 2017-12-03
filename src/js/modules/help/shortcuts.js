import Dialog_class from './../../libs/popup.js';

class Help_shortcuts_class {

	constructor() {
		this.POP = new Dialog_class();
	}

	//shortcuts
	shortcuts() {
		var settings = {
			title: 'Keyboard Shortcuts',
			params: [
				{title: "F9", value: 'Quick save'},
				{title: "F10", value: 'Quick load'},
				{title: "S", value: 'Save'},
				{title: "T", value: 'Trim'},
				{title: "F", value: 'Auto adjust colors'},
				{title: "G", value: 'Grid on/off'},
				{title: "L", value: 'Rotate left'},
				{title: "N", value: 'New layer'},
				{title: "R", value: 'Resize'},
				{title: "Scroll up", value: 'Zoom in'},
				{title: "Scroll down", value: 'Zoom out'},
				{title: "CTRL + Z", value: 'Undo'},
				{title: "CTRL + A", value: 'Select all'},
				{title: "CTRL + V", value: 'Paste'},
			],
		};
		this.POP.show(settings);
	}

}

export default Help_shortcuts_class;
