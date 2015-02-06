//http://ricardocabello.com/blog/post/689
var sketchy_brush = {
	context: null,
	prevMouseX: null,
	prevMouseY: null,
	points: null,
	count: null,
	init: function (a) {
		this.context = a;
		this.context.globalCompositeOperation = "source-over";
		this.points = new Array();
		this.count = 0
	},
	destroy: function () {
	},
	strokeStart: function (b, a) {
		this.prevMouseX = b;
		this.prevMouseY = a
	},
	stroke: function (color_rgb, f, c, size) {
		var e, b, a, g;
		this.points.push([f, c]);
		this.context.strokeStyle = "rgba(" + color_rgb.r + ', ' + color_rgb.g + ', ' + color_rgb.b + ", 0.1)";
		this.context.beginPath();
		this.context.moveTo(this.prevMouseX, this.prevMouseY);
		this.context.lineTo(f, c);
		this.context.stroke();
		this.context.strokeStyle = "rgba(" + color_rgb.r + ', ' + color_rgb.g + ', ' + color_rgb.b + ", 0.1 )";
		for (e = 0; e < this.points.length; e++) {
			b = this.points[e][0] - this.points[this.count][0];
			a = this.points[e][1] - this.points[this.count][1];
			g = b * b + a * a;
			if (g < 800 * size && Math.random() > g / (400 * size)) {
				this.context.beginPath();
				this.context.moveTo(this.points[this.count][0] + (b * 0.3), this.points[this.count][1] + (a * 0.3));
				this.context.lineTo(this.points[e][0] - (b * 0.3), this.points[e][1] - (a * 0.3));
				this.context.stroke();
			}
		}
		this.prevMouseX = f;
		this.prevMouseY = c;
		this.count++
	},
	strokeEnd: function (b, a) {
	}
};
var shaded_brush = {
	context: null,
	prevMouseX: null,
	prevMouseY: null,
	points: null,
	count: null,
	init: function (a) {
		this.context = a;
		this.context.globalCompositeOperation = "source-over";
		this.points = new Array();
		this.count = 0
	},
	destroy: function () {
	},
	strokeStart: function (b, a) {
		this.prevMouseX = b;
		this.prevMouseY = a
	},
	stroke: function (color_rgb, f, c, size) {
		var e, b, a, g;
		this.points.push([f, c]);
		for (e = 0; e < this.points.length; e++) {
			b = this.points[e][0] - this.points[this.count][0];
			a = this.points[e][1] - this.points[this.count][1];
			g = b * b + a * a;
			if (g < 200 * size) {
				this.context.strokeStyle = "rgba(" + color_rgb.r + ', ' + color_rgb.g + ', ' + color_rgb.b + ", " + ((1 - (g / (200 * size))) * 0.1) + " )";
				this.context.beginPath();
				this.context.moveTo(this.points[this.count][0], this.points[this.count][1]);
				this.context.lineTo(this.points[e][0], this.points[e][1]);
				this.context.stroke()
			}
		}
		this.prevMouseX = f;
		this.prevMouseY = c;
		this.count++
	},
	strokeEnd: function (b, a) {
	}
};
var chrome_brush = {
	context: null,
	prevMouseX: null,
	prevMouseY: null,
	points: null,
	count: null,
	init: function (a) {
		this.context = a;
		this.points = new Array();
		this.count = 0
	},
	destroy: function () {
	},
	strokeStart: function (b, a) {
		this.prevMouseX = b;
		this.prevMouseY = a
	},
	stroke: function (color_rgb, f, c, size) {
		var e, b, a, g;
		this.points.push([f, c]);
		this.context.strokeStyle = "rgba(" + color_rgb.r + ', ' + color_rgb.g + ', ' + color_rgb.b + ", 0.1)";
		this.context.beginPath();
		this.context.moveTo(this.prevMouseX, this.prevMouseY);
		this.context.lineTo(f, c);
		this.context.stroke();
		for (e = 0; e < this.points.length; e++) {
			b = this.points[e][0] - this.points[this.count][0];
			a = this.points[e][1] - this.points[this.count][1];
			g = b * b + a * a;
			if (g < 200 * size) {
				this.context.strokeStyle = "rgba(" + Math.floor(Math.random() * 255) + ", " + Math.floor(Math.random() * 255) + ", " + Math.floor(Math.random() * 255) + ", 0.1 )";
				this.context.beginPath();
				this.context.moveTo(this.points[this.count][0] + (b * 0.2), this.points[this.count][1] + (a * 0.2));
				this.context.lineTo(this.points[e][0] - (b * 0.2), this.points[e][1] - (a * 0.2));
				this.context.stroke()
			}
		}
		this.prevMouseX = f;
		this.prevMouseY = c;
		this.count++
	},
	strokeEnd: function (b, a) {
	}
};
