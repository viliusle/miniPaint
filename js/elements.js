/* global WIDTH, HEIGHT */

var EL = new ELEMENTS_CLASS();

/**
 * class that draw simple elements
 * 
 * @author ViliusL
 */
function ELEMENTS_CLASS() {

	//draw lines
	this.line = function(ctx, from_x, from_y, to_x, to_y, size){
		ctx.beginPath();
		if(size != undefined)
			ctx.lineWidth = size;
		ctx.moveTo(from_x + 0.5, from_y + 0.5);
		ctx.lineTo(to_x + 0.5, to_y + 0.5);
		ctx.stroke();
	};
	
	//draws rectangle
	this.rectangle = function (ctx, x, y, width, height, fill, stroke) {
		x = x + 0.5;
		y = y + 0.5;
		if (typeof stroke == "undefined")
			stroke = true;
		if(fill == false && stroke == undefined)
			stroke = true;
		
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + width, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y);
		ctx.lineTo(x + width, y + height);
		ctx.quadraticCurveTo(x + width, y + height, x + width, y + height);
		ctx.lineTo(x, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height);
		ctx.lineTo(x, y);
		ctx.quadraticCurveTo(x, y, x, y);
		ctx.closePath();
		if (stroke) {
			ctx.stroke();
		}
		if (fill) {
			ctx.fill();
		}
	};
	
	//draws square
	this.square = function (ctx, x, y, width, height, fill, stroke) {
		x = x + 0.5;
		y = y + 0.5;
		if (typeof stroke == "undefined")
			stroke = true;
		if(fill == false && stroke == undefined)
			stroke = true;
		
		if (Math.abs(width) < Math.abs(height)){
			if(width > 0)
				width = Math.abs(height);
			else
				width = -Math.abs(height);
		}
		else{
			if(height > 0)
				height = Math.abs(width);
			else
				height = -Math.abs(width);
		}
		
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + width, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y);
		ctx.lineTo(x + width, y + height);
		ctx.quadraticCurveTo(x + width, y + height, x + width, y + height);
		ctx.lineTo(x, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height);
		ctx.lineTo(x, y);
		ctx.quadraticCurveTo(x, y, x, y);
		ctx.closePath();
		if (stroke) {
			ctx.stroke();
		}
		if (fill) {
			ctx.fill();
		}
	};
	
	this.circle = function (ctx, x, y, size, color) {
		ctx.lineWidth = 1;
		if(color != undefined)
			ctx.strokeStyle = color;
		else
			ctx.strokeStyle = "#000000";
			
		ctx.beginPath();
		ctx.arc(x, y, size / 2, 0, Math.PI * 2, true);
		ctx.stroke();
	};
	
	this.ellipse_by_center = function (ctx, cx, cy, w, h, color, fill) {
		this.ellipse(ctx, cx - w / 2.0, cy - h / 2.0, w, h, color, fill);
	};
	
	this.ellipse = function (ctx, x, y, w, h, color, fill) {
		var kappa = .5522848,
			ox = (w / 2) * kappa, // control point offset horizontal
			oy = (h / 2) * kappa, // control point offset vertical
			xe = x + w, // x-end
			ye = y + h, // y-end
			xm = x + w / 2, // x-middle
			ym = y + h / 2; // y-middle

		ctx.beginPath();
		ctx.moveTo(x, ym);
		ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.strokeStyle = color;
		if (fill == undefined)
			ctx.stroke();
		else
			ctx.fill();
	};
	
	this.arrow = function (context, fromx, fromy, tox, toy, headlen) {
		if (headlen == undefined)
			headlen = 10;	// length of head in pixels
		var dx = tox - fromx;
		var dy = toy - fromy;
		var angle = Math.atan2(dy, dx);
		context.beginPath();
		context.moveTo(fromx, fromy);
		context.lineTo(tox, toy);
		context.stroke();
		context.beginPath();
		context.moveTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
		context.lineTo(tox, toy);
		context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
		context.stroke();
	};
	
	//dashed objects
	this.rectangle_dashed = function (canvas, x1, y1, x2, y2, dashLen, color) {
		this.line_dashed(canvas, x1, y1, x2, y1, dashLen, color);
		this.line_dashed(canvas, x2, y1, x2, y2, dashLen, color);
		this.line_dashed(canvas, x2, y2, x1, y2, dashLen, color);
		this.line_dashed(canvas, x1, y2, x1, y1, dashLen, color);
	};
	
	this.line_dashed = function (canvas, x1, y1, x2, y2, dashLen, color) {
		x1 = x1 + 0.5;
		y1 = y1 + 0.5;
		x2 = x2 + 0.5;
		y2 = y2 + 0.5;
		if (color != undefined)
			canvas.strokeStyle = color;
		else
			canvas.strokeStyle = "#000000";
		if (dashLen == undefined)
			dashLen = 4;
		canvas.beginPath();
		canvas.moveTo(x1, y1);
		var dX = x2 - x1;
		var dY = y2 - y1;
		var dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / dashLen);
		var dashX = dX / dashes;
		var dashY = dY / dashes;
		var q = 0;
		while (q++ < dashes) {
			x1 += dashX;
			y1 += dashY;
			canvas[q % 2 == 0 ? 'moveTo' : 'lineTo'](x1, y1);
		}
		canvas[q % 2 == 0 ? 'moveTo' : 'lineTo'](x2, y2);
		canvas.stroke();
		canvas.closePath();
	};
	
	this.image_round = function (canvas, mouse_x, mouse_y, size, img_data, canvas_tmp, anti_aliasing) {
		var size_half = Math.round(size / 2);
		var ctx_tmp = canvas_tmp.getContext("2d");
		var xx = mouse_x - size_half;
		var yy = mouse_y - size_half;
		if (xx < 0)
			xx = 0;
		if (yy < 0)
			yy = 0;

		ctx_tmp.clearRect(0, 0, WIDTH, HEIGHT);
		ctx_tmp.save();
		//draw main data
		try {
			ctx_tmp.drawImage(img_data, mouse_x - size_half, mouse_y - size_half, size, size);
		}
		catch (err) {
			try {
				ctx_tmp.putImageData(img_data, xx, yy);
			}
			catch (err) {
				console.log("Error: " + err.message);
			}
		}
		ctx_tmp.globalCompositeOperation = 'destination-in';

		//create form
		ctx_tmp.fillStyle = '#ffffff';
		if (anti_aliasing == true) {
			var gradient = ctx_tmp.createRadialGradient(mouse_x, mouse_y, 0, mouse_x, mouse_y, size_half);
			gradient.addColorStop(0, '#ffffff');
			gradient.addColorStop(0.8, '#ffffff');
			gradient.addColorStop(1, 'rgba(255,255,255,0');
			ctx_tmp.fillStyle = gradient;
		}
		ctx_tmp.beginPath();
		ctx_tmp.arc(mouse_x, mouse_y, size_half, 0, 2 * Math.PI, true);
		ctx_tmp.fill();
		//draw final data
		if (xx + size > WIDTH)
			size = WIDTH - xx;
		if (yy + size > HEIGHT)
			size = HEIGHT - yy;
		canvas.drawImage(canvas_tmp, xx, yy, size, size, xx, yy, size, size);
		//reset
		ctx_tmp.restore();
		ctx_tmp.clearRect(0, 0, WIDTH, HEIGHT);
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
			ctx.moveTo(iStartPoint[0], iStartPoint[1]);
			ctx.bezierCurveTo(iFirstPoint[0], iFirstPoint[1], iSecondPoint[0], iSecondPoint[1], x, y);
			ctx.stroke();
			ctx.closePath();

			this.iPrevX = x;
			this.iPrevY = y;
		}
	}
};