//about - A Javascript Image filter library for the HTML5 Canvas tag. 
//author - https://github.com/arahaya/ImageFilters.js
//demo - http://www.arahaya.com/imagefilters/

var ImageFilters = {};
ImageFilters.utils = {
	initSampleCanvas: function () {
		var _canvas = document.createElement('canvas'),
			_context = _canvas.getContext('2d');

		_canvas.width = 0;
		_canvas.height = 0;

		this.getSampleCanvas = function () {
			return _canvas;
		};
		this.getSampleContext = function () {
			return _context;
		};
		this.createImageData = (_context.createImageData) ? function (w, h) {
			return _context.createImageData(w, h);
		} : function (w, h) {
			return new ImageData(w, h);
		};
	},
	getSampleCanvas: function () {
		this.initSampleCanvas();
		return this.getSampleCanvas();
	},
	getSampleContext: function () {
		this.initSampleCanvas();
		return this.getSampleContext();
	},
	createImageData: function (w, h) {
		this.initSampleCanvas();
		return this.createImageData(w, h);
	},
	clamp: function (value) {
		return value > 255 ? 255 : value < 0 ? 0 : value;
	},
	buildMap: function (f) {
		for (var m = [], k = 0, v; k < 256; k += 1) {
			m[k] = (v = f(k)) > 255 ? 255 : v < 0 ? 0 : v | 0;
		}
		return m;
	},
	applyMap: function (src, dst, map) {
		for (var i = 0, l = src.length; i < l; i += 4) {
			dst[i] = map[src[i]];
			dst[i + 1] = map[src[i + 1]];
			dst[i + 2] = map[src[i + 2]];
			dst[i + 3] = src[i + 3];
		}
	},
	mapRGB: function (src, dst, func) {
		this.applyMap(src, dst, this.buildMap(func));
	},
	getPixelIndex: function (x, y, width, height, edge) {
		if (x < 0 || x >= width || y < 0 || y >= height) {
			switch (edge) {
				case 1: // clamp
					x = x < 0 ? 0 : x >= width ? width - 1 : x;
					y = y < 0 ? 0 : y >= height ? height - 1 : y;
					break;
				case 2: // wrap
					x = (x %= width) < 0 ? x + width : x;
					y = (y %= height) < 0 ? y + height : y;
					break;
				default: // transparent
					return null;
			}
		}
		return (y * width + x) << 2;
	},
	getPixel: function (src, x, y, width, height, edge) {
		if (x < 0 || x >= width || y < 0 || y >= height) {
			switch (edge) {
				case 1: // clamp
					x = x < 0 ? 0 : x >= width ? width - 1 : x;
					y = y < 0 ? 0 : y >= height ? height - 1 : y;
					break;
				case 2: // wrap
					x = (x %= width) < 0 ? x + width : x;
					y = (y %= height) < 0 ? y + height : y;
					break;
				default: // transparent
					return 0;
			}
		}

		var i = (y * width + x) << 2;

		// ARGB
		return src[i + 3] << 24 | src[i] << 16 | src[i + 1] << 8 | src[i + 2];
	},
	getPixelByIndex: function (src, i) {
		return src[i + 3] << 24 | src[i] << 16 | src[i + 1] << 8 | src[i + 2];
	},
	/**
	 * one of the most important functions in this library.
	 * I want to make this as fast as possible.
	 */
	copyBilinear: function (src, x, y, width, height, dst, dstIndex, edge) {
		var fx = x < 0 ? x - 1 | 0 : x | 0, // Math.floor(x)
			fy = y < 0 ? y - 1 | 0 : y | 0, // Math.floor(y)
			wx = x - fx,
			wy = y - fy,
			i,
			nw = 0, ne = 0, sw = 0, se = 0,
			cx, cy,
			r, g, b, a;

		if (fx >= 0 && fx < (width - 1) && fy >= 0 && fy < (height - 1)) {
			// in bounds, no edge actions required
			i = (fy * width + fx) << 2;

			if (wx || wy) {
				nw = src[i + 3] << 24 | src[i] << 16 | src[i + 1] << 8 | src[i + 2];

				i += 4;
				ne = src[i + 3] << 24 | src[i] << 16 | src[i + 1] << 8 | src[i + 2];

				i = (i - 8) + (width << 2);
				sw = src[i + 3] << 24 | src[i] << 16 | src[i + 1] << 8 | src[i + 2];

				i += 4;
				se = src[i + 3] << 24 | src[i] << 16 | src[i + 1] << 8 | src[i + 2];
			} else {
				// no interpolation required
				dst[dstIndex] = src[i];
				dst[dstIndex + 1] = src[i + 1];
				dst[dstIndex + 2] = src[i + 2];
				dst[dstIndex + 3] = src[i + 3];
				return;
			}
		} else {
			// edge actions required
			nw = this.getPixel(src, fx, fy, width, height, edge);

			if (wx || wy) {
				ne = this.getPixel(src, fx + 1, fy, width, height, edge);
				sw = this.getPixel(src, fx, fy + 1, width, height, edge);
				se = this.getPixel(src, fx + 1, fy + 1, width, height, edge);
			} else {
				// no interpolation required
				dst[dstIndex] = nw >> 16 & 0xFF;
				dst[dstIndex + 1] = nw >> 8 & 0xFF;
				dst[dstIndex + 2] = nw & 0xFF;
				dst[dstIndex + 3] = nw >> 24 & 0xFF;
				return;
			}
		}

		cx = 1 - wx;
		cy = 1 - wy;
		r = ((nw >> 16 & 0xFF) * cx + (ne >> 16 & 0xFF) * wx) * cy + ((sw >> 16 & 0xFF) * cx + (se >> 16 & 0xFF) * wx) * wy;
		g = ((nw >> 8 & 0xFF) * cx + (ne >> 8 & 0xFF) * wx) * cy + ((sw >> 8 & 0xFF) * cx + (se >> 8 & 0xFF) * wx) * wy;
		b = ((nw & 0xFF) * cx + (ne & 0xFF) * wx) * cy + ((sw & 0xFF) * cx + (se & 0xFF) * wx) * wy;
		a = ((nw >> 24 & 0xFF) * cx + (ne >> 24 & 0xFF) * wx) * cy + ((sw >> 24 & 0xFF) * cx + (se >> 24 & 0xFF) * wx) * wy;

		dst[dstIndex] = r > 255 ? 255 : r < 0 ? 0 : r | 0;
		dst[dstIndex + 1] = g > 255 ? 255 : g < 0 ? 0 : g | 0;
		dst[dstIndex + 2] = b > 255 ? 255 : b < 0 ? 0 : b | 0;
		dst[dstIndex + 3] = a > 255 ? 255 : a < 0 ? 0 : a | 0;
	},
	/**
	 * @param r 0 <= n <= 255
	 * @param g 0 <= n <= 255
	 * @param b 0 <= n <= 255
	 * @return Array(h, s, l)
	 */
	rgbToHsl: function (r, g, b) {
		r /= 255;
		g /= 255;
		b /= 255;

//        var max = Math.max(r, g, b),
//            min = Math.min(r, g, b),
		var max = (r > g) ? (r > b) ? r : b : (g > b) ? g : b,
			min = (r < g) ? (r < b) ? r : b : (g < b) ? g : b,
			chroma = max - min,
			h = 0,
			s = 0,
			// Lightness
			l = (min + max) / 2;

		if (chroma !== 0) {
			// Hue
			if (r === max) {
				h = (g - b) / chroma + ((g < b) ? 6 : 0);
			} else if (g === max) {
				h = (b - r) / chroma + 2;
			} else {
				h = (r - g) / chroma + 4;
			}
			h /= 6;

			// Saturation
			s = (l > 0.5) ? chroma / (2 - max - min) : chroma / (max + min);
		}

		return [h, s, l];
	},
	/**
	 * @param h 0.0 <= n <= 1.0
	 * @param s 0.0 <= n <= 1.0
	 * @param l 0.0 <= n <= 1.0
	 * @return Array(r, g, b)
	 */
	hslToRgb: function (h, s, l) {
		var m1, m2, hue,
			r, g, b,
			rgb = [];

		if (s === 0) {
			r = g = b = l * 255 + 0.5 | 0;
			rgb = [r, g, b];
		} else {
			if (l <= 0.5) {
				m2 = l * (s + 1);
			} else {
				m2 = l + s - l * s;
			}

			m1 = l * 2 - m2;
			hue = h + 1 / 3;

			var tmp;
			for (var i = 0; i < 3; i += 1) {
				if (hue < 0) {
					hue += 1;
				} else if (hue > 1) {
					hue -= 1;
				}

				if (6 * hue < 1) {
					tmp = m1 + (m2 - m1) * hue * 6;
				} else if (2 * hue < 1) {
					tmp = m2;
				} else if (3 * hue < 2) {
					tmp = m1 + (m2 - m1) * (2 / 3 - hue) * 6;
				} else {
					tmp = m1;
				}

				rgb[i] = tmp * 255 + 0.5 | 0;

				hue -= 1 / 3;
			}
		}

		return rgb;
	}
};


