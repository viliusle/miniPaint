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
	
	//IntegraXor Web SCADA - JavaScript Number Formatter, author: KPL, KHL
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
}
