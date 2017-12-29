/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../../config.js';
import Helper_class from './../../libs/helpers.js';
import Help_translate_class from './../../modules/help/translate.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

var instance = null;

/**
 * GUI class responsible for rendering left sidebar tools
 */
class GUI_tools_class {

	constructor(GUI_class) {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Helper = new Helper_class();
		this.Help_translate = new Help_translate_class();

		//active tool
		this.active_tool = 'brush';
		this.tools_modules = {};
	}

	load_plugins() {
		var _this = this;
		var ctx = document.getElementById('canvas_minipaint').getContext("2d");
		var plugins_context = require.context("./../../tools/", true, /\.js$/);
		plugins_context.keys().forEach(function (key) {
			if (key.indexOf('Base' + '/') < 0) {
				var moduleKey = key.replace('./', '').replace('.js', '');
				var classObj = plugins_context(key);
				_this.tools_modules[moduleKey] = new classObj.default(ctx);

				//init events once
				_this.tools_modules[moduleKey].load();
			}
		});
	}

	render_main_tools() {
		this.load_plugins();

		this.render_tools();
	}

	render_tools() {
		var target_id = "tools_container";
		var _this = this;
		var saved_tool = this.Helper.getCookie('active_tool');
		if (saved_tool != null) {
			this.active_tool = saved_tool;
		}

		//left menu
		for (var i in config.TOOLS) {
			var item = config.TOOLS[i];

			var itemDom = document.createElement('span');
			itemDom.id = item.name;
			itemDom.title = item.title;
			if (item.name == this.active_tool) {
				itemDom.className = 'item trn active ' + item.name;
			}
			else {
				itemDom.className = 'item trn ' + item.name;
			}

			//event
			itemDom.addEventListener('click', function (event) {
				_this.activate_tool(this.id);
			});

			//register
			document.getElementById(target_id).appendChild(itemDom);
		}

		this.show_action_attributes();
		this.activate_tool(this.active_tool);
	}

	activate_tool(key) {
		//reset last
		document.querySelector('#tools_container .' + this.active_tool)
			.classList.remove("active");

		//send exit event to old previous tool
		if (config.TOOL.on_leave != undefined) {
			var moduleKey = config.TOOL.name;
			var functionName = config.TOOL.on_leave;
			this.tools_modules[moduleKey][functionName]();
		}

		//change active
		this.active_tool = key;
		document.querySelector('#tools_container .' + this.active_tool)
			.classList.add("active");
		for (var i in config.TOOLS) {
			if (config.TOOLS[i].name == this.active_tool) {
				config.TOOL = config.TOOLS[i];
			}
		}

		//check module
		if (this.tools_modules[key] == undefined) {
			alertify.error('Tools class not found: ' + key);
			return;
		}

		//send activate event to new tool
		if (config.TOOL.on_activate != undefined) {
			var moduleKey = config.TOOL.name;
			var functionName = config.TOOL.on_activate;
			this.tools_modules[moduleKey][functionName]();
		}

		this.show_action_attributes();
		this.Helper.setCookie('active_tool', this.active_tool);
		config.need_render = true;
	}

	action_data() {
		for (var i in config.TOOLS) {
			if (config.TOOLS[i].name == this.active_tool)
				return config.TOOLS[i];
		}

		//something wrong - select first tool
		this.active_tool = config.TOOLS[0].name;
		return config.TOOLS[0];
	}