ImageFilters.Translate = function (srcImageData, x, y, interpolation) {

};
ImageFilters.Scale = function (srcImageData, scaleX, scaleY, interpolation) {

};
ImageFilters.Rotate = function (srcImageData, originX, originY, angle, resize, interpolation) {

};
ImageFilters.Affine = function (srcImageData, matrix, resize, interpolation) {

};
ImageFilters.UnsharpMask = function (srcImageData, level) {

};

ImageFilters.ConvolutionFilter = function (srcImageData, matrixX, matrixY, matrix, divisor, bias, preserveAlpha, clamp, color, alpha) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	divisor = divisor || 1;
	bias = bias || 0;

	// default true
	(preserveAlpha !== false) && (preserveAlpha = true);
	(clamp !== false) && (clamp = true);

	color = color || 0;
	alpha = alpha || 0;

	var index = 0,
		rows = matrixX >> 1,
		cols = matrixY >> 1,
		clampR = color >> 16 & 0xFF,
		clampG = color >> 8 & 0xFF,
		clampB = color & 0xFF,
		clampA = alpha * 0xFF;

	for (var y = 0; y < srcHeight; y += 1) {
		for (var x = 0; x < srcWidth; x += 1, index += 4) {
			var r = 0,
				g = 0,
				b = 0,
				a = 0,
				replace = false,
				mIndex = 0,
				v;

			for (var row = -rows; row <= rows; row += 1) {
				var rowIndex = y + row,
					offset;

				if (0 <= rowIndex && rowIndex < srcHeight) {
					offset = rowIndex * srcWidth;
				} else if (clamp) {
					offset = y * srcWidth;
				} else {
					replace = true;
				}

				for (var col = -cols; col <= cols; col += 1) {
					var m = matrix[mIndex++];

					if (m !== 0) {
						var colIndex = x + col;

						if (!(0 <= colIndex && colIndex < srcWidth)) {
							if (clamp) {
								colIndex = x;
							} else {
								replace = true;
							}
						}

						if (replace) {
							r += m * clampR;
							g += m * clampG;
							b += m * clampB;
							a += m * clampA;
						} else {
							var p = (offset + colIndex) << 2;
							r += m * srcPixels[p];
							g += m * srcPixels[p + 1];
							b += m * srcPixels[p + 2];
							a += m * srcPixels[p + 3];
						}
					}
				}
			}

			dstPixels[index] = (v = r / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
			dstPixels[index + 1] = (v = g / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
			dstPixels[index + 2] = (v = b / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
			dstPixels[index + 3] = preserveAlpha ? srcPixels[index + 3] : (v = a / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
		}
	}

	return dstImageData;
};

/**
 * @param threshold 0.0 <= n <= 1.0
 */
ImageFilters.Binarize = function (srcImageData, threshold) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	if (isNaN(threshold)) {
		threshold = 0.5;
	}

	threshold *= 255;

	for (var i = 0; i < srcLength; i += 4) {
		var avg = srcPixels[i] + srcPixels[i + 1] + srcPixels[i + 2] / 3;

		dstPixels[i] = dstPixels[i + 1] = dstPixels[i + 2] = avg <= threshold ? 0 : 255;
		dstPixels[i + 3] = 255;
	}

	return dstImageData;
};

ImageFilters.BlendAdd = function (srcImageData, blendImageData, dx, dy) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data,
		blendPixels = blendImageData.data;

	var v;

	for (var i = 0; i < srcLength; i += 4) {
		dstPixels[i] = ((v = srcPixels[i] + blendPixels[i]) > 255) ? 255 : v;
		dstPixels[i + 1] = ((v = srcPixels[i + 1] + blendPixels[i + 1]) > 255) ? 255 : v;
		dstPixels[i + 2] = ((v = srcPixels[i + 2] + blendPixels[i + 2]) > 255) ? 255 : v;
		dstPixels[i + 3] = 255;
	}

	return dstImageData;
};

ImageFilters.BlendSubtract = function (srcImageData, blendImageData, dx, dy) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data,
		blendPixels = blendImageData.data;

	var v;

	for (var i = 0; i < srcLength; i += 4) {
		dstPixels[i] = ((v = srcPixels[i] - blendPixels[i]) < 0) ? 0 : v;
		dstPixels[i + 1] = ((v = srcPixels[i + 1] - blendPixels[i + 1]) < 0) ? 0 : v;
		dstPixels[i + 2] = ((v = srcPixels[i + 2] - blendPixels[i + 2]) < 0) ? 0 : v;
		dstPixels[i + 3] = 255;
	}

	return dstImageData;
};

/**
 * Algorithm based on BoxBlurFilter.java by Huxtable.com
 * @see http://www.jhlabs.com/ip/blurring.html
 * Copyright 2005 Huxtable.com. All rights reserved.
 */
