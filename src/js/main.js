/**
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

//css
import './../css/reset.css';
import './../css/layout.css';
import './../css/menu.css';
import './../css/print.css';
import './../../node_modules/alertifyjs/build/css/alertify.min.css';
//js
import config from './config.js';
import Base_gui_class from './core/base-gui.js';
import Base_layers_class from './core/base-layers.js';
import Base_tools_class from './core/base-tools.js';
import Base_state_class from './core/base-state.js';

window.addEventListener('load', function (e) {
	//initiate app
	var Layers = new Base_layers_class();
	var Base_tools = new Base_tools_class(true);
	var GUI = new Base_gui_class();
	var Base_state = new Base_state_class();

	//register as global for quick or external access
	window.Layers = Layers;
	window.AppConfig = config;
	window.State = Base_state;	// window.State.save();

	//render all
	GUI.load_modules();
	GUI.load_default_values();
	GUI.render_main_gui();

	Layers.init();
}, false);
