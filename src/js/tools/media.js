import app from './../app.js';
import config from './../config.js';
import Base_tools_class from './../core/base-tools.js';
import File_open_class from './../modules/file/open.js';
import Tools_settings_class from './../modules/tools/settings.js';
import Dialog_class from './../libs/popup.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';

class Media_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.File_open = new File_open_class();
		this.Tools_settings = new Tools_settings_class();
		this.POP = new Dialog_class();
		this.name = 'media';
		this.cache = [];
		this.page = 1;
		this.per_page = 50;
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
	 * @param pages
	 */
	search(query = '', data = [], pages = null) {
		var _this = this;
		var html = '';
		var html_paging = '';

		var key = config.pixabay_key;
		key = key.split("").reverse().join("");

		var safe_search = this.Tools_settings.get_setting('safe_search');

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

			//paging
			html_paging += '<div class="media-paging" id="media_paging">';
			html_paging += '<button type="button" data-value="1" title="Previous">&lt;</button> ';
			for(var i = 1; i <= Math.min(10, pages); i++) {
				var selected = '';
				if(this.page == i){
					var selected = 'selected';
				}
				html_paging += '<button type="button" class="'+selected+'" data-value="'+i+'">'+i+'</button> ';
			}
			html_paging += '<button type="button" data-value="'+Math.min(this.page + 1, pages)+'" title="Next">&gt;</button> ';
			html_paging += '</div>';
		}
		else{
			this.page = 1;
		}

		var settings = {
			title: 'Search',
			//comment: 'Source: <a class="text_muted" href="https://pixabay.com/">pixabay.com</a>.',
			className: 'wide',
			params: [
				{name: "query", title: "Keyword:", value: query},
			],
			on_load: function (params, popup) {
				var node = document.createElement("div");
				node.classList.add('flex-container');
				node.innerHTML = html + html_paging;
				popup.el.querySelector('.dialog_content').appendChild(node);
				//events
				var targets = popup.el.querySelectorAll('.item img');
				for (var i = 0; i < targets.length; i++) {
					targets[i].addEventListener('click', function (event) {
						//we have click
						var data = {
							url: this.dataset.url,
						};
						_this.File_open.file_open_url_handler(data);
						_this.POP.hide();

						new app.Actions.Activate_tool_action('select', true).do();
					});
				}
				var targets = popup.el.querySelectorAll('#media_paging button');
				for (var i = 0; i < targets.length; i++) {
					targets[i].addEventListener('click', function (event) {
						//we have click
						_this.page = parseInt(this.dataset.value);
						_this.POP.save();
					});
				}
			},
			on_finish: function (params) {
				if (params.query == '')
					return;

				var URL = "https://pixabay.com/api/?key=" + key
					+ "&page=" + _this.page
					+ "&per_page=" + _this.per_page
					+ "&safesearch=" + safe_search
					+ "&q="	+ encodeURIComponent(params.query);

				if (_this.cache[URL] != undefined) {
					//using cache

					setTimeout(function () {
						//only call same function after all handlers finishes
						var data = _this.cache[URL];

						if (parseInt(data.totalHits) == 0) {
							alertify.error('Your search did not match any images.');
						}

						var pages = Math.ceil(data.totalHits / _this.per_page);
						_this.search(params.query, data.hits, pages);
					}, 100);
				}
				else {
					//query to service
					$.getJSON(URL, function (data) {
						_this.cache[URL] = data;

						if (parseInt(data.totalHits) == 0) {
							alertify.error('Your search did not match any images.');
						}

						var pages = Math.ceil(data.totalHits / _this.per_page);
						_this.search(params.query, data.hits, pages);
					})
					.fail(function () {
						alertify.error('Error connecting to service.');
					});
				}
			},
		};
		this.POP.show(settings);

		document.getElementById("pop_data_query").select();
	}
}

export default Media_class;
