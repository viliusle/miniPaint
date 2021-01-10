import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import File_open_class from './../modules/file/open.js';
import Dialog_class from './../libs/popup.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';

class Media_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.File_open = new File_open_class();
		this.POP = new Dialog_class();
		this.name = 'media';
		this.cache = [];
	}

	load() {
		//nothing
	}

	render(ctx, layer) {
		//nothing
	}

	on_activate() {
		this.search();
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
				html += '<div class="item">';
				html += '	<img class="displayBlock pointer" alt="" src="' + data[i].previewURL + '" data-url="' + data[i].webformatURL + '" />';
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
			//comment: 'Source: <a class="text_muted" href="https://pixabay.com/">pixabay.com</a>.',
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
						var data = {
							url: this.dataset.url,
						};
						_this.File_open.file_open_url_handler(data);
						_this.POP.hide();
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

export default Media_class;
