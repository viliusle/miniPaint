var HELPER = new HELPER_CLASS();

function HELPER_CLASS(){
	var time;
	
	this.drawImage_round = function(canvas, mouse_x, mouse_y, size, img_data, canvas_tmp, anti_alias){
		var size_half = Math.round(size/2);
		var ctx_tmp = canvas_tmp.getContext("2d");
		var xx = mouse_x - size_half;
		var yy = mouse_y - size_half;
		if(xx < 0) xx = 0;
		if(yy < 0) yy = 0;
		
		ctx_tmp.clearRect(0, 0, WIDTH, HEIGHT);
		ctx_tmp.save();
		//draw main data
		try{
			ctx_tmp.drawImage(img_data, mouse_x - size_half, mouse_y - size_half, size, size);
			}
		catch(err){
			try{
				ctx_tmp.putImageData(img_data, xx, yy);	
				}
			catch(err){
				console.log("Error: "+err.message);
				}
			}
		ctx_tmp.globalCompositeOperation = 'destination-in';
			
		//create form
		ctx_tmp.fillStyle = '#ffffff';
		if(anti_alias == true){
			var gradient = ctx_tmp.createRadialGradient(mouse_x, mouse_y, 0, mouse_x, mouse_y, size_half);
			gradient.addColorStop(0,   '#ffffff');
			gradient.addColorStop(0.8, '#ffffff');
			gradient.addColorStop(1,   'rgba(25115,255,255,0');
			ctx_tmp.fillStyle = gradient;
			}
		ctx_tmp.beginPath();
		ctx_tmp.arc(mouse_x, mouse_y, size_half, 0, 2*Math.PI, true);
		ctx_tmp.fill();
		//draw final data
		if(xx + size > WIDTH)
			size = WIDTH - xx;
		if(yy + size > HEIGHT)
			size = HEIGHT - yy;
		canvas.drawImage(canvas_tmp, xx, yy, size, size, xx, yy, size, size);
		//reset
		ctx_tmp.restore();
		ctx_tmp.clearRect(0, 0, WIDTH, HEIGHT);
		};
	this.timer_init = function(){
		time = Date.now();
		};
	this.timer = function(s, echo){
		var str = "time("+s+") = "+(Math.round(Date.now() - time)/1000)+" s";
		if(echo === true)
			return str;
		else
			console.log(str);
		};
	//get url param
	this.get_url_param = function(name){
		name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");  
		var regexS = "[\\?&]"+name+"=([^&#]*)";  
		var regex = new RegExp( regexS );  
		var results = regex.exec( window.location.href ); 
		if( results == null )    
			return "";  
		else    
			return results[1];
		};
	this.strpos = function(haystack, needle, offset) {
		var i = (haystack+'').indexOf(needle, (offset || 0));
		return i === -1 ? false : i;
		};
	this.sleep = function(millis){
		var date = new Date();
		var curDate = null;
		do { curDate = new Date(); }
		while(curDate-date < millis);
		};
	this.js_dump = function(arr,level) {
		var dumped_text = "";
		if(!level) level = 0;
		
		//The padding given at the beginning of the line.
		var level_padding = "";
		for(var j=0;j<level+1;j++) level_padding += "    ";
		
		if(typeof(arr) == 'object') { //Array/Hashes/Objects 
			for(var item in arr) {
				var value = arr[item];
				
				if(typeof(value) == 'object') { //If it is an array,
					dumped_text += level_padding + "'" + item + "' ...\n";
					dumped_text += dump(value,level+1);
				} else {
					dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
				}
			}
		} else { //Stings/Chars/Numbers etc.
			dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
		}
		alert(dumped_text);
		};
	this.unique = function(list){
	        var o = {}, i, l = list.length, r = [];
	        for(i=0; i<l;i+=1) o[list[i]] = list[i];
	        for(i in o) r.push(o[i]);
	        return r;
		};
	this.preload = function(image) {
		var imageObj = new Image();
		imageObj.src=image;
		};
	this.getCookie = function(NameOfCookie){
		if (document.cookie.length > 0)
		{ begin = document.cookie.indexOf(NameOfCookie+"=");
		if (begin != -1)
		{ begin += NameOfCookie.length+1;
		end = document.cookie.indexOf(";", begin);
		if (end == -1) end = document.cookie.length;
		return unescape(document.cookie.substring(begin, end)); }
		}
		return '';
		};
	this.setCookie = function(NameOfCookie, value, expiredays){ 
		var ExpireDate = new Date ();
		ExpireDate.setTime(ExpireDate.getTime() + (expiredays * 24 * 3600 * 1000));
		document.cookie = NameOfCookie + "=" + escape(value) +
		((expiredays == null) ? "" : "; expires=" + ExpireDate.toGMTString());
		};
	this.delCookie = function(NameOfCookie){
		if (HELPER.getCookie(NameOfCookie)) {
			document.cookie = NameOfCookie + "=" +
			"; expires=Thu, 01-Jan-70 00:00:01 GMT";
			}
		};
	/*
	ctx.strokeStyle = "#2d6";
	ctx.fillStyle = "#abc";
	HELPER.roundRect(ctx, 100, 200, 200, 100, 50, true);
	*/
	this.roundRect = function(ctx, x, y, width, height, radius, fill, stroke){
		if (typeof stroke == "undefined" ){
			stroke = true;
			}
		if (typeof radius === "undefined"){
			radius = 5;
			}
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
		if (stroke){
			ctx.stroke();
			}
		if (fill){
			ctx.fill();
			}        
		};
	this.getRandomInt = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
		};
	//dashed objects
	this.dashedRect = function(canvas, x1, y1, x2, y2, dashLen, color) {
		HELPER.dashedLine(canvas, x1, y1, x2, y1, dashLen, color);
		HELPER.dashedLine(canvas, x2, y1, x2, y2, dashLen, color);
		HELPER.dashedLine(canvas, x2, y2, x1, y2, dashLen, color);
		HELPER.dashedLine(canvas, x1, y2, x1, y1, dashLen, color);
		};
	this.dashedLine = function(canvas, x1, y1, x2, y2, dashLen, color) {
		x1 = x1 + 0.5;
		y1 = y1 + 0.5;
		x2 = x2 + 0.5;
		y2 = y2 + 0.5;
		if(color != undefined)
			canvas.strokeStyle = color;
		else
			canvas.strokeStyle = "#000000";
		if(dashLen == undefined) dashLen = 4;
		canvas.beginPath();
		canvas.moveTo(x1, y1);
		var dX = x2 - x1;
		var dY = y2 - y1;
		var dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / dashLen);
		var dashX = dX / dashes;
		var dashY = dY / dashes;
		var q = 0;
		while (q++ < dashes){
			x1 += dashX;
			y1 += dashY;
			canvas[q % 2 == 0 ? 'moveTo' : 'lineTo'](x1, y1);
			}
		canvas[q % 2 == 0 ? 'moveTo' : 'lineTo'](x2, y2);
		canvas.stroke();
		canvas.closePath();	
		};	
	this.font_pixel_to_height = function(px){
		return Math.round(px*0.75);
		};
	this.rgbToHex = function(r, g, b) {
		if (r > 255 || g > 255 || b > 255)
			throw "Invalid color component";
		return ((r << 16) | (g << 8) | b).toString(16);
		};
	this.rgb2hex_all = function(rgb){
		rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		return "#" + HELPER.hex(rgb[1]) + HELPER.hex(rgb[2]) + HELPER.hex(rgb[3]);
		};
        this.hex = function(x){
	        return ("0" + parseInt(x).toString(16)).slice(-2);
	        };
	this.hex2rgb = function(hex) {
		if (hex[0]=="#") hex=hex.substr(1);
		if (hex.length==3) {
			var temp=hex; hex='';
			temp = /^([a-f0-9])([a-f0-9])([a-f0-9])$/i.exec(temp).slice(1);
			for (var i=0;i<3;i++) hex+=temp[i]+temp[i];
			}
		var triplets = /^([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i.exec(hex).slice(1);
		return {
			r: parseInt(triplets[0],16),
			g: parseInt(triplets[1],16),
			b: parseInt(triplets[2],16),
			a: 255
			};
		};
	this.ColorLuminance = function(hex, lum){
		// validate hex string
		hex = String(hex).replace(/[^0-9a-f]/gi, '');
		lum = lum || 0;
		// convert to decimal and change luminosity
		var rgb = "#", c, i;
		for (i = 0; i < 3; i++){
			c = parseInt(hex.substr(i*2,2), 16);
			c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
			rgb += ("00"+c).substr(c.length);
			}
		return rgb;
		};
	this.drawImage_rotated = function(canvas, file, x, y, width, height, angle){
		var TO_RADIANS = Math.PI/180;
		var img = new Image();	
		img.src = file;
		
		canvas.save();
		canvas.translate(x, y);
		canvas.rotate(angle * TO_RADIANS);
		canvas.drawImage(img, -(width/2), -(height/2));
		canvas.restore();
		};
	this.drawEllipseByCenter = function(ctx, cx, cy, w, h, color, fill) {
		HELPER.drawEllipse(ctx, cx - w/2.0, cy - h/2.0, w, h, color, fill);
		};
	this.drawEllipse = function(ctx, x, y, w, h, color, fill) {
		var kappa = .5522848,
			ox = (w / 2) * kappa, // control point offset horizontal
			oy = (h / 2) * kappa, // control point offset vertical
			xe = x + w,           // x-end
			ye = y + h,           // y-end
			xm = x + w / 2,       // x-middle
			ym = y + h / 2;       // y-middle
	
		ctx.beginPath();
		ctx.moveTo(x, ym);
		ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.strokeStyle = color;
		if(fill==undefined)
			ctx.stroke();
		else
			ctx.fill();
		};
	this.remove_selection = function(){
		if (window.getSelection) {
			if (window.getSelection().empty)   // Chrome
				window.getSelection().empty();
			else if (window.getSelection().removeAllRanges)  // Firefox
				window.getSelection().removeAllRanges();
			} 
		else if (document.selection)  // IE?
			document.selection.empty();
		};
	this.get_dimensions = function(){
		var theWidth, theHeight;
		if (window.innerWidth) {
			theWidth=window.innerWidth;
			}
		else if (document.documentElement && document.documentElement.clientWidth) {
			theWidth=document.documentElement.clientWidth;
			}
		else if (document.body) {
			theWidth=document.body.clientWidth;
			}
		if (window.innerHeight) {
			theHeight=window.innerHeight;
			}
		else if (document.documentElement && document.documentElement.clientHeight) {
			theHeight=document.documentElement.clientHeight;
			}
		else if (document.body) {
			theHeight=document.body.clientHeight;
			}
		return [theWidth, theHeight];
		};
	this.save_as_chrome = function(fileContents, fileName){
		var link = document.createElement('a');
		link.download = fileName;
		link.href = 'data:,' + fileContents;
		link.click();
		};
	//credits: richard maloney 2006
	this.darkenColor = function(color, v){
		if (color.length >6){
			color = color.substring(1,color.length); 
			}
		var rgb = parseInt(color, 16); 
		var r = Math.abs(((rgb >> 16) & 0xFF)+v); if (r>255) r=r-(r-255);
		var g = Math.abs(((rgb >> 8) & 0xFF)+v); if (g>255) g=g-(g-255);
		var b = Math.abs((rgb & 0xFF)+v); if (b>255) b=b-(b-255);
		r = Number(r < 0 || isNaN(r)) ? 0 : ((r > 255) ? 255 : r).toString(16); 
		if (r.length == 1) r = '0' + r;
		g = Number(g < 0 || isNaN(g)) ? 0 : ((g > 255) ? 255 : g).toString(16); 
		if (g.length == 1) g = '0' + g;
		b = Number(b < 0 || isNaN(b)) ? 0 : ((b > 255) ? 255 : b).toString(16); 
		if (b.length == 1) b = '0' + b;
		return "#" + r + g + b;
		};
	//IntegraXor Web SCADA - JavaScript Number Formatter, author: KPL, KHL
	this.number_format = function(n, decPlaces, thouSeparator, decSeparator){
		var decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces;
		var decSeparator = decSeparator == undefined ? "." : decSeparator;
		var thouSeparator = thouSeparator == undefined ? "," : thouSeparator;
		var sign = n < 0 ? "-" : "";
		var i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "";
		var j = (j = i.length) > 3 ? j % 3 : 0;
		return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
		};
	this.length = function(object){
		var n = 0;
		for(var i in object){
			n++;
			}
		return n;
		};
	this.chech_input_color_support = function(id){
		if(document.getElementById(id).value != undefined && document.getElementById(id).value[0] == '#')
			return true;
		return false;
		};
	}
//http://www.script-tutorials.com/html5-canvas-custom-brush1/
var BezierCurveBrush = {
	// inner variables
	iPrevX: 0,
	iPrevY: 0,
	points: null,
	// initialization function
	init: function () {
	},
	startCurve: function (x, y) {
		this.iPrevX = x;
		this.iPrevY = y;
		this.points = new Array();
	},
	getPoint: function (iLength, a) {
		var index = a.length - iLength, i;
		for (i = index; i < a.length; i++) {
			if (a[i]) {
				return a[i];
			}
		}
	},
	draw: function (ctx, color_rgb, x, y, size) {
		if (Math.abs(this.iPrevX - x) > 5 || Math.abs(this.iPrevY - y) > 5) {
			this.points.push([x, y]);

			// draw main path stroke
			ctx.beginPath();
			ctx.moveTo(this.iPrevX, this.iPrevY);
			ctx.lineTo(x, y);

			ctx.lineWidth = size;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.strokeStyle = 'rgba(' + color_rgb.r + ', ' + color_rgb.g + ', ' + color_rgb.b + ', 0.9)';
			ctx.stroke();
			ctx.closePath();

			// draw extra strokes
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'rgba(' + color_rgb.r + ', ' + color_rgb.g + ', ' + color_rgb.b + ', 0.2)';
			ctx.beginPath();
			var iStartPoint = this.getPoint(25, this.points);
			var iFirstPoint = this.getPoint(1, this.points);
			var iSecondPoint = this.getPoint(5, this.points);
			ctx.moveTo(iStartPoint[0],iStartPoint[1]);
			ctx.bezierCurveTo(iFirstPoint[0], iFirstPoint[1], iSecondPoint[0], iSecondPoint[1], x, y);
			ctx.stroke();
			ctx.closePath();

			this.iPrevX = x;
			this.iPrevY = y;
		}
	}
};

//quick access short functions
function log(object){
	if(typeof object != 'object')
		console.log(object);
	else{
		var str = '[';
		for(var i in object){
			if(typeof object[i] == 'number')
				str += Math.round(object[i]*1000)/1000+",  ";
			else
				str += object[i]+",  ";
			}
		str += ']';
		log(str);
		}
	}		
function round(number){
	return Math.round(number);
	}