ImageFilters.BoxBlur = (function () {
	var blur = function (src, dst, width, height, radius) {
		var tableSize = radius * 2 + 1;
		var radiusPlus1 = radius + 1;
		var widthMinus1 = width - 1;

		var r, g, b, a;

		var srcIndex = 0;
		var dstIndex;
		var p, next, prev;
		var i, l, x, y,
			nextIndex, prevIndex;

		var sumTable = [];
		for (i = 0, l = 256 * tableSize; i < l; i += 1) {
			sumTable[i] = i / tableSize | 0;
		}

		for (y = 0; y < height; y += 1) {
			r = g = b = a = 0;
			dstIndex = y;

			p = srcIndex << 2;
			r += radiusPlus1 * src[p];
			g += radiusPlus1 * src[p + 1];
			b += radiusPlus1 * src[p + 2];
			a += radiusPlus1 * src[p + 3];

			for (i = 1; i <= radius; i += 1) {
				p = (srcIndex + (i < width ? i : widthMinus1)) << 2;
				r += src[p];
				g += src[p + 1];
				b += src[p + 2];
				a += src[p + 3];
			}

			for (x = 0; x < width; x += 1) {
				p = dstIndex << 2;
				dst[p] = sumTable[r];
				dst[p + 1] = sumTable[g];
				dst[p + 2] = sumTable[b];
				dst[p + 3] = sumTable[a];

				nextIndex = x + radiusPlus1;
				if (nextIndex > widthMinus1) {
					nextIndex = widthMinus1;
				}

				prevIndex = x - radius;
				if (prevIndex < 0) {
					prevIndex = 0;
				}

				next = (srcIndex + nextIndex) << 2;
				prev = (srcIndex + prevIndex) << 2;

				r += src[next] - src[prev];
				g += src[next + 1] - src[prev + 1];
				b += src[next + 2] - src[prev + 2];
				a += src[next + 3] - src[prev + 3];

				dstIndex += height;
			}
			srcIndex += width;
		}
	};

	return function (srcImageData, hRadius, vRadius, quality) {
		var srcPixels = srcImageData.data,
			srcWidth = srcImageData.width,
			srcHeight = srcImageData.height,
			srcLength = srcPixels.length,
			dstImageData = this.utils.createImageData(srcWidth, srcHeight),
			dstPixels = dstImageData.data,
			tmpImageData = this.utils.createImageData(srcWidth, srcHeight),
			tmpPixels = tmpImageData.data;

		for (var i = 0; i < quality; i += 1) {
			// only use the srcPixels on the first loop
			blur(i ? dstPixels : srcPixels, tmpPixels, srcWidth, srcHeight, hRadius);
			blur(tmpPixels, dstPixels, srcHeight, srcWidth, vRadius);
		}

		return dstImageData;
	};
}());

/**
 * @ param strength 1 <= n <= 4
 */
ImageFilters.GaussianBlur = function (srcImageData, strength) {
	var size, matrix, divisor;

	switch (strength) {
		case 2:
			size = 5;
			matrix = [
				1, 1, 2, 1, 1,
				1, 2, 4, 2, 1,
				2, 4, 8, 4, 2,
				1, 2, 4, 2, 1,
				1, 1, 2, 1, 1
			];
			divisor = 52;
			break;
		case 3:
			size = 7;
			matrix = [
				1, 1, 2, 2, 2, 1, 1,
				1, 2, 2, 4, 2, 2, 1,
				2, 2, 4, 8, 4, 2, 2,
				2, 4, 8, 16, 8, 4, 2,
				2, 2, 4, 8, 4, 2, 2,
				1, 2, 2, 4, 2, 2, 1,
				1, 1, 2, 2, 2, 1, 1
			];
			divisor = 140;
			break;
		case 4:
			size = 15;
			matrix = [
				2, 2, 3, 4, 5, 5, 6, 6, 6, 5, 5, 4, 3, 2, 2,
				2, 3, 4, 5, 7, 7, 8, 8, 8, 7, 7, 5, 4, 3, 2,
				3, 4, 6, 7, 9, 10, 10, 11, 10, 10, 9, 7, 6, 4, 3,
				4, 5, 7, 9, 10, 12, 13, 13, 13, 12, 10, 9, 7, 5, 4,
				5, 7, 9, 11, 13, 14, 15, 16, 15, 14, 13, 11, 9, 7, 5,
				5, 7, 10, 12, 14, 16, 17, 18, 17, 16, 14, 12, 10, 7, 5,
				6, 8, 10, 13, 15, 17, 19, 19, 19, 17, 15, 13, 10, 8, 6,
				6, 8, 11, 13, 16, 18, 19, 20, 19, 18, 16, 13, 11, 8, 6,
				6, 8, 10, 13, 15, 17, 19, 19, 19, 17, 15, 13, 10, 8, 6,
				5, 7, 10, 12, 14, 16, 17, 18, 17, 16, 14, 12, 10, 7, 5,
				5, 7, 9, 11, 13, 14, 15, 16, 15, 14, 13, 11, 9, 7, 5,
				4, 5, 7, 9, 10, 12, 13, 13, 13, 12, 10, 9, 7, 5, 4,
				3, 4, 6, 7, 9, 10, 10, 11, 10, 10, 9, 7, 6, 4, 3,
				2, 3, 4, 5, 7, 7, 8, 8, 8, 7, 7, 5, 4, 3, 2,
				2, 2, 3, 4, 5, 5, 6, 6, 6, 5, 5, 4, 3, 2, 2
			];
			divisor = 2044;
			break;
		default:
			size = 3;
			matrix = [
				1, 2, 1,
				2, 4, 2,
				1, 2, 1
			];
			divisor = 16;
			break;
	}
	return this.ConvolutionFilter(srcImageData, size, size, matrix, divisor, 0, false);
};

/**
 * Stack Blur Algorithm by Mario Klingemann <mario@quasimondo.com>
 * @see http://incubator.quasimondo.com/processing/fast_blur_deluxe.php
 */
/*
 Copyright (c) 2010 Mario Klingemann
 
 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:
 
 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
 */