	/**
	 * used strings: 
	 * "Fill", "Square", "Circle", "Radial", "Anti aliasing", "Circle", "Strict", "Burn"
	 */
	show_action_attributes() {
		var _this = this;
		var target_id = "action_attributes";

		document.getElementById(target_id).innerHTML = "";

		for (var k in this.action_data().attributes) {
			var item = this.action_data().attributes[k];

			var title = k[0].toUpperCase() + k.slice(1);
			title = title.replace("_", " ");

			var itemDom = document.createElement('span');
			itemDom.className = 'item ' + k;
			document.getElementById(target_id).appendChild(itemDom);

			if (typeof item == 'boolean') {
				//boolean - true, false

				var element = document.createElement('button');
				element.type = 'button';
				element.className = 'block-2';
				element.id = k;
				element.innerHTML = title;
				if (item == true) {
					element.className = 'active trn';
					element.dataset.param = false;
				}
				else {
					element.className = 'trn';
					element.dataset.param = true;
				}
				//event
				element.addEventListener('click', function (event) {
					//toggle boolean
					var new_value = JSON.parse(this.dataset.param);
					_this.action_data().attributes[this.id] = new_value;
					_this.show_action_attributes();

					if (_this.action_data().on_update != undefined) {
						//send event
						var moduleKey = _this.action_data().name;
						var functionName = _this.action_data().on_update;
						_this.tools_modules[moduleKey][functionName]();
					}
				});

				itemDom.appendChild(element);
			}
			else if (typeof item == 'number') {
				//numbers

				var elementTitle = document.createElement('span');
				elementTitle.innerHTML = title + ': ';

				var elementInput = document.createElement('input');
				elementInput.type = 'number';
				elementInput.id = k;
				elementInput.value = item;
				elementInput.addEventListener('keyup', function (event) {
					//validate number
					var value = parseInt(this.value);
					if (isNaN(value) || value < 1) {
						value = 1;
						_this.action_data().attributes[this.id] = value;
						_this.show_action_attributes();
					}
					if (value > 100 && this.id == 'power') {
						//max 100
						value = 100;
						_this.action_data().attributes[this.id] = value;
						_this.show_action_attributes();
					}
					_this.action_data().attributes[this.id] = value;
				});
				elementInput.addEventListener('change', function (event) {
					//validate number
					var value = parseInt(this.value);
					_this.action_data().attributes[this.id] = value;
				});

				var elementPlus = document.createElement('button');
				elementPlus.type = 'button';
				elementPlus.id = k;
				elementPlus.innerHTML = '+';
				elementPlus.dataset.target = k;
				elementPlus.addEventListener('click', function (event) {
					//increase
					var value = document.getElementById(this.dataset.target).value;
					value = Math.abs(parseInt(value));

					if (value >= 500)
						value = value + 100;
					else if (value >= 100)
						value = value + 50;
					else if (value >= 10)
						value = value + 10;
					else if (value >= 5)
						value = value + 5;
					else
						value = value + 1;

					if (value > 100 && this.id == 'power') {
						//max 100
						value = 100;
					}

					_this.action_data().attributes[this.id] = value;
					_this.show_action_attributes();
				});

				var elementMinus = document.createElement('button');
				elementMinus.type = 'button';
				elementMinus.id = k;
				elementMinus.innerHTML = '-';
				elementMinus.dataset.target = k;
				elementMinus.addEventListener('click', function (event) {
					//decrease
					var value = document.getElementById(this.dataset.target).value;
					value = Math.abs(parseInt(value));

					if (value > 500)
						value = value - 100;
					else if (value > 100)
						value = value - 50;
					else if (value > 10)
						value = value - 10;
					else if (value > 5)
						value = value - 5;
					else
						value = value - 1;
					value = Math.max(value, 1);

					_this.action_data().attributes[this.id] = value;
					_this.show_action_attributes();
				});

				itemDom.appendChild(elementTitle);
				itemDom.appendChild(elementInput);
				itemDom.appendChild(elementPlus);
				itemDom.appendChild(elementMinus);
			}
			else if (typeof item == 'object') {
				//select

				var elementTitle = document.createElement('span');
				elementTitle.innerHTML = title + ': ';

				var selectList = document.createElement("select");
				selectList.id = k;
				for (var j in item.values) {
					var option = document.createElement("option");
					if (item.value == item.values[j]) {
						option.selected = 'selected';
					}
					option.className = 'trn';
					option.name = item.values[j];
					option.value = item.values[j];
					option.text = item.values[j];
					selectList.appendChild(option);
				}
				//event
				selectList.addEventListener('change', function (event) {
					_this.action_data().attributes[this.id].value = this.value;
					_this.show_action_attributes();
				});

				itemDom.appendChild(elementTitle);
				itemDom.appendChild(selectList);
			}
			else if (typeof item == 'string' && item[0] == '#') {
				//color

				var elementTitle = document.createElement('span');
				elementTitle.innerHTML = title + ': ';

				var elementInput = document.createElement('input');
				elementInput.type = 'color';
				elementInput.id = k;
				elementInput.value = item;

				elementInput.addEventListener('keyup', function (event) {
					_this.action_data().attributes[this.id] = this.value;
				});
				elementInput.addEventListener('change', function (event) {
					_this.action_data().attributes[this.id] = this.value;
				});

				itemDom.appendChild(elementTitle);
				itemDom.appendChild(elementInput);
			}
			else {
				alertify.error('Error: unsupported attribute type:' + typeof item + ', ' + k);
			}
		}

		if (config.LANG != 'en') {
			//retranslate
			this.Help_translate.translate(config.LANG);
		}
	}

}

export default GUI_tools_class;
