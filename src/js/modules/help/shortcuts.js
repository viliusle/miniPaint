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
				{title: "F9", value: 'Quick Save'},
				{title: "F10", value: 'Quick Load'},
				{title: "O", value: 'Open'},
				{title: "S", value: 'Save'},
				{title: "T", value: 'Trim'},
				{title: "F", value: 'Auto Adjust Colors'},
				{title: "G", value: 'Grid on/off'},
				{title: "L", value: 'Rotate left'},
				{title: "N", value: 'New layer'},
				{title: "R", value: 'Resize'},
				{title: "I", value: 'Information'},
				{title: "Scroll up", value: 'Zoom in'},
				{title: "Scroll down", value: 'Zoom out'},
				{title: "CTRL + Z", value: 'Undo'},
				{title: "CTRL + A", value: 'Select All'},
				{title: "CTRL + V", value: 'Paste'},
			],
		};
		this.POP.show(settings);
	}

}

export default Help_shortcuts_class;