ImageFilters.StackBlur = (function () {
	var mul_table = [
		512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512,
		454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512,
		482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456,
		437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512,
		497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328,
		320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456,
		446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335,
		329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512,
		505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405,
		399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328,
		324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271,
		268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456,
		451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388,
		385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335,
		332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292,
		289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259];


	var shg_table = [
		9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
		17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
		19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
		20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
		21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
		21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
		22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
		22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
		23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24];

	function BlurStack() {
		this.r = 0;
		this.g = 0;
		this.b = 0;
		this.a = 0;
		this.next = null;
	}

	return function (srcImageData, radius) {
		var srcPixels = srcImageData.data,
			srcWidth = srcImageData.width,
			srcHeight = srcImageData.height,
			srcLength = srcPixels.length,
			dstImageData = this.Clone(srcImageData),
			dstPixels = dstImageData.data;

		var x, y, i, p, yp, yi, yw,
			r_sum, g_sum, b_sum, a_sum,
			r_out_sum, g_out_sum, b_out_sum, a_out_sum,
			r_in_sum, g_in_sum, b_in_sum, a_in_sum,
			pr, pg, pb, pa, rbs,
			div = radius + radius + 1,
			w4 = srcWidth << 2,
			widthMinus1 = srcWidth - 1,
			heightMinus1 = srcHeight - 1,
			radiusPlus1 = radius + 1,
			sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2,
			stackStart = new BlurStack(),
			stack = stackStart,
			stackIn, stackOut, stackEnd,
			mul_sum = mul_table[radius],
			shg_sum = shg_table[radius];

		for (i = 1; i < div; i += 1) {
			stack = stack.next = new BlurStack();
			if (i == radiusPlus1) {
				stackEnd = stack;
			}
		}

		stack.next = stackStart;
		yw = yi = 0;

		for (y = 0; y < srcHeight; y += 1) {
			r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;

			r_out_sum = radiusPlus1 * (pr = dstPixels[yi]);
			g_out_sum = radiusPlus1 * (pg = dstPixels[yi + 1]);
			b_out_sum = radiusPlus1 * (pb = dstPixels[yi + 2]);
			a_out_sum = radiusPlus1 * (pa = dstPixels[yi + 3]);

			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;
			a_sum += sumFactor * pa;

			stack = stackStart;

			for (i = 0; i < radiusPlus1; i += 1) {
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack.a = pa;
				stack = stack.next;
			}

			for (i = 1; i < radiusPlus1; i += 1) {
				p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
				r_sum += (stack.r = (pr = dstPixels[p])) * (rbs = radiusPlus1 - i);
				g_sum += (stack.g = (pg = dstPixels[p + 1])) * rbs;
				b_sum += (stack.b = (pb = dstPixels[p + 2])) * rbs;
				a_sum += (stack.a = (pa = dstPixels[p + 3])) * rbs;

				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;
				a_in_sum += pa;

				stack = stack.next;
			}

			stackIn = stackStart;
			stackOut = stackEnd;

			for (x = 0; x < srcWidth; x += 1) {
				dstPixels[yi] = (r_sum * mul_sum) >> shg_sum;
				dstPixels[yi + 1] = (g_sum * mul_sum) >> shg_sum;
				dstPixels[yi + 2] = (b_sum * mul_sum) >> shg_sum;
				dstPixels[yi + 3] = (a_sum * mul_sum) >> shg_sum;

				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;
				a_sum -= a_out_sum;

				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;
				a_out_sum -= stackIn.a;

				p = (yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1)) << 2;

				r_in_sum += (stackIn.r = dstPixels[p]);
				g_in_sum += (stackIn.g = dstPixels[p + 1]);
				b_in_sum += (stackIn.b = dstPixels[p + 2]);
				a_in_sum += (stackIn.a = dstPixels[p + 3]);

				r_sum += r_in_sum;
				g_sum += g_in_sum;
				b_sum += b_in_sum;
				a_sum += a_in_sum;

				stackIn = stackIn.next;

				r_out_sum += (pr = stackOut.r);
				g_out_sum += (pg = stackOut.g);
				b_out_sum += (pb = stackOut.b);
				a_out_sum += (pa = stackOut.a);

				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;
				a_in_sum -= pa;

				stackOut = stackOut.next;

				yi += 4;
			}

			yw += srcWidth;
		}

		for (x = 0; x < srcWidth; x += 1) {
			g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;

			yi = x << 2;
			r_out_sum = radiusPlus1 * (pr = dstPixels[yi]);
			g_out_sum = radiusPlus1 * (pg = dstPixels[yi + 1]);
			b_out_sum = radiusPlus1 * (pb = dstPixels[yi + 2]);
			a_out_sum = radiusPlus1 * (pa = dstPixels[yi + 3]);

			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;
			a_sum += sumFactor * pa;

			stack = stackStart;

			for (i = 0; i < radiusPlus1; i += 1) {
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack.a = pa;
				stack = stack.next;
			}

			yp = srcWidth;

			for (i = 1; i <= radius; i += 1) {
				yi = (yp + x) << 2;

				r_sum += (stack.r = (pr = dstPixels[yi])) * (rbs = radiusPlus1 - i);
				g_sum += (stack.g = (pg = dstPixels[yi + 1])) * rbs;
				b_sum += (stack.b = (pb = dstPixels[yi + 2])) * rbs;
				a_sum += (stack.a = (pa = dstPixels[yi + 3])) * rbs;

				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;
				a_in_sum += pa;

				stack = stack.next;

				if (i < heightMinus1) {
					yp += srcWidth;
				}
			}

			yi = x;
			stackIn = stackStart;
			stackOut = stackEnd;

			for (y = 0; y < srcHeight; y += 1) {
				p = yi << 2;
				dstPixels[p] = (r_sum * mul_sum) >> shg_sum;
				dstPixels[p + 1] = (g_sum * mul_sum) >> shg_sum;
				dstPixels[p + 2] = (b_sum * mul_sum) >> shg_sum;
				dstPixels[p + 3] = (a_sum * mul_sum) >> shg_sum;

				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;
				a_sum -= a_out_sum;

				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;
				a_out_sum -= stackIn.a;

				p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * srcWidth)) << 2;

				r_sum += (r_in_sum += (stackIn.r = dstPixels[p]));
				g_sum += (g_in_sum += (stackIn.g = dstPixels[p + 1]));
				b_sum += (b_in_sum += (stackIn.b = dstPixels[p + 2]));
				a_sum += (a_in_sum += (stackIn.a = dstPixels[p + 3]));

				stackIn = stackIn.next;

				r_out_sum += (pr = stackOut.r);
				g_out_sum += (pg = stackOut.g);
				b_out_sum += (pb = stackOut.b);
				a_out_sum += (pa = stackOut.a);

				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;
				a_in_sum -= pa;

				stackOut = stackOut.next;

				yi += srcWidth;
			}
		}

		return dstImageData;
	}
}());

/**
 * TV based algorithm
 */
ImageFilters.Brightness = function (srcImageData, brightness) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	this.utils.mapRGB(srcPixels, dstPixels, function (value) {
		value += brightness;
		return (value > 255) ? 255 : value;
	});

	return dstImageData;
};

/**
 * GIMP algorithm modified. pretty close to fireworks
 * @param brightness -100 <= n <= 100
 * @param contrast -100 <= n <= 100
 */
ImageFilters.BrightnessContrastGimp = function (srcImageData, brightness, contrast) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data,
		p4 = Math.PI / 4;

	// fix to -1 <= n <= 1
	brightness /= 100;

	// fix to -99 <= n <= 99
	contrast *= 0.99;
	// fix to -1 < n < 1
	contrast /= 100;
	// apply GIMP formula
	contrast = Math.tan((contrast + 1) * p4);

	// get the average color
	for (var avg = 0, i = 0; i < srcLength; i += 4) {
		avg += (srcPixels[i] * 19595 + srcPixels[i + 1] * 38470 + srcPixels[i + 2] * 7471) >> 16;
	}
	avg = avg / (srcLength / 4);

	this.utils.mapRGB(srcPixels, dstPixels, function (value) {
		if (brightness < 0) {
			value = value * (1 + brightness);
		} else if (brightness > 0) {
			value = value + ((255 - value) * brightness);
		}
		//value += brightness;

		if (contrast !== 0) {
			value = (value - avg) * contrast + avg;
		}
		return value + 0.5 | 0;
	});
	return dstImageData;
};

/**
 * more like the new photoshop algorithm
 * @param brightness -100 <= n <= 100
 * @param contrast -100 <= n <= 100
 */
ImageFilters.BrightnessContrastPhotoshop = function (srcImageData, brightness, contrast) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	// fix to 0 <= n <= 2;
	brightness = (brightness + 100) / 100;
	contrast = (contrast + 100) / 100;

	this.utils.mapRGB(srcPixels, dstPixels, function (value) {
		value *= brightness;
		value = (value - 127.5) * contrast + 127.5;
		return value + 0.5 | 0;
	});
	return dstImageData;
};

ImageFilters.Channels = function (srcImageData, channel) {
	var matrix;

	switch (channel) {
		case 2: // green
			matrix = [
				0, 1, 0, 0, 0,
				0, 1, 0, 0, 0,
				0, 1, 0, 0, 0,
				0, 0, 0, 1, 0
			];
			break;
		case 3: // blue
			matrix = [
				0, 0, 1, 0, 0,
				0, 0, 1, 0, 0,
				0, 0, 1, 0, 0,
				0, 0, 0, 1, 0
			];
			break;
		default: // red
			matrix = [
				1, 0, 0, 0, 0,
				1, 0, 0, 0, 0,
				1, 0, 0, 0, 0,
				0, 0, 0, 1, 0
			];
			break;

	}

	return this.ColorMatrixFilter(srcImageData, matrix);
};

