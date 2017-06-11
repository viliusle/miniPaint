/* global POP, HELPER */
/* global VERSION */

var HELP = new HELP_CLASS();

/** 
 * manages help actions
 * 
 * @author ViliusL
 */
function HELP_CLASS() {
	
	//shortcuts
	this.help_shortcuts = function () {
		POP.add({title: "F9", value: 'Quick save'});
		POP.add({title: "F10", value: 'Quick load'});
		POP.add({title: "S", value: 'Save'});
		POP.add({title: "T", value: 'Trim'});
		POP.add({title: "D", value: 'Duplicate layer'});
		POP.add({title: "Del", value: 'Delete selection'});
		POP.add({title: "F", value: 'Auto adjust colors'});
		POP.add({title: "G", value: 'Grid on/off'});
		POP.add({title: "L", value: 'Rotate left'});
		POP.add({title: "N", value: 'New layer'});
		POP.add({title: "R", value: 'Resize'});
		POP.add({title: "-", value: 'Zoom out'});
		POP.add({title: "+", value: 'Zoom in'});
		POP.add({title: "CTRL + Z", value: 'Undo'});
		POP.add({title: "CTRL + A", value: 'Select all'});
		POP.add({title: "CTRL + V", value: 'Paste'});
		POP.add({title: "Arrow keys", value: 'Move active layer'});
		POP.show('Keyboard Shortcuts', '');
	};
	//about
	this.help_about = function () {
		var email = 'www.viliusl@gmail.com';
		POP.add({title: "Name:", value: "miniPaint"});
		POP.add({title: "Version:", value: VERSION});
		POP.add({title: "Author:", value: 'ViliusL'});
		POP.add({title: "Email:", html: '<a href="mailto:' + email + '">' + email + '</a>'});
		POP.add({title: "GitHub:", html: '<a href="https://github.com/viliusle/miniPaint">http://github.com/viliusle/miniPaint</a>'});
		POP.show('About', '');
	};
	
	//change language
	this.help_translate = function (lang_code) {
		
		//default English emty translator
		var dict_en = {};
		
		//save cookie
		if(lang_code != undefined && lang_code != LANG){
			HELPER.setCookie('language', lang_code);
		}
		
		var dictionary_data = "dict_"+lang_code;
		if(window[dictionary_data] != undefined || lang_code == 'en'){
			//translate
			$('body').translate({lang: lang_code, t: window[dictionary_data]});
			LANG = lang_code;	
		}
		else{
			console.log('Translate error, can not find dictionary: '+dictionary_data);
		}
	};
}