import config from './../../config.js';
import File_open_class from './open.js';
import Dialog_class from './../../libs/popup.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';

/** 
 * manages image search on https://pixabay.com/en/service/about/api/
 */
class File_search_media_class {

	constructor() {
		this.File_open = new File_open_class();
		this.POP = new Dialog_class();
		this.cache = [];
	}

	/**
	 * Image search api
	 * 
	 * @param {string} query
	 * @param {array} data
	 */
	search(query = '', data = []) {
		var _this = this;
		var html = '';

		var key = config.pixabay_key;
		key = key.split("").reverse().join("");

		if (data.length > 0) {
			for (var i in data) {
				html += '<div class="item pointer">';
				html += '<img class="displayBlock" alt="" src="' + data[i].previewURL + '" data-url="' + data[i].webformatURL + '" />';
				html += '</div>';
			}
			//fix for last line
			html += '<div class="item"></div>';
			html += '<div class="item"></div>';
			html += '<div class="item"></div>';
			html += '<div class="item"></div>';
		}

		var settings = {
			title: 'Search',
			comment: 'Source: <a class="grey" href="https://pixabay.com/">pixabay.com</a>.',
			className: 'wide',
			params: [
				{name: "query", title: "Keyword:", value: query},
			],
			on_load: function (params) {
				var node = document.createElement("div");
				node.classList.add('flex-container');
				node.innerHTML = html;
				document.querySelector('#popup #dialog_content').appendChild(node);
				//events
				var targets = document.querySelectorAll('#popup .item img');
				for (var i = 0; i < targets.length; i++) {
					targets[i].addEventListener('click', function (event) {
						//we have click
						window.State.save();
						var data = {
							url: this.dataset.url,
						};
						_this.File_open.file_open_url_handler(data);
					});
				}
			},
			on_finish: function (params) {
				if (params.query == '')
					return;

				if (_this.cache[params.query] != undefined) {
					//using cache

					setTimeout(function () {
						//only call same function after all handlers finishes
						var data = _this.cache[params.query];
						if (parseInt(data.totalHits) == 0) {
							alertify.error('Your search did not match any images.');
						}
						_this.search(params.query, data.hits);
					}, 100);
				}
				else {
					//query to service
					var URL = "https://pixabay.com/api/?key=" + key + "&per_page=50&q=" + encodeURIComponent(params.query);
					$.getJSON(URL, function (data) {
						_this.cache[params.query] = data;

						if (parseInt(data.totalHits) == 0) {
							alertify.error('Your search did not match any images.');
						}
						_this.search(params.query, data.hits);
					})
						.fail(function () {
							alertify.error('Error connecting to service.');
						});
				}
			},
		};
		this.POP.show(settings);
	}

}

export default File_search_media_class;