ImageFilters.Clone = function (srcImageData) {
	return this.Copy(srcImageData, this.utils.createImageData(srcImageData.width, srcImageData.height));
};

/**
 * slower
 */
ImageFilters.CloneBuiltin = function (srcImageData) {
	var srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		canvas = this.utils.getSampleCanvas(),
		context = this.utils.getSampleContext(),
		dstImageData;

	canvas.width = srcWidth;
	canvas.height = srcHeight;

	context.putImageData(srcImageData, 0, 0);
	dstImageData = context.getImageData(0, 0, srcWidth, srcHeight);

	canvas.width = 0;
	canvas.height = 0;

	return dstImageData;
};

ImageFilters.ColorMatrixFilter = function (srcImageData, matrix) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	var m0 = matrix[0],
		m1 = matrix[1],
		m2 = matrix[2],
		m3 = matrix[3],
		m4 = matrix[4],
		m5 = matrix[5],
		m6 = matrix[6],
		m7 = matrix[7],
		m8 = matrix[8],
		m9 = matrix[9],
		m10 = matrix[10],
		m11 = matrix[11],
		m12 = matrix[12],
		m13 = matrix[13],
		m14 = matrix[14],
		m15 = matrix[15],
		m16 = matrix[16],
		m17 = matrix[17],
		m18 = matrix[18],
		m19 = matrix[19];

	var value, i, r, g, b, a;
	for (i = 0; i < srcLength; i += 4) {
		r = srcPixels[i];
		g = srcPixels[i + 1];
		b = srcPixels[i + 2];
		a = srcPixels[i + 3];

		dstPixels[i] = (value = r * m0 + g * m1 + b * m2 + a * m3 + m4) > 255 ? 255 : value < 0 ? 0 : value | 0;
		dstPixels[i + 1] = (value = r * m5 + g * m6 + b * m7 + a * m8 + m9) > 255 ? 255 : value < 0 ? 0 : value | 0;
		dstPixels[i + 2] = (value = r * m10 + g * m11 + b * m12 + a * m13 + m14) > 255 ? 255 : value < 0 ? 0 : value | 0;
		dstPixels[i + 3] = (value = r * m15 + g * m16 + b * m17 + a * m18 + m19) > 255 ? 255 : value < 0 ? 0 : value | 0;
	}

	return dstImageData;
};

ImageFilters.ColorTransformFilter = function (
	srcImageData, redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier,
	redOffset, greenOffset, blueOffset, alphaOffset) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	var i, v;
	for (i = 0; i < srcLength; i += 4) {
		dstPixels[i] = (v = srcPixels[i] * redMultiplier + redOffset) > 255 ? 255 : v < 0 ? 0 : v;
		dstPixels[i + 1] = (v = srcPixels[i + 1] * greenMultiplier + greenOffset) > 255 ? 255 : v < 0 ? 0 : v;
		dstPixels[i + 2] = (v = srcPixels[i + 2] * blueMultiplier + blueOffset) > 255 ? 255 : v < 0 ? 0 : v;
		dstPixels[i + 3] = (v = srcPixels[i + 3] * alphaMultiplier + alphaOffset) > 255 ? 255 : v < 0 ? 0 : v;
	}

	return dstImageData;
};

ImageFilters.Copy = function (srcImageData, dstImageData) {
	var srcPixels = srcImageData.data,
		srcLength = srcPixels.length,
		dstPixels = dstImageData.data;

	while (srcLength--) {
		dstPixels[srcLength] = srcPixels[srcLength];
	}

	return dstImageData;
};

ImageFilters.Crop = function (srcImageData, x, y, width, height) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(width, height),
		dstPixels = dstImageData.data;

	var srcLeft = Math.max(x, 0),
		srcTop = Math.max(y, 0),
		srcRight = Math.min(x + width, srcWidth),
		srcBottom = Math.min(y + height, srcHeight),
		dstLeft = srcLeft - x,
		dstTop = srcTop - y,
		srcRow, srcCol, srcIndex, dstIndex;

	for (srcRow = srcTop, dstRow = dstTop; srcRow < srcBottom; srcRow += 1, dstRow += 1) {
		for (srcCol = srcLeft, dstCol = dstLeft; srcCol < srcRight; srcCol += 1, dstCol += 1) {
			srcIndex = (srcRow * srcWidth + srcCol) << 2;
			dstIndex = (dstRow * width + dstCol) << 2;
			dstPixels[dstIndex] = srcPixels[srcIndex];
			dstPixels[dstIndex + 1] = srcPixels[srcIndex + 1];
			dstPixels[dstIndex + 2] = srcPixels[srcIndex + 2];
			dstPixels[dstIndex + 3] = srcPixels[srcIndex + 3];
		}
	}

	return dstImageData;
};

ImageFilters.CropBuiltin = function (srcImageData, x, y, width, height) {
	var srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		canvas = this.utils.getSampleCanvas(),
		context = this.utils.getSampleContext();

	canvas.width = srcWidth;
	canvas.height = srcHeight;
	context.putImageData(srcImageData, 0, 0);
	var result = context.getImageData(x, y, width, height);

	canvas.width = 0;
	canvas.height = 0;

	return result;
};

/**
 * sets to the average of the highest and lowest contrast
 */
ImageFilters.Desaturate = function (srcImageData) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	for (var i = 0; i < srcLength; i += 4) {
		var r = srcPixels[i],
			g = srcPixels[i + 1],
			b = srcPixels[i + 2],
			max = (r > g) ? (r > b) ? r : b : (g > b) ? g : b,
			min = (r < g) ? (r < b) ? r : b : (g < b) ? g : b,
			avg = ((max + min) / 2) + 0.5 | 0;

		dstPixels[i] = dstPixels[i + 1] = dstPixels[i + 2] = avg;
		dstPixels[i + 3] = srcPixels[i + 3];
	}

	return dstImageData;
};

ImageFilters.DisplacementMapFilter = function (srcImageData, mapImageData, mapX, mapY, componentX, componentY, scaleX, scaleY, mode) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = ImageFilters.Clone(srcImageData),
		dstPixels = dstImageData.data;

	mapX || (mapX = 0);
	mapY || (mapY = 0);
	componentX || (componentX = 0); // red?
	componentY || (componentY = 0);
	scaleX || (scaleX = 0);
	scaleY || (scaleY = 0);
	mode || (mode = 2); // wrap

	var mapWidth = mapImageData.width,
		mapHeight = mapImageData.height,
		mapPixels = mapImageData.data,
		mapRight = mapWidth + mapX,
		mapBottom = mapHeight + mapY,
		dstIndex, srcIndex, mapIndex,
		cx, cy, tx, ty, x, y;

	for (x = 0; x < srcWidth; x += 1) {
		for (y = 0; y < srcHeight; y += 1) {

			dstIndex = (y * srcWidth + x) << 2;

			if (x < mapX || y < mapY || x >= mapRight || y >= mapBottom) {
				// out of the map bounds
				// copy src to dst
				srcIndex = dstIndex;
			} else {
				// apply map
				mapIndex = ((y - mapY) * mapWidth + (x - mapX)) << 2;

				// tx = x + ((componentX(x, y) - 128) * scaleX) / 256
				cx = mapPixels[mapIndex + componentX];
				tx = x + (((cx - 128) * scaleX) >> 8);

				// tx = y + ((componentY(x, y) - 128) * scaleY) / 256
				cy = mapPixels[mapIndex + componentY];
				ty = y + (((cy - 128) * scaleY) >> 8);

				srcIndex = ImageFilters.utils.getPixelIndex(tx + 0.5 | 0, ty + 0.5 | 0, srcWidth, srcHeight, mode);
				if (srcIndex === null) {
					// if mode == ignore and (tx,ty) is out of src bounds
					// then copy (x,y) to dst
					srcIndex = dstIndex;
				}
			}

			dstPixels[dstIndex] = srcPixels[srcIndex];
			dstPixels[dstIndex + 1] = srcPixels[srcIndex + 1];
			dstPixels[dstIndex + 2] = srcPixels[srcIndex + 2];
			dstPixels[dstIndex + 3] = srcPixels[srcIndex + 3];
		}
	}

	return dstImageData;
};

