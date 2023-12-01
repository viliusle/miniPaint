/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import app from './../../app.js';
import config from './../../config.js';
import Helper_class from './../../libs/helpers.js';
import Tools_translate_class from './../../modules/tools/translate.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import Base_gui_class from '../base-gui.js';

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
		this.Tools_translate = new Tools_translate_class();
		this.Base_gui = new Base_gui_class();

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
				var full_key = moduleKey;
				if (moduleKey.indexOf('/') > -1) {
					var parts = moduleKey.split("/");
					moduleKey = parts[parts.length - 1];
				}

				var classObj = plugins_context(key);
				var object = new classObj.default(ctx);

				var title = _this.Helper.ucfirst(object.name);
				title = title.replace(/_/, ' ');

				_this.tools_modules[moduleKey] = {
					key: moduleKey,
					full_key: full_key,
					name: object.name,
					title: title,
					object: object,
				};

				//init events once
				if(typeof object.load != "undefined") {
					object.load();
				}
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
		if(saved_tool == 'media' || saved_tool == 'shape') {
			//bringing this back by default gives bad UX
			saved_tool = null
		}
		if (saved_tool != null) {
			this.active_tool = saved_tool;
		}

		//left menu
		for (var i in config.TOOLS) {
			var item = config.TOOLS[i];
			if(item.title)
				var title = item.title;
			else
				var title = this.Helper.ucfirst(item.name).replace(/_/, ' ');

			var itemDom = document.createElement('span');
			itemDom.id = item.name;
			itemDom.title = title;
			if (item.name == this.active_tool) {
				itemDom.className = 'item trn active ' + item.name;
			}
			else {
				itemDom.className = 'item trn ' + item.name;
			}
			if(item.visible === false){
				itemDom.style.display = 'none';
			}

			//event
			itemDom.addEventListener('click', function (event) {
				_this.activate_tool(this.id);
			});

			//register
			document.getElementById(target_id).appendChild(itemDom);
		}

		this.show_action_attributes();
		new app.Actions.Activate_tool_action(this.active_tool, true).do();
		this.Base_gui.check_canvas_offset();
	}

	async activate_tool(key) {
		return app.State.do_action(
			new app.Actions.Activate_tool_action(key)
		);
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

		const itemContainer = document.getElementById(target_id);

		itemContainer.innerHTML = "";

		const attributes = this.action_data().attributes;

		let itemDom;
		let currentButtonGroup = null;
		for (var k in attributes) {
			var item = attributes[k];

			var title = k[0].toUpperCase() + k.slice(1);
			title = title.replace("_", " ");

			if (typeof item == 'object' && typeof item.value == 'boolean' && item.icon) {
				if (currentButtonGroup == null) {
					currentButtonGroup = document.createElement('div');
					currentButtonGroup.className = 'ui_button_group no_wrap';
					itemDom = document.createElement('div');
					itemDom.className = 'item ' + k;
					itemContainer.appendChild(itemDom);
					itemDom.appendChild(currentButtonGroup);
				} else {
					itemDom.classList.add(k);
				}
			} else {
				itemDom = document.createElement('div');
				itemDom.className = 'item ' + k;
				itemContainer.appendChild(itemDom);
				currentButtonGroup = null;
			}

			if (typeof item == 'boolean' || (typeof item == 'object' && typeof item.value == 'boolean')) {
				//boolean - true, false

				let value = item;
				let icon = null;
				if (typeof item == 'object') {
					value = item.value;
					if (item.icon) {
						icon = item.icon;
					}
				}

				const element = document.createElement('button');
				element.className = 'trn';
				element.type = 'button';
				element.id = k;
				element.innerHTML = title;
				element.setAttribute('aria-pressed', value);
				if (icon) {
					element.classList.add('ui_icon_button');
					element.classList.add('input_height');
					element.innerHTML = icon;
					element.title = k;
					element.innerHTML = '<img style="width:16px;height:16px;" alt="'+title+'" src="images/icons/'+icon+'" />';
				} else {
					element.classList.add('ui_toggle_button');
				}
				//event
				element.addEventListener('click', (event) => {
					//toggle boolean
					var new_value = element.getAttribute('aria-pressed') !== 'true';
					const actionData = this.action_data();
					const attributes = actionData.attributes;
					const id = event.target.closest('button').id;
					if (typeof attributes[id] === 'object') {
						attributes[id].value = new_value;
					} else {
						attributes[id] = new_value;
					}
					element.setAttribute('aria-pressed', new_value);
					if (actionData.on_update != undefined) {
						//send event
						var moduleKey = actionData.name;
						var functionName = actionData.on_update;
						this.tools_modules[moduleKey].object[functionName]({ key: id, value: new_value });
					}
				});

				if (currentButtonGroup) {
					currentButtonGroup.appendChild(element);
				} else {
					itemDom.appendChild(element);
				}
			}
			else if (typeof item == 'number' || (typeof item == 'object' && typeof item.value == 'number')) {
				//numbers
				let min = 1;
				let max = k === 'power' ? 100 : 999;
				let value = item;
				let step = null;
				if (typeof item == 'object') {
					value = item.value;
					if (item.min != null) {
						min = item.min;
					}
					if (item.max != null) {
						max = item.max;
					}
					if (item.step != null) {
						step = item.step;
					}
				}

				var elementTitle = document.createElement('label');
				elementTitle.innerHTML = title + ':';
				elementTitle.id = 'attribute_label_' + k;
				elementTitle.className = 'trn';

				const elementInput = document.createElement('input');
				elementInput.type = 'number';
				elementInput.setAttribute('aria-labelledby', 'attribute_label_' + k);
				const $numberInput = $(elementInput)
					.uiNumberInput({
						id: k,
						min,
						max,
						value,
						step: step || 1,
						exponentialStepButtons: !step
					})
					.on('input', () => {
						let value = $numberInput.uiNumberInput('get_value');
						const id = $numberInput.uiNumberInput('get_id');
						const actionData = this.action_data();
						const attributes = actionData.attributes;
						if (typeof attributes[id] === 'object') {
							attributes[id].value = value;
						} else {
							attributes[id] = value;
						}

						if (actionData.on_update != undefined) {
							//send event
							var moduleKey = actionData.name;
							var functionName = actionData.on_update;
							this.tools_modules[moduleKey].object[functionName]({ key: id, value: value });
						}
					});

				itemDom.appendChild(elementTitle);
				itemDom.appendChild($numberInput[0]);
			}
			else if (typeof item == 'object') {
				//select

				var elementTitle = document.createElement('label');
				elementTitle.innerHTML = title + ':';
				elementTitle.for = k;
				elementTitle.className = 'trn';

				var selectList = document.createElement("select");
				selectList.id = k;
				const values = typeof item.values === 'function' ? item.values() : item.values;
				for (let j in values) {
					var option = document.createElement("option");
					if (item.value == values[j]) {
						option.selected = 'selected';
					}
					option.className = 'trn';
					option.name = values[j];
					option.value = values[j];
					option.text = values[j];
					selectList.appendChild(option);
				}
				//event
				selectList.addEventListener('change', (event) => {
					const actionData = this.action_data();
					actionData.attributes[event.target.id].value = event.target.value;

					if (actionData.on_update != undefined) {
						//send event
						var moduleKey = actionData.name;
						var functionName = actionData.on_update;
						const result = this.tools_modules[moduleKey].object[functionName]({ key: event.target.id, value: event.target.value });
						if (result) {
							// Allow the on_update function to modify the attribute value if necessary.
							if (result.new_values) {
								for (let key in result.new_values) {
									actionData.attributes[key].value = result.new_values[key];
								}
							}
						}
					}

					this.show_action_attributes();
				});

				itemDom.appendChild(elementTitle);
				itemDom.appendChild(selectList);
			}
			else if (typeof item == 'string' && item[0] == '#') {
				//color

				var elementTitle = document.createElement('label');
				elementTitle.innerHTML = title + ':';
				elementTitle.for = k;
				elementTitle.className = 'trn';

				var colorInput = document.createElement('input');
				colorInput.type = 'color';
				const $colorInput = $(colorInput)
					.uiColorInput({
						id: k,
						value: item
					})
					.on('change', () => {
						let value = $colorInput.uiColorInput('get_value');
						const id = $colorInput.uiColorInput('get_id');
						const actionData = this.action_data();
						actionData.attributes[id] = value;
						if (actionData.on_update != undefined) {
							//send event
							var moduleKey = actionData.name;
							var functionName = actionData.on_update;
							this.tools_modules[moduleKey].object[functionName]({ key: id, value: value });
						}
					});

				itemDom.appendChild(elementTitle);
				itemDom.appendChild($colorInput[0]);
			}
			else {
				alertify.error('Error: unsupported attribute type:' + typeof item + ', ' + k);
			}
		}

		if (config.LANG != 'en') {
			//retranslate
			this.Tools_translate.translate(config.LANG);
		}
	}

}

export default GUI_tools_class;
