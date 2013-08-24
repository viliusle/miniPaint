//canvas layers
var canvas_back = document.getElementById("canvas_back").getContext("2d");		//layer for grid/transparency
var canvas_main = document.getElementById("Background").getContext("2d");		//background
//new layers insert convas here
var canvas_front = document.getElementById("canvas_front").getContext("2d");		//tmp layer
var canvas_preview = document.getElementById("canvas_preview").getContext("2d");	//mini preview

//settings
var AUTHOR = 'ViliusL';
var EMAIL = 'www.viliusl@gmail.com';
var VERSION = '1.8.1';
var WIDTH = 800;				//canvas midth
var HEIGHT = 500;				//canvas height
var RATIO = WIDTH/HEIGHT;			//width & height ratio
var LAYERS = [];				//layers data
var ACTION = 'select_tool';			///default action
var COLOUR = '#000000';				//current color
var COLOUR_LAST = '#ffffff';			//last used color
var ZOOM = 100;					//zoom level 10 - infinity
var ALPHA = 255;

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
	{name: 'magic_wand', 	title: 'Magic Wand Tool', 	icon: ['all.png', -150+1, -50+2],	attributes: {sensitivity: 40}		},
	{name: 'erase', 	title: 'Erase',			icon: ['all.png', -100+3, 4],	attributes: {size: 20, circle: true, strict: true,}	},
	{name: 'fill', 		title: 'Fill',			icon: ['all.png', -150+3, 3],	attributes: {sensitivity: 0}	},
	{name: 'pick_color', 	title: 'Pick Color',		icon: ['all.png', -200+3, 3],	attributes: {}		},
	{name: 'pencil', 	title: 'Pencil',		icon: ['all.png', -250+3, 3],	attributes: {}		},
	{name: 'line', 		title: 'Draw line',		icon: ['all.png', -300+3, 3],	attributes: {size: 1, multiline: false, arrow: false}	},
	{name: 'letters', 	title: 'Draw letters',		icon: ['all.png', -350+3, 4],	attributes: {}	},
	{name: 'draw_square', 	title: 'Draw rectangle',	icon: ['all.png', -400+3, 5],	attributes: {fill: false, square: false, round: 0}	},
	{name: 'draw_circle', 	title: 'Draw circle',		icon: ['all.png', -450+3, 5],	attributes: {fill: false, circle: false}	},
	{name: 'brush', 	title: 'Brush',			icon: ['all.png', -500+6, 3],	attributes: {type: 'Simple', type_values: ['Simple', 'BezierCurve', 'Broken', 'Chrome', 'Fur', 'Grouped', 'Shaded', 'Sketchy'], size: 5,  } },
	{name: 'blur_tool', 	title: 'Blur tool',		icon: ['all.png', -250+5, -50+2],	attributes: {size: 30, strength: 1}	},
	{name: 'sharpen_tool', 	title: 'Sharpen tool',		icon: ['all.png', -300+5, -50+2],	attributes: {size: 30, strength: 1}	},
	{name: 'clone_tool', 	title: 'Clone tool',		icon: ['all.png', -350+4, -50+3],	attributes: {size: 30}	},
	{name: 'gradient_tool', title: 'Gradient',		icon: ['all.png', -400+3, -50+4],	attributes: {radial: false, power: 50}	},
	];

var CREDITS = [
	{title: 'Brush styles',		name: 'Harmony',	link: 'http://ricardocabello.com/blog/post/689', },
	{title: 'Effects library',	name: 'glfx.js',	link: 'http://evanw.github.io/glfx.js/', },
	{title: 'EXIF',			name: 'exif.js',	link: 'https://github.com/jseidelin/exif-js', },
	{title: 'Menu',			name: 'Google menu',	link: 'http://blog.geotitles.com/2011/09/creating-the-new-top-black-bar-found-in-google-and-all-its-products/', },
	{title: 'Image filters',	name: 'ImageFilters.js',link: 'https://github.com/arahaya/ImageFilters.js', },
	];