/**
 * Floyd-Steinberg algorithm
 * @param levels 2 <= n <= 255
 */
ImageFilters.Dither = function (srcImageData, levels) {
	var srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		dstImageData = this.Clone(srcImageData),
		dstPixels = dstImageData.data;

	levels = levels < 2 ? 2 : levels > 255 ? 255 : levels;

	// Build a color map using the same algorithm as the posterize filter.
	var posterize,
		levelMap = [],
		levelsMinus1 = levels - 1,
		j = 0,
		k = 0,
		i;

	for (i = 0; i < levels; i += 1) {
		levelMap[i] = (255 * i) / levelsMinus1;
	}

	posterize = this.utils.buildMap(function (value) {
		var ret = levelMap[j];

		k += levels;

		if (k > 255) {
			k -= 255;
			j += 1;
		}

		return ret;
	});

	// Apply the dithering algorithm to each pixel
	var x, y,
		index,
		old_r, old_g, old_b,
		new_r, new_g, new_b,
		err_r, err_g, err_b,
		nbr_r, nbr_g, nbr_b,
		srcWidthMinus1 = srcWidth - 1,
		srcHeightMinus1 = srcHeight - 1,
		A = 7 / 16,
		B = 3 / 16,
		C = 5 / 16,
		D = 1 / 16;

	for (y = 0; y < srcHeight; y += 1) {
		for (x = 0; x < srcWidth; x += 1) {
			// Get the current pixel.
			index = (y * srcWidth + x) << 2;

			old_r = dstPixels[index];
			old_g = dstPixels[index + 1];
			old_b = dstPixels[index + 2];

			// Quantize using the color map
			new_r = posterize[old_r];
			new_g = posterize[old_g];
			new_b = posterize[old_b];

			// Set the current pixel.
			dstPixels[index] = new_r;
			dstPixels[index + 1] = new_g;
			dstPixels[index + 2] = new_b;

			// Quantization errors
			err_r = old_r - new_r;
			err_g = old_g - new_g;
			err_b = old_b - new_b;

			// Apply the matrix.
			// x + 1, y
			index += 1 << 2;
			if (x < srcWidthMinus1) {
				nbr_r = dstPixels[index] + A * err_r;
				nbr_g = dstPixels[index + 1] + A * err_g;
				nbr_b = dstPixels[index + 2] + A * err_b;

				dstPixels[index] = nbr_r > 255 ? 255 : nbr_r < 0 ? 0 : nbr_r | 0;
				dstPixels[index + 1] = nbr_g > 255 ? 255 : nbr_g < 0 ? 0 : nbr_g | 0;
				dstPixels[index + 2] = nbr_b > 255 ? 255 : nbr_b < 0 ? 0 : nbr_b | 0;
			}

			// x - 1, y + 1
			index += (srcWidth - 2) << 2;
			if (x > 0 && y < srcHeightMinus1) {
				nbr_r = dstPixels[index] + B * err_r;
				nbr_g = dstPixels[index + 1] + B * err_g;
				nbr_b = dstPixels[index + 2] + B * err_b;

				dstPixels[index] = nbr_r > 255 ? 255 : nbr_r < 0 ? 0 : nbr_r | 0;
				dstPixels[index + 1] = nbr_g > 255 ? 255 : nbr_g < 0 ? 0 : nbr_g | 0;
				dstPixels[index + 2] = nbr_b > 255 ? 255 : nbr_b < 0 ? 0 : nbr_b | 0;
			}

			// x, y + 1
			index += 1 << 2;
			if (y < srcHeightMinus1) {
				nbr_r = dstPixels[index] + C * err_r;
				nbr_g = dstPixels[index + 1] + C * err_g;
				nbr_b = dstPixels[index + 2] + C * err_b;

				dstPixels[index] = nbr_r > 255 ? 255 : nbr_r < 0 ? 0 : nbr_r | 0;
				dstPixels[index + 1] = nbr_g > 255 ? 255 : nbr_g < 0 ? 0 : nbr_g | 0;
				dstPixels[index + 2] = nbr_b > 255 ? 255 : nbr_b < 0 ? 0 : nbr_b | 0;
			}

			// x + 1, y + 1
			index += 1 << 2;
			if (x < srcWidthMinus1 && y < srcHeightMinus1) {
				nbr_r = dstPixels[index] + D * err_r;
				nbr_g = dstPixels[index + 1] + D * err_g;
				nbr_b = dstPixels[index + 2] + D * err_b;

				dstPixels[index] = nbr_r > 255 ? 255 : nbr_r < 0 ? 0 : nbr_r | 0;
				dstPixels[index + 1] = nbr_g > 255 ? 255 : nbr_g < 0 ? 0 : nbr_g | 0;
				dstPixels[index + 2] = nbr_b > 255 ? 255 : nbr_b < 0 ? 0 : nbr_b | 0;
			}
		}
	}

	return dstImageData;
};

ImageFilters.Edge = function (srcImageData) {
	//pretty close to Fireworks 'Find Edges' effect
	return this.ConvolutionFilter(srcImageData, 3, 3, [
		-1, -1, -1,
		-1, 8, -1,
		-1, -1, -1
	]);
};

ImageFilters.Emboss = function (srcImageData) {
	return this.ConvolutionFilter(srcImageData, 3, 3, [
		-2, -1, 0,
		-1, 1, 1,
		0, 1, 2
	]);
};

ImageFilters.Enrich = function (srcImageData) {
	return this.ConvolutionFilter(srcImageData, 3, 3, [
		0, -2, 0,
		-2, 20, -2,
		0, -2, 0
	], 10, -40);
};

ImageFilters.Flip = function (srcImageData, vertical) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	var x, y, srcIndex, dstIndex, i;

	for (y = 0; y < srcHeight; y += 1) {
		for (x = 0; x < srcWidth; x += 1) {
			srcIndex = (y * srcWidth + x) << 2;
			if (vertical) {
				dstIndex = ((srcHeight - y - 1) * srcWidth + x) << 2;
			} else {
				dstIndex = (y * srcWidth + (srcWidth - x - 1)) << 2;
			}

			dstPixels[dstIndex] = srcPixels[srcIndex];
			dstPixels[dstIndex + 1] = srcPixels[srcIndex + 1];
			dstPixels[dstIndex + 2] = srcPixels[srcIndex + 2];
			dstPixels[dstIndex + 3] = srcPixels[srcIndex + 3];
		}
	}

	return dstImageData;
};

ImageFilters.Gamma = function (srcImageData, gamma) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	this.utils.mapRGB(srcPixels, dstPixels, function (value) {
		value = (255 * Math.pow(value / 255, 1 / gamma) + 0.5);
		return value > 255 ? 255 : value + 0.5 | 0;
	});

	return dstImageData;
};

