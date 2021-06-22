/*
 * miniPaint - https://github.com/viliusle/miniPaint
 * author: Vilius L.
 */

import config from './../config.js';
import Dialog_class from './../libs/popup.js';
import Base_gui_class from './base-gui.js';
const fuzzysort = require('fuzzysort');

var instance = null;

class Base_search_class {

	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.POP = new Dialog_class();
		this.Base_gui = new Base_gui_class();
		this.db = null;

		this.events();
	}

	events() {
		document.addEventListener('keydown', (event) => {
			if (this.POP.get_active_instances() > 0) {
				return;
			}

			var code = event.key;
			if (code == "F3" || ( (event.ctrlKey == true || event.metaKey) && code == "f")) {
				//open
				this.search();
				event.preventDefault();
			}
		}, false);

		document.addEventListener('input', (event) => {
			if(document.querySelector('#pop_data_search') == null){
				return;
			}

			var node = document.querySelector('#global_search_results');
			node.innerHTML = '';

			var query = event.target.value;
			if(query == ''){
				return;
			}

			let results = fuzzysort.go(query, this.db, {
				keys: ['title'],
				limit: 10,
				threshold: -50000,
			});

			//show
			for(var i = 0; i < results.length; i++) {
				var item = results[i];

				var className = "search-result n" + (i+1);
				if(i == 0){
					className += " active";
				}

				node.innerHTML += "<div class='"+className+"' data-key='"+item.obj.key+"'>"
					+ fuzzysort.highlight(item[0]) + "</div>";
			}
		}, false);

		//allow to select with arrow keys
		document.addEventListener('keydown', function (e) {
			if(document.querySelector('#global_search_results') == null
				|| document.querySelector('.search-result') == null){
				return;
			}
			var k = e.key;

			if (k == "ArrowUp") {
				var target = document.querySelector('.search-result.active');
				var index = Array.from(target.parentNode.children).indexOf(target);
				if(index > 0){
					index--;
				}
				target.classList.remove('active');
				var target2 =document.querySelector('#global_search_results').childNodes[index];
				target2.classList.add('active');
				e.preventDefault();
			}
			else if (k == "ArrowDown") {
				var target = document.querySelector('.search-result.active');
				var index = Array.from(target.parentNode.children).indexOf(target);
				var total = target.parentNode.childElementCount;
				if(index < total - 1){
					index++;
				}
				target.classList.remove('active');
				var target2 = document.querySelector('#global_search_results').childNodes[index];
				target2.classList.add('active');
				e.preventDefault();
			}

		}, false);
	}

	search() {
		var _this = this;

		//init DB
		if(this.db === null) {
			this.db = Object.keys(this.Base_gui.modules);
			for(var i in this.db){
				this.db[i] = {
					key: this.db[i],
					title: this.db[i].replace(/_/i, ' '),
				};
			}
		}

		var settings = {
			title: 'Search',
			params: [
				{name: "search", title: "Search:", value: ""},
			],
			on_load: function (params, popup) {
				var node = document.createElement("div");
				node.id = 'global_search_results';
				node.innerHTML = '';
				popup.el.querySelector('.dialog_content').appendChild(node);
			},
			on_finish: function (params) {
				//execute
				var target = document.querySelector('.search-result.active');
				if(target){
					//execute
					var key = target.dataset.key;
					var class_object = this.Base_gui.modules[key];
					var function_name = _this.get_function_from_path(key);

					_this.POP.hide();
					class_object[function_name]();
				}
			},
		};
		this.POP.show(settings);

		//on input change
		document.getElementById("pop_data_search").select();
	}

	get_function_from_path(path){
		var parts = path.split("/");
		var result = parts[parts.length - 1];
		result = result.replace(/-/, '_');

		return result;
	}

}

export default Base_search_class;
