// https://github.com/jorgejeferson/translate.js/tree/39be8237666a76035fc210a28d8e431f1416579e
(function ($) {
	$.fn.translate = function (options) {
		var that = this; //a reference to ourselves
		var settings = {
			css: "trn",
			attrs: ["alt", "placeholder", "title"],
			lang: "pt",
			langDefault: "pt",
		};
		settings = $.extend(settings, options || {});
		if (settings.css.lastIndexOf(".", 0) !== 0) { //doesn't start with '.'
			settings.css = "." + settings.css;
		}
		var t = settings.t;
		//public methods
		this.lang = function (l) {
			if (l) {
				settings.lang = l;
				this.translate(settings);  //translate everything
			}
			return settings.lang;
		};
		this.get = function (index) {
			var res = index;

			try {
				res = t[index][settings.lang];
			}
			catch (err) { //not found, return index
				return index;
			}
			if (res) {
				return res;
			}
			else {
				return index;
			}
		};
		this.g = this.get;
		//main
		this.find(settings.css).each(function (i) {
			var $this = $(this);

			var trn_key = $this.attr("data-trn-key");
			if (!trn_key) {
				trn_key = $this.html();
				$this.attr("data-trn-key", trn_key);
			}
			// Filtering attr
			$.each(this.attributes, function () {
				if ($.inArray(this.name, settings.attrs) !== -1) {
					var trn_attr_key = $this.attr("data-trn-attr");
					if (!trn_attr_key) {
						trn_attr_key = $this.attr(this.name);
						$this.attr("data-trn-attr", trn_attr_key);
					}
					$this.attr(this.name, that.get(trn_attr_key));
				}
			});
			$this.html(that.get(trn_key));
		});
		return this;
	};
})(jQuery);