ImageFilters.GrayScale = function (srcImageData) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	for (var i = 0; i < srcLength; i += 4) {
		var intensity = (srcPixels[i] * 19595 + srcPixels[i + 1] * 38470 + srcPixels[i + 2] * 7471) >> 16;
		//var intensity = (srcPixels[i] * 0.3086 + srcPixels[i + 1] * 0.6094 + srcPixels[i + 2] * 0.0820) | 0;
		dstPixels[i] = dstPixels[i + 1] = dstPixels[i + 2] = intensity;
		dstPixels[i + 3] = srcPixels[i + 3];
	}

	return dstImageData;
};

/**
 * @param hueDelta  -180 <= n <= 180
 * @param satDelta  -100 <= n <= 100
 * @param lightness -100 <= n <= 100
 */
ImageFilters.HSLAdjustment = function (srcImageData, hueDelta, satDelta, lightness) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	hueDelta /= 360;
	satDelta /= 100;
	lightness /= 100;

	var rgbToHsl = this.utils.rgbToHsl;
	var hslToRgb = this.utils.hslToRgb;
	var h, s, l, hsl, rgb, i;

	for (i = 0; i < srcLength; i += 4) {
		// convert to HSL
		hsl = rgbToHsl(srcPixels[i], srcPixels[i + 1], srcPixels[i + 2]);

		// hue
		h = hsl[0] + hueDelta;
		while (h < 0) {
			h += 1;
		}
		while (h > 1) {
			h -= 1;
		}

		// saturation
		s = hsl[1] + hsl[1] * satDelta;
		if (s < 0) {
			s = 0;
		} else if (s > 1) {
			s = 1;
		}

		// lightness
		l = hsl[2];
		if (lightness > 0) {
			l += (1 - l) * lightness;
		} else if (lightness < 0) {
			l += l * lightness;
		}

		// convert back to rgb
		rgb = hslToRgb(h, s, l);

		dstPixels[i] = rgb[0];
		dstPixels[i + 1] = rgb[1];
		dstPixels[i + 2] = rgb[2];
		dstPixels[i + 3] = srcPixels[i + 3];
	}

	return dstImageData;
};

ImageFilters.Invert = function (srcImageData) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	this.utils.mapRGB(srcPixels, dstPixels, function (value) {
		return 255 - value;
	});

	return dstImageData;
};

ImageFilters.Mosaic = function (srcImageData, blockSize) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	var cols = Math.ceil(srcWidth / blockSize),
		rows = Math.ceil(srcHeight / blockSize),
		row, col,
		x_start, x_end, y_start, y_end,
		x, y, yIndex, index, size,
		r, g, b, a;

	for (row = 0; row < rows; row += 1) {
		y_start = row * blockSize;
		y_end = y_start + blockSize;

		if (y_end > srcHeight) {
			y_end = srcHeight;
		}

		for (col = 0; col < cols; col += 1) {
			x_start = col * blockSize;
			x_end = x_start + blockSize;

			if (x_end > srcWidth) {
				x_end = srcWidth;
			}

			// get the average color from the src
			r = g = b = a = 0;
			size = (x_end - x_start) * (y_end - y_start);

			for (y = y_start; y < y_end; y += 1) {
				yIndex = y * srcWidth;

				for (x = x_start; x < x_end; x += 1) {
					index = (yIndex + x) << 2;
					r += srcPixels[index];
					g += srcPixels[index + 1];
					b += srcPixels[index + 2];
					a += srcPixels[index + 3];
				}
			}

			r = (r / size) + 0.5 | 0;
			g = (g / size) + 0.5 | 0;
			b = (b / size) + 0.5 | 0;
			a = (a / size) + 0.5 | 0;

			// fill the dst with that color
			for (y = y_start; y < y_end; y += 1) {
				yIndex = y * srcWidth;

				for (x = x_start; x < x_end; x += 1) {
					index = (yIndex + x) << 2;
					dstPixels[index] = r;
					dstPixels[index + 1] = g;
					dstPixels[index + 2] = b;
					dstPixels[index + 3] = a;
				}
			}
		}
	}

	return dstImageData;
};

/**
 * @param range  1 <= n <= 5
 * @param levels 1 <= n <= 256
 */
ImageFilters.Oil = function (srcImageData, range, levels) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	var index = 0,
		rh = [],
		gh = [],
		bh = [],
		rt = [],
		gt = [],
		bt = [],
		x, y, i, row, col,
		rowIndex, colIndex, offset, srcIndex,
		sr, sg, sb, ri, gi, bi,
		r, g, b;

	for (y = 0; y < srcHeight; y += 1) {
		for (x = 0; x < srcWidth; x += 1) {
			for (i = 0; i < levels; i += 1) {
				rh[i] = gh[i] = bh[i] = rt[i] = gt[i] = bt[i] = 0;
			}

			for (row = -range; row <= range; row += 1) {
				rowIndex = y + row;

				if (rowIndex < 0 || rowIndex >= srcHeight) {
					continue;
				}

				offset = rowIndex * srcWidth;

				for (col = -range; col <= range; col += 1) {
					colIndex = x + col;
					if (colIndex < 0 || colIndex >= srcWidth) {
						continue;
					}

					srcIndex = (offset + colIndex) << 2;
					sr = srcPixels[srcIndex];
					sg = srcPixels[srcIndex + 1];
					sb = srcPixels[srcIndex + 2];
					ri = (sr * levels) >> 8;
					gi = (sg * levels) >> 8;
					bi = (sb * levels) >> 8;
					rt[ri] += sr;
					gt[gi] += sg;
					bt[bi] += sb;
					rh[ri] += 1;
					gh[gi] += 1;
					bh[bi] += 1;
				}
			}

			r = g = b = 0;
			for (i = 1; i < levels; i += 1) {
				if (rh[i] > rh[r]) {
					r = i;
				}
				if (gh[i] > gh[g]) {
					g = i;
				}
				if (bh[i] > bh[b]) {
					b = i;
				}
			}

			dstPixels[index] = rt[r] / rh[r] | 0;
			dstPixels[index + 1] = gt[g] / gh[g] | 0;
			dstPixels[index + 2] = bt[b] / bh[b] | 0;
			dstPixels[index + 3] = srcPixels[index + 3];
			index += 4;
		}
	}

	return dstImageData;
};

ImageFilters.OpacityFilter = function (srcImageData, opacity) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	for (var i = 0; i < srcLength; i += 4) {
		dstPixels[i] = srcPixels[i];
		dstPixels[i + 1] = srcPixels[i + 1];
		dstPixels[i + 2] = srcPixels[i + 2];
		dstPixels[i + 3] = opacity;
	}

	return dstImageData;
};

/**
 * @param levels 2 <= n <= 255
 */
ImageFilters.Posterize = function (srcImageData, levels) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	levels = levels < 2 ? 2 : levels > 255 ? 255 : levels;

	var levelMap = [],
		levelsMinus1 = levels - 1,
		j = 0,
		k = 0,
		i;

	for (i = 0; i < levels; i += 1) {
		levelMap[i] = (255 * i) / levelsMinus1;
	}

	this.utils.mapRGB(srcPixels, dstPixels, function (value) {
		var ret = levelMap[j];

		k += levels;

		if (k > 255) {
			k -= 255;
			j += 1;
		}

		return ret;
	});

	return dstImageData;
};

/**
 * @param scale 0.0 <= n <= 5.0
 */
