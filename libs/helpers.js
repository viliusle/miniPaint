/* global WIDTH, HEIGHT, parseInt */

var HELPER = new HELPER_CLASS();

/**
 * various helpers
 * 
 * @author ViliusL
 */
function HELPER_CLASS() {
	var time;

	this.timer_init = function () {
		time = Date.now();
	};
	
	this.timer = function (s, echo) {
		var str = "time(" + s + ") = " + (Math.round(Date.now() - time) / 1000) + " s";
		if (echo === true)
			return str;
		else
			console.log(str);
	};
	
	//format time
	this.format_time = function(datetime){
		return new Date(datetime).toJSON().slice(0, 19).replace(/T/g, ' ');
	};
	
	this.strpos = function (haystack, needle, offset) {
		var i = (haystack + '').indexOf(needle, (offset || 0));
		return i === -1 ? false : i;
	};
	
	this.getCookie = function (NameOfCookie) {
		if (document.cookie.length > 0){
			begin = document.cookie.indexOf(NameOfCookie + "=");
			if (begin != -1){
				begin += NameOfCookie.length + 1;
				end = document.cookie.indexOf(";", begin);
				if (end == -1)
					end = document.cookie.length;
				return unescape(document.cookie.substring(begin, end));
			}
		}
		return '';
	};
	
	this.setCookie = function (NameOfCookie, value, expiredays) {
		if(expiredays == undefined)
			expiredays = 180;
		var ExpireDate = new Date();
		ExpireDate.setTime(ExpireDate.getTime() + (expiredays * 24 * 3600 * 1000));
		document.cookie = NameOfCookie + "=" + escape(value) +
			((expiredays == null) ? "" : "; expires=" + ExpireDate.toGMTString());
	};
	
	this.delCookie = function (NameOfCookie) {
		if (HELPER.getCookie(NameOfCookie)) {
			document.cookie = NameOfCookie + "=" +
				"; expires=Thu, 01-Jan-70 00:00:01 GMT";
		}
	};
	
	this.getRandomInt = function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};
	
	this.font_pixel_to_height = function (px) {
		return Math.round(px * 0.75);
	};
	
	this.rgbToHex = function (r, g, b) {
		if (r > 255 || g > 255 || b > 255)
			throw "Invalid color component";
		return ((r << 16) | (g << 8) | b).toString(16);
	};
	
	this.rgb2hex_all = function (rgb) {
		rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		return "#" + HELPER.hex(rgb[1]) + HELPER.hex(rgb[2]) + HELPER.hex(rgb[3]);
	};
	
	this.hex = function (x) {
		return ("0" + parseInt(x).toString(16)).slice(-2);
	};
	
	this.hex2rgb = function (hex) {
		if (hex[0] == "#")
			hex = hex.substr(1);
		if (hex.length == 3) {
			var temp = hex;
			hex = '';
			temp = /^([a-f0-9])([a-f0-9])([a-f0-9])$/i.exec(temp).slice(1);
			for (var i = 0; i < 3; i++)
				hex += temp[i] + temp[i];
		}
		var triplets = /^([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i.exec(hex).slice(1);
		return {
			r: parseInt(triplets[0], 16),
			g: parseInt(triplets[1], 16),
			b: parseInt(triplets[2], 16),
			a: 255
		};
	};
	
	this.remove_selection = function () {
		if (window.getSelection) {
			if (window.getSelection().empty) // Chrome
				window.getSelection().empty();
			else if (window.getSelection().removeAllRanges) // Firefox
				window.getSelection().removeAllRanges();
		}
		else if (document.selection) // IE?
			document.selection.empty();
	};
	
	this.get_dimensions = function () {
		var theWidth, theHeight;
		if (window.innerWidth) {
			theWidth = window.innerWidth;
		}
		else if (document.documentElement && document.documentElement.clientWidth) {
			theWidth = document.documentElement.clientWidth;
		}
		else if (document.body) {
			theWidth = document.body.clientWidth;
		}
		if (window.innerHeight) {
			theHeight = window.innerHeight;
		}
		else if (document.documentElement && document.documentElement.clientHeight) {
			theHeight = document.documentElement.clientHeight;
		}
		else if (document.body) {
			theHeight = document.body.clientHeight;
		}
		return [theWidth, theHeight];
	};
	
	//credits: richard maloney 2006
	this.darkenColor = function (color, v) {
		if (color.length > 6) {
			color = color.substring(1, color.length);
		}
		var rgb = parseInt(color, 16);
		var r = Math.abs(((rgb >> 16) & 0xFF) + v);
		if (r > 255)
			r = r - (r - 255);
		var g = Math.abs(((rgb >> 8) & 0xFF) + v);
		if (g > 255)
			g = g - (g - 255);
		var b = Math.abs((rgb & 0xFF) + v);
		if (b > 255)
			b = b - (b - 255);
		r = Number(r < 0 || isNaN(r)) ? 0 : ((r > 255) ? 255 : r).toString(16);
		if (r.length == 1)
			r = '0' + r;
		g = Number(g < 0 || isNaN(g)) ? 0 : ((g > 255) ? 255 : g).toString(16);
		if (g.length == 1)
			g = '0' + g;
		b = Number(b < 0 || isNaN(b)) ? 0 : ((b > 255) ? 255 : b).toString(16);
		if (b.length == 1)
			b = '0' + b;
		return "#" + r + g + b;
	};
	
	/**
	 * JavaScript Number Formatter, author: KPL, KHL
	 * 
	 * @param {int} n
	 * @param {int} decPlaces
	 * @param {string} thouSeparator
	 * @param {string} decSeparator
	 * @returns {string}
	 */
	this.number_format = function (n, decPlaces, thouSeparator, decSeparator) {
		var decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces;
		var decSeparator = decSeparator == undefined ? "." : decSeparator;
		var thouSeparator = thouSeparator == undefined ? "," : thouSeparator;
		var sign = n < 0 ? "-" : "";
		var i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "";
		var j = (j = i.length) > 3 ? j % 3 : 0;
		return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
	};
	
	this.chech_input_color_support = function (id) {
		if (document.getElementById(id).value != undefined && document.getElementById(id).value[0] == '#')
			return true;
		return false;
	};
	
	this.b64toBlob = function(b64Data, contentType, sliceSize) {
		contentType = contentType || '';
		sliceSize = sliceSize || 512;

		var byteCharacters = atob(b64Data);
		var byteArrays = [];

		for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			var slice = byteCharacters.slice(offset, offset + sliceSize);

			var byteNumbers = new Array(slice.length);
			for (var i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			var byteArray = new Uint8Array(byteNumbers);

			byteArrays.push(byteArray);
		}

		var blob = new Blob(byteArrays, {type: contentType});
		return blob;
	};
	this.escapeHtml = function(text){
		return text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	};
	this.isNumeric = function(n){
		return !isNaN(parseFloat(n)) && isFinite(n);
	};
	/**
	 * Converts an HSL color value to RGB. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes h, s, and l are contained in the set [0, 1] and
	 * returns r, g, and b in the set [0, 255].
	 *
	 * @param {number} h The hue
	 * @param {number} s The saturation
	 * @param {number} l The lightness
	 * @return {Array} The RGB representation
	 */
	this.hslToRgb = function (h, s, l) {
		var r, g, b;

		if (s == 0) {
			r = g = b = l; // achromatic
		}
		else {
			var hue2rgb = function hue2rgb(p, q, t) {
				if (t < 0)
					t += 1;
				if (t > 1)
					t -= 1;
				if (t < 1 / 6)
					return p + (q - p) * 6 * t;
				if (t < 1 / 2)
					return q;
				if (t < 2 / 3)
					return p + (q - p) * (2 / 3 - t) * 6;
				return p;
			};

			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = hue2rgb(p, q, h + 1 / 3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1 / 3);
		}

		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	};
	
	/**
	 * Converts an RGB color value to HSL. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
	 * Assumes r, g, and b are contained in the set [0, 255] and
	 * returns h, s, and l in the set [0, 1].
	 * 
	 * @param {number} r red color value
	 * @param {number} g green color value
	 * @param {number} b blue color value
	 * @return {Array} The HSL representation
	 */
	this.rgbToHsl = function (r, g, b) {
		r /= 255, g /= 255, b /= 255;
		var max = Math.max(r, g, b), min = Math.min(r, g, b);
		var h, s, l = (max + min) / 2;

		if (max == min) {
			h = s = 0; // achromatic
		}
		else {
			var d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch (max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / d + 2;
					break;
				case b:
					h = (r - g) / d + 4;
					break;
			}
			h /= 6;
		}

		return [h, s, l];
	};
}
