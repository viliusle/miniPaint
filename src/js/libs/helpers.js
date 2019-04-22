/**
 * various helpers
 * 
 * @author ViliusL
 */
class Helper_class {

	constructor() {
		this.time = null;
	}

	get_url_parameters() {
		var queryDict = {};
		location.search.substr(1).split("&").forEach(
			function (item) {
				queryDict[item.split("=")[0]] = item.split("=")[1];
			}
		);

		return queryDict;
	}

	/**
	 * starts timer
	 */
	timer_start() {
		this.time = Date.now();
	}

	/**
	 * calculates time between two calls.
	 * 
	 * @param {string} name Optional
	 * @param {boolean} echo Default is true.
	 */
	timer_end(name, echo) {
		var text = (Math.round(Date.now() - this.time) / 1000) + " s";
		if (echo != undefined && echo === false)
			return text;
		if (name != undefined)
			text += ' (' + name + ')';
		console.log(text);
	}

	//format time
	format_time(datetime) {
		return new Date(datetime).toJSON().slice(0, 19).replace(/T/g, ' ');
	}

	/**
	 * Find the position of the first occurrence of string or false.
	 * 
	 * @param {string} haystack
	 * @param {string} needle
	 * @param {int} offset
	 * @returns {Boolean|String}
	 */
	strpos(haystack, needle, offset) {
		var i = (haystack + '').indexOf(needle, (offset || 0));
		return i === -1 ? false : i;
	}

	/**
	 * return cookie value from global cookie
	 * 
	 * @param {string} name
	 * @returns {object|string}
	 */
	getCookie(name) {
		var cookie = this._getCookie('config');
		if (cookie == '')
			cookie = {};
		else
			cookie = JSON.parse(cookie);

		if (cookie[name] != undefined)
			return cookie[name];
		else
			return null;
	}

	/**
	 * sets cookie value to global cookie
	 * 
	 * @param {type} name
	 * @param {type} value
	 * @returns {undefined}
	 */
	setCookie(name, value) {
		var cookie = this._getCookie('config');
		if (cookie == '')
			cookie = {};
		else
			cookie = JSON.parse(cookie);

		cookie[name] = value;
		var cookie = JSON.stringify(cookie);

		this._setCookie('config', cookie);
	}

	_getCookie(NameOfCookie) {
		if (document.cookie.length > 0) {
			var begin = document.cookie.indexOf(NameOfCookie + "=");
			if (begin != -1) {
				begin += NameOfCookie.length + 1;
				var end = document.cookie.indexOf(";", begin);
				if (end == -1)
					end = document.cookie.length;
				return document.cookie.substring(begin, end);
			}
		}
		return '';
	}

	_setCookie(NameOfCookie, value, expire_days) {
		if (expire_days == undefined)
			expire_days = 180;
		var ExpireDate = new Date();
		ExpireDate.setTime(ExpireDate.getTime() + (expire_days * 24 * 3600 * 1000));
		document.cookie = NameOfCookie + "=" + value +
			((expire_days == null) ? "" : "; expires=" + ExpireDate.toGMTString());
	}

	delCookie(NameOfCookie) {
		if (this.getCookie(NameOfCookie)) {
			document.cookie = NameOfCookie + "=" +
				"; expires=Thu, 01-Jan-70 00:00:01 GMT";
		}
	}

	getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	font_pixel_to_height(px) {
		return Math.round(px * 0.75);
	}

	rgbToHex(r, g, b) {
		if (r > 255 || g > 255 || b > 255)
			throw "Invalid color component";
		var tmp = ((r << 16) | (g << 8) | b).toString(16);

		return "#" + ("000000" + tmp).slice(-6);
	}

	rgb2hex_all(rgb) {
		rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		return "#" + this.hex(rgb[1]) + this.hex(rgb[2]) + this.hex(rgb[3]);
	}

	hex(x) {
		x = parseInt(x);
		return ("0" + x.toString(16)).slice(-2);
	}

	hex2rgb(hex) {
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
	}

	remove_selection() {
		if (window.getSelection) {
			if (window.getSelection().empty) // Chrome
				window.getSelection().empty();
			else if (window.getSelection().removeAllRanges) // Firefox
				window.getSelection().removeAllRanges();
		}
		else if (document.selection) // IE?
			document.selection.empty();
	}

	//credits: richard maloney 2006
	darkenColor(color, v) {
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
	}

