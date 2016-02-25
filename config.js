/**
 * main config file
 * 
 * @author ViliusL
 */

//canvas layers
var canvas_back = document.getElementById("canvas_back").getContext("2d");		//layer for grid/transparency
var canvas_main = document.getElementById("Background").getContext("2d");		//background
var canvas_front = document.getElementById("canvas_front").getContext("2d");		//tmp layer
var canvas_grid = document.getElementById("canvas_grid").getContext("2d");		//grid layer
var canvas_preview = document.getElementById("canvas_preview").getContext("2d");	//mini preview

//global settings
var VERSION = '2.4';
var WIDTH = 800;					//default canvas midth
var HEIGHT = 600;					//default canvas height
var COLOR = '#0000ff';				//active color
var ALPHA = 255;					//active color alpha

var DRAW_TOOLS_CONFIG = [
	{name: 'select_tool', 	title: 'Select object tool',	icon: ['all.png', 0+7, 2],	attributes: {}		},
	{name: 'select_square', title: 'Select area tool', 	icon: ['all.png', -50+4, 5],	attributes: {}		},
	{name: 'magic_wand', 	title: 'Magic Wand Tool', 	icon: ['all.png', -150+1, -50+2],	attributes: {sensitivity: 40, anti_aliasing: true}		},
	{name: 'erase',		title: 'Erase',			icon: ['all.png', -100+3, 4],	attributes: {size: 20, circle: true, strict: true}	},
	{name: 'fill', 		title: 'Fill',			icon: ['all.png', -150+3, 3],	attributes: {sensitivity: 0, anti_aliasing: false}	},
	{name: 'pick_color', 	title: 'Pick Color',		icon: ['all.png', -200+3, 3],	attributes: {}		},
	{name: 'pencil',		title: 'Pencil',			icon: ['all.png', -250+3, 3],	attributes: {}		},
	{name: 'line', 		title: 'Draw line',		icon: ['all.png', -300+3, 3],	attributes: {size: 1, type_values: ['Simple', 'Multi-line', 'Arrow', 'Curve'] }	},
	{name: 'letters', 	title: 'Draw letters',		icon: ['all.png', -350+3, 4],	attributes: {}	},
	{name: 'draw_square', 	title: 'Draw rectangle',	icon: ['all.png', -400+3, 5],	attributes: {fill: false, square: false}	},
	{name: 'draw_circle', 	title: 'Draw circle',		icon: ['all.png', -450+3, 5],	attributes: {fill: false, circle: false}	},
	{name: 'brush',		title: 'Brush',			icon: ['all.png', -500+6, 3],	attributes: {type: 'Brush', type_values: ['Brush', 'BezierCurve', 'Chrome', 'Fur', 'Grouped', 'Shaded', 'Sketchy'], size: 5, anti_alias: false  }, on_update: 'update_brush', },
	{name: 'blur_tool', 	title: 'Blur tool',		icon: ['all.png', -250+5, -50+2],	attributes: {size: 30, strength: 1}	},
	{name: 'sharpen_tool', 	title: 'Sharpen tool',		icon: ['all.png', -300+5, -50+2],	attributes: {size: 30, strength: 0.5}	},
	{name: 'burn_dodge_tool',  title: 'Burn/Dodge tool',	icon: ['all.png', -500+3, -50+4],	attributes: {burn: true, size: 30, power: 50}	},
	{name: 'desaturate_tool',  title: 'Desaturate',		icon: ['all.png', -550+3, -00+4],	attributes: {size: 50, anti_alias: true}	},
	{name: 'clone_tool', 	title: 'Clone tool',		icon: ['all.png', -350+4, -50+3],	attributes: {size: 30, anti_alias: true}	},
	{name: 'gradient_tool', title: 'Gradient',		icon: ['all.png', -400+3, -50+4],	attributes: {radial: false, power: 50}	},
	{name: 'crop_tool',	title: 'Crop',			icon: ['all.png', -450+2, -50+2],	attributes: {	} },
];
