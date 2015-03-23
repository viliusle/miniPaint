//canvas layers
var canvas_back = document.getElementById("canvas_back").getContext("2d");		//layer for grid/transparency
var canvas_main = document.getElementById("Background").getContext("2d");		//background
//new layers insert convas here
var canvas_front = document.getElementById("canvas_front").getContext("2d");		//tmp layer
var canvas_grid = document.getElementById("canvas_grid").getContext("2d");		//grid layer
var canvas_preview = document.getElementById("canvas_preview").getContext("2d");	//mini preview

//settings
var AUTHOR = 'ViliusL';
var EMAIL = 'www.viliusl@gmail.com';
var VERSION = '2.2';
var WIDTH = 800;				//canvas midth
var HEIGHT = 600;				//canvas height
var RATIO = WIDTH/HEIGHT;			//width & height ratio
var LAYERS = [];				//layers data
var ACTION = 'select_tool';			///default action
var COLOUR = '#0000ff';				//current color
var ZOOM = 100;					//zoom level 10 - infinity
var ALPHA = 255;				//default alpha
var SAVE_NAME = 'example';			//default save name

var SAVE_TYPES = [
	"PNG - Portable Network Graphics",	//default
	"JPG - JPG/JPEG Format",		//autodetect on photos where png useless?
	"XML - Full layers data",		//aka PSD
	"BMP - Windows Bitmap",			//firefox only, useless?
	"WEBP - Weppy File Format",		//chrome only
	];

var ACTION_DATA = [
	{name: 'select_tool', 	title: 'Select object tool',	icon: ['all.png', 0+7, 2],	attributes: {}		},
	{name: 'select_square', title: 'Select area tool', 	icon: ['all.png', -50+4, 5],	attributes: {}		},
	{name: 'magic_wand', 	title: 'Magic Wand Tool', 	icon: ['all.png', -150+1, -50+2],	attributes: {sensitivity: 40, anti_aliasing: true}		},
	{name: 'erase', 	title: 'Erase',			icon: ['all.png', -100+3, 4],	attributes: {size: 20, circle: true, strict: true}	},
	{name: 'fill', 		title: 'Fill',			icon: ['all.png', -150+3, 3],	attributes: {sensitivity: 0, anti_aliasing: false}	},
	{name: 'pick_color', 	title: 'Pick Color',		icon: ['all.png', -200+3, 3],	attributes: {}		},
	{name: 'pencil', 	title: 'Pencil',		icon: ['all.png', -250+3, 3],	attributes: {}		},
	{name: 'line', 		title: 'Draw line',		icon: ['all.png', -300+3, 3],	attributes: {size: 1, type_values: ['Simple', 'Multi-line', 'Arrow', 'Curve'] }	},
	{name: 'letters', 	title: 'Draw letters',		icon: ['all.png', -350+3, 4],	attributes: {}	},
	{name: 'draw_square', 	title: 'Draw rectangle',	icon: ['all.png', -400+3, 5],	attributes: {fill: false, square: false, round: 0}	},
	{name: 'draw_circle', 	title: 'Draw circle',		icon: ['all.png', -450+3, 5],	attributes: {fill: false, circle: false}	},
	{name: 'brush', 	title: 'Brush',			icon: ['all.png', -500+6, 3],	attributes: {type: 'Brush', type_values: ['Brush', 'BezierCurve', 'Chrome', 'Fur', 'Grouped', 'Shaded', 'Sketchy'], size: 5, anti_alias: false  }, on_update: 'update_brush', },
	{name: 'blur_tool', 	title: 'Blur tool',		icon: ['all.png', -250+5, -50+2],	attributes: {size: 30, strength: 1}	},
	{name: 'sharpen_tool', 	title: 'Sharpen tool',		icon: ['all.png', -300+5, -50+2],	attributes: {size: 30, strength: 0.5}	},
	{name: 'burn_dodge_tool', title: 'Burn/Dodge tool',		icon: ['all.png', -500+3, -50+4],	attributes: {burn: true, size: 30, power: 50}	},
	{name: 'desaturate_tool', title: 'Desaturate',		icon: ['all.png', -550+3, -00+4],	attributes: {size: 50, anti_alias: true}	},
	{name: 'clone_tool', 	title: 'Clone tool',		icon: ['all.png', -350+4, -50+3],	attributes: {size: 30, anti_alias: true}	},
	{name: 'gradient_tool', title: 'Gradient',		icon: ['all.png', -400+3, -50+4],	attributes: {radial: false, power: 50}	},
	{name: 'crop_tool',	title: 'Crop',			icon: ['all.png', -450+2, -50+2],	attributes: {	} },
	];

var CREDITS = [
	{title: 'Brush styles',		name: 'Harmony',	link: 'http://ricardocabello.com/blog/post/689' },
	{title: 'Effects library',	name: 'glfx.js',	link: 'http://evanw.github.io/glfx.js/' },
	{title: 'EXIF',			name: 'exif.js',	link: 'https://github.com/jseidelin/exif-js' },
	{title: 'Image filters',	name: 'ImageFilters.js',link: 'https://github.com/arahaya/ImageFilters.js' },
	{title: 'KD-tree',		name: 'kdtree.js',	link: 'http://jsdo.it/peko/wKvk' },
	];

var FILTERS_LIST = [
	{title: 'Black and White',	name: 'effects_bw' },
	{title: 'Blur-Box',		name: 'effects_BoxBlur' },
	{title: 'Blur-Gaussian',	name: 'effects_GaussianBlur' },
	{title: 'Blur-Stack',		name: 'effects_StackBlur' },
	{title: 'Blur-Zoom',		name: 'effects_zoomblur' },
	{title: 'Bulge/Pinch',		name: 'effects_bulge_pinch' },
	{title: 'Colorize',		name: 'effects_colorize' },
	{title: 'Denoise',		name: 'effects_denoise' },
	{title: 'Desaturate',		name: 'effects_Desaturate' },
	{title: 'Dither',		name: 'effects_Dither' },
	{title: 'Dot Screen',		name: 'effects_dot_screen' },
	{title: 'Edge',			name: 'effects_Edge' },
	{title: 'Emboss',		name: 'effects_Emboss' },
	{title: 'Enrich',		name: 'effects_Enrich' },
	{title: 'Gamma',		name: 'effects_Gamma' },
	{title: 'Grains',		name: 'effects_Grains' },
	{title: 'Heatmap',		name: 'effects_heatmap' },
	{title: 'HSL Adjustment',	name: 'effects_HSLAdjustment' },
	{title: 'JPG Compression',	name: 'effects_jpg_vintage' },
	{title: 'Mosaic',		name: 'effects_Mosaic' },
	{title: 'Oil',			name: 'effects_Oil' },
	{title: 'Posterize',		name: 'effects_Posterize' },
	{title: 'Sepia',		name: 'effects_Sepia' },
	{title: 'Sharpen',		name: 'effects_Sharpen' },
	{title: 'Solarize',		name: 'effects_Solarize' },
	{title: 'Tilt Shift',		name: 'effects_tilt_shift' },
	{title: 'Vignette',		name: 'effects_vignette' },
	{title: 'Vintage',		name: 'effects_vintage' },
	];