ImageFilters.Rescale = function (srcImageData, scale) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	this.utils.mapRGB(srcPixels, dstPixels, function (value) {
		value *= scale;
		return (value > 255) ? 255 : value + 0.5 | 0;
	});

	return dstImageData;
};

/**
 * Nearest neighbor
 */
ImageFilters.ResizeNearestNeighbor = function (srcImageData, width, height) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(width, height),
		dstPixels = dstImageData.data;

	var xFactor = srcWidth / width,
		yFactor = srcHeight / height,
		dstIndex = 0, srcIndex,
		x, y, offset;

	for (y = 0; y < height; y += 1) {
		offset = ((y * yFactor) | 0) * srcWidth;

		for (x = 0; x < width; x += 1) {
			srcIndex = (offset + x * xFactor) << 2;

			dstPixels[dstIndex] = srcPixels[srcIndex];
			dstPixels[dstIndex + 1] = srcPixels[srcIndex + 1];
			dstPixels[dstIndex + 2] = srcPixels[srcIndex + 2];
			dstPixels[dstIndex + 3] = srcPixels[srcIndex + 3];
			dstIndex += 4;
		}
	}

	return dstImageData;
};

/**
 * Bilinear
 */
ImageFilters.Resize = function (srcImageData, width, height) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(width, height),
		dstPixels = dstImageData.data;

	var xFactor = srcWidth / width,
		yFactor = srcHeight / height,
		dstIndex = 0,
		x, y;

	for (y = 0; y < height; y += 1) {
		for (x = 0; x < width; x += 1) {
			this.utils.copyBilinear(srcPixels, x * xFactor, y * yFactor, srcWidth, srcHeight, dstPixels, dstIndex, 0);
			dstIndex += 4;
		}
	}

	return dstImageData;
};


/**
 * faster resizing using the builtin context.scale()
 * the resizing algorithm may be different between browsers
 * this might not work if the image is transparent.
 * to fix that we probably need two contexts
 */
ImageFilters.ResizeBuiltin = function (srcImageData, width, height) {
	var srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		canvas = this.utils.getSampleCanvas(),
		context = this.utils.getSampleContext(),
		dstImageData;

	canvas.width = Math.max(srcWidth, width);
	canvas.height = Math.max(srcHeight, height);
	context.save();

	context.putImageData(srcImageData, 0, 0);
	context.scale(width / srcWidth, height / srcHeight);
	context.drawImage(canvas, 0, 0);

	dstImageData = context.getImageData(0, 0, width, height);

	context.restore();
	canvas.width = 0;
	canvas.height = 0;

	return dstImageData;
};

ImageFilters.Sepia = function (srcImageData) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	var r, g, b, i, value;

	for (i = 0; i < srcLength; i += 4) {
		r = srcPixels[i];
		g = srcPixels[i + 1];
		b = srcPixels[i + 2];

		dstPixels[i] = (value = r * 0.393 + g * 0.769 + b * 0.189) > 255 ? 255 : value < 0 ? 0 : value + 0.5 | 0;
		dstPixels[i + 1] = (value = r * 0.349 + g * 0.686 + b * 0.168) > 255 ? 255 : value < 0 ? 0 : value + 0.5 | 0;
		dstPixels[i + 2] = (value = r * 0.272 + g * 0.534 + b * 0.131) > 255 ? 255 : value < 0 ? 0 : value + 0.5 | 0;
		dstPixels[i + 3] = srcPixels[i + 3];
	}

	return dstImageData;
};

/**
 * @param factor 1 <= n
 */
ImageFilters.Sharpen = function (srcImageData, factor) {
	//Convolution formula from VIGRA
	return this.ConvolutionFilter(srcImageData, 3, 3, [
		-factor / 16, -factor / 8, -factor / 16,
		-factor / 8, factor * 0.75 + 1, -factor / 8,
		-factor / 16, -factor / 8, -factor / 16
	]);
};

ImageFilters.Solarize = function (srcImageData) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	this.utils.mapRGB(srcPixels, dstPixels, function (value) {
		return value > 127 ? (value - 127.5) * 2 : (127.5 - value) * 2;
	});

	return dstImageData;
};

ImageFilters.Transpose = function (srcImageData) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcHeight, srcWidth),
		dstPixels = dstImageData.data;

	var srcIndex, dstIndex;

	for (y = 0; y < srcHeight; y += 1) {
		for (x = 0; x < srcWidth; x += 1) {
			srcIndex = (y * srcWidth + x) << 2;
			dstIndex = (x * srcHeight + y) << 2;

			dstPixels[dstIndex] = srcPixels[srcIndex];
			dstPixels[dstIndex + 1] = srcPixels[srcIndex + 1];
			dstPixels[dstIndex + 2] = srcPixels[srcIndex + 2];
			dstPixels[dstIndex + 3] = srcPixels[srcIndex + 3];
		}
	}

	return dstImageData;
};

/**
 * @param centerX 0.0 <= n <= 1.0
 * @param centerY 0.0 <= n <= 1.0
 * @param radius
 * @param angle(degree)
 * @param smooth
 */
ImageFilters.Twril = function (srcImageData, centerX, centerY, radius, angle, edge, smooth) {
	var srcPixels = srcImageData.data,
		srcWidth = srcImageData.width,
		srcHeight = srcImageData.height,
		srcLength = srcPixels.length,
		dstImageData = this.utils.createImageData(srcWidth, srcHeight),
		dstPixels = dstImageData.data;

	//convert position to px
	centerX = srcWidth * centerX;
	centerY = srcHeight * centerY;

	// degree to radian
	angle *= (Math.PI / 180);

	var radius2 = radius * radius,
		max_y = srcHeight - 1,
		max_x = srcWidth - 1,
		dstIndex = 0,
		x, y, dx, dy, distance, a, tx, ty, srcIndex, pixel, i;

	for (y = 0; y < srcHeight; y += 1) {
		for (x = 0; x < srcWidth; x += 1) {
			dx = x - centerX;
			dy = y - centerY;
			distance = dx * dx + dy * dy;

			if (distance > radius2) {
				// out of the effected area. just copy the pixel
				dstPixels[dstIndex] = srcPixels[dstIndex];
				dstPixels[dstIndex + 1] = srcPixels[dstIndex + 1];
				dstPixels[dstIndex + 2] = srcPixels[dstIndex + 2];
				dstPixels[dstIndex + 3] = srcPixels[dstIndex + 3];
			} else {
				// main formula
				distance = Math.sqrt(distance);
				a = Math.atan2(dy, dx) + (angle * (radius - distance)) / radius;
				tx = centerX + distance * Math.cos(a);
				ty = centerY + distance * Math.sin(a);

				// copy target pixel
				if (smooth) {
					// bilinear
					this.utils.copyBilinear(srcPixels, tx, ty, srcWidth, srcHeight, dstPixels, dstIndex, edge);
				} else {
					// nearest neighbor
					// round tx, ty
					srcIndex = ((ty + 0.5 | 0) * srcWidth + (tx + 0.5 | 0)) << 2;
					dstPixels[dstIndex] = srcPixels[srcIndex];
					dstPixels[dstIndex + 1] = srcPixels[srcIndex + 1];
					dstPixels[dstIndex + 2] = srcPixels[srcIndex + 2];
					dstPixels[dstIndex + 3] = srcPixels[srcIndex + 3];
				}
			}

			dstIndex += 4;
		}
	}

	return dstImageData;
};

export default ImageFilters;