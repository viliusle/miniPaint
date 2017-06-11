/**
 * main config file
 * 
 * @author ViliusL
 */

//canvas layers
var canvas_back = document.getElementById("canvas_back").getContext("2d");		//layer for grid/transparency
var canvas_front = document.getElementById("canvas_front").getContext("2d");		//tmp layer
var canvas_grid = document.getElementById("canvas_grid").getContext("2d");		//grid layer
var canvas_preview = document.getElementById("canvas_preview").getContext("2d");	//mini preview

//global settings
var VERSION = '3.3';
var WIDTH;						//canvas midth
var HEIGHT;						//canvas height
var COLOR = '#0000ff';				//active color
var ALPHA = 255;					//active color alpha
var LANG = 'en';					//active language

var DRAW_TOOLS_CONFIG = [
	{name: 'select_tool', 	title: 'Select object tool',	icon: ['sprites.png', 0+7, 2],	attributes: {}		},
	{name: 'select_square', title: 'Select area tool', 	icon: ['sprites.png', -50+4, 5],	attributes: {}		},
	{name: 'magic_wand', 	title: 'Magic Wand Tool', 	icon: ['sprites.png', -150+1, -50+2],	attributes: {power: 40, anti_aliasing: true}		},
	{name: 'erase',		title: 'Erase',			icon: ['sprites.png', -100+3, 4],	attributes: {size: 30, circle: true, strict: true}	},
	{name: 'fill', 		title: 'Fill',			icon: ['sprites.png', -150+3, 3],	attributes: {power: 0, anti_aliasing: false}	},
	{name: 'pick_color', 	title: 'Pick Color',		icon: ['sprites.png', -200+3, 3],	attributes: {}		},
	{name: 'pencil',		title: 'Pencil',			icon: ['sprites.png', -250+3, 3],	attributes: {}		},
	{name: 'line', 		title: 'Draw line',		icon: ['sprites.png', -300+3, 3],	attributes: {size: 1, type_values: ['Simple', 'Multi-line', 'Arrow', 'Curve'] }	},
	{name: 'letters', 	title: 'Draw letters',		icon: ['sprites.png', -350+3, 4],	attributes: {}	},
	{name: 'draw_square', 	title: 'Draw rectangle',	icon: ['sprites.png', -400+3, 5],	attributes: {fill: false, square: false}	},
	{name: 'draw_circle', 	title: 'Draw circle',		icon: ['sprites.png', -450+3, 5],	attributes: {fill: false, circle: false}	},
	{name: 'brush',		title: 'Brush',			icon: ['sprites.png', -500+6, 3],	attributes: {type: 'Brush', type_values: ['Brush', 'BezierCurve', 'Chrome', 'Fur', 'Grouped', 'Shaded', 'Sketchy'], size: 10, anti_aliasing: false }, on_update: 'update_brush', },
	{name: 'blur_tool', 	title: 'Blur tool',		icon: ['sprites.png', -250+5, -50+2],	attributes: {size: 30, power: 1}	},
	{name: 'sharpen_tool', 	title: 'Sharpen tool',		icon: ['sprites.png', -300+5, -50+2],	attributes: {size: 30 }	},
	{name: 'burn_dodge_tool', title: 'Burn/Dodge tool',	icon: ['sprites.png', -500+3, -50+4],	attributes: {burn: true, size: 30, power: 50}	},
	{name: 'desaturate_tool', title: 'Desaturate',		icon: ['sprites.png', -550+3, -00+4],	attributes: {size: 50, anti_aliasing: true}	},
	{name: 'bulge_pinch_tool',title: 'Bulge/Pinch tool',	icon: ['sprites.png', -450+3, -100+3],	attributes: {size: 50, radius: 80, bulge:true}	},
	{name: 'clone_tool', 	title: 'Clone tool',		icon: ['sprites.png', -350+4, -50+3],	attributes: {size: 30, anti_aliasing: true}	},
	{name: 'gradient_tool', title: 'Gradient',		icon: ['sprites.png', -400+3, -50+4],	attributes: {radial: false, power: 50}	},
	{name: 'crop_tool',	title: 'Crop',			icon: ['sprites.png', -450+2, -50+2],	attributes: {	} },
];