	/**
	 * JavaScript Number Formatter, author: KPL, KHL
	 * 
	 * @param {int} n
	 * @param {int} decPlaces
	 * @param {string} thouSeparator
	 * @param {string} decSeparator
	 * @returns {string}
	 */
	number_format(n, decPlaces, thouSeparator, decSeparator) {
		var decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces;
		var decSeparator = decSeparator == undefined ? "." : decSeparator;
		var thouSeparator = thouSeparator == undefined ? "," : thouSeparator;
		var sign = n < 0 ? "-" : "";
		var i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "";
		var j = (j = i.length) > 3 ? j % 3 : 0;
		return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
	}

	check_input_color_support() {
		var i = document.createElement("input");
		i.setAttribute("type", "color");
		return i.type !== "text";
	}

	b64toBlob(b64Data, contentType, sliceSize) {
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
	}

	escapeHtml(text) {
		return text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}

	isNumeric(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}

	/**
	 * Converts an HSL color value to RGB. 
	 * Assumes h, s, and l are contained in the set [0, 1]
	 * Returns r, g, and b in the set [0, 255].
	 *
	 * @param {number} h The hue
	 * @param {number} s The saturation
	 * @param {number} l The lightness
	 * @return {Array} The RGB representation
	 */
	hslToRgb(h, s, l) {
		var r, g, b;

		if (s == 0) {
			r = g = b = l; // achromatic
		}
		else {
			var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = this.hue2rgb(p, q, h + 1 / 3);
			g = this.hue2rgb(p, q, h);
			b = this.hue2rgb(p, q, h - 1 / 3);
		}

		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}

	hue2rgb(p, q, t) {
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
	}

	/**
	 * Converts an RGB color value to HSL. Values are in range 0-1. 
	 * But real ranges are 0-360, 0-100%, 0-100%
	 * 
	 * @param {number} r red color value
	 * @param {number} g green color value
	 * @param {number} b blue color value
	 * @return {object} The HSL representation
	 */
	rgbToHsl(r, g, b) {
		r /= 255;
		g /= 255;
		b /= 255;
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
		
		return {h, s, l};
	}

	ucfirst(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	/**
	 * change canvas size without loosing data
	 * 
	 * @param {canvas} canvas
	 * @param {int} width
	 * @param {int} height
	 * @param {int} offset_x
	 * @param {int} offset_y
	 */
	change_canvas_size(canvas, width, height, offset_x, offset_y) {
		if (offset_x == undefined)
			offset_x = 0;
		if (offset_y == undefined)
			offset_y = 0;

		//copy data;
		var tmp = document.createElement('canvas');
		var ctx = tmp.getContext("2d");
		tmp.width = canvas.width;
		tmp.height = canvas.height;
		ctx.drawImage(canvas, 0, 0);

		canvas.width = Math.max(1, width);
		canvas.height = Math.max(1, height);

		//restore image
		canvas.getContext("2d").drawImage(tmp, -offset_x, -offset_y);
	}

	image_round(ctx_main, mouse_x, mouse_y, size_w, size_h, img_data, anti_aliasing = false) {
		//create tmp canvas
		var canvasTmp = document.createElement('canvas');
		canvasTmp.width = size_w;
		canvasTmp.height = size_h;

		var size_half_w = Math.round(size_w / 2);
		var size_half_h = Math.round(size_h / 2);
		var ctx = canvasTmp.getContext("2d");
		var width = canvasTmp.width;
		var height = canvasTmp.height;
		var xx = mouse_x - size_half_w;
		var yy = mouse_y - size_half_h;

		ctx.clearRect(0, 0, width, height);
		ctx.save();
		//draw main data
		ctx.putImageData(img_data, 0, 0);
		ctx.globalCompositeOperation = 'destination-in';

		//create form
		var gradient = ctx.createRadialGradient(size_half_w, size_half_h, 0, size_half_w, size_half_h, size_half_w);
		gradient.addColorStop(0, '#ffffff');
		if (anti_aliasing == true)
			gradient.addColorStop(0.8, '#ffffff');
		else
			gradient.addColorStop(0.99, '#ffffff');
		gradient.addColorStop(1, 'rgba(255,255,255,0');
		ctx.fillStyle = gradient;

		ctx.beginPath();
		ctx.ellipse(size_half_w, size_half_h, size_w * 2, size_h * 2, 0, 0, 2 * Math.PI);
		ctx.fill();
		ctx_main.drawImage(canvasTmp, 0, 0, size_w, size_h, xx, yy, size_w, size_h);
		//reset
		ctx.restore();
		ctx.clearRect(0, 0, width, height);
	}
	
	//if IE 11 or Edge
	is_edge_or_ie() {
		//ie11
		if( !(window.ActiveXObject) && "ActiveXObject" in window )
			return true;
		//edge
		if( navigator.userAgent.indexOf('Edge/') != -1 )
			return true;
		return false;
	}

}
export default Helper_class;