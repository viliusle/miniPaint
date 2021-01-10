const menuDefinition = [
	{
		name: 'File',
		children: [
			{
				name: 'New',
				target: 'file/new.new'
			},
			{
				divider: true
			},
			{
				name: 'Open',
				children: [
					{
						name: 'Open File',
						shortcut: 'O/Drag&Drop',
						ellipsis: true,
						target: 'file/open.open_file'
					},
					{
						name: 'Open Directory',
						ellipsis: true,
						target: 'file/open.open_dir'
					},
					{
						name: 'Open from Webcam',
						target: 'file/open.open_webcam'
					},
					{
						name: 'Open URL',
						ellipsis: true,
						target: 'file/open.open_url'
					},
					{
						name: 'Open Data URL',
						ellipsis: true,
						target: 'file/open.open_data_url'
					},
					{
						name: 'Open Test Template',
						target: 'file/open.open_template_test'
					}
				]
			},
			{
				name: 'Search Images',
				ellipsis: true,
				target: 'file/open.search'
			},
			{
				divider: true
			},
			{
				name: 'Save As',
				ellipsis: true,
				shortcut: 'S',
				target: 'file/save.save'
			},
			{
				name: 'Save As Data URL',
				ellipsis: true,
				target: 'file/save.save_data_url'
			},
			{
				name: 'Print',
				ellipsis: true,
				shortcut: 'Ctrl-P',
				target: 'file/print.print'
			},
			{
				divider: true
			},
			{
				name: 'Quick Save',
				shortcut: 'F9',
				target: 'file/quicksave.quicksave'
			},
			{
				name: 'Quick Load',
				shortcut: 'F10',
				target: 'file/quickload.quickload'
			}
		]
	},
	{
		name: 'Edit',
		children: [
			{
				name: 'Undo',
				shortcut: 'Ctrl+Z',
				target: 'edit/undo.undo'
			},
			{
				name: 'Redo',
				shortcut: 'Ctrl+Y',
				target: 'edit/redo.redo'
			},
			{
				divider: true
			},
			{
				name: 'Delete Selection',
				shortcut: 'Del',
				target: 'edit/selection.delete'
			},
			{
				name: 'Copy Selection',
				target: 'layer/new.new_selection'
			},
			{
				name: 'Copy to Clipboard',
				shortcut: 'Ctrl+C',
				target: 'edit/copy.copy_to_clipboard'
			},
			{
				name: 'Paste',
				shortcut: 'Ctrl+V',
				target: 'edit/paste.paste'
			},
			{
				divider: true
			},
			{
				name: 'Select All',
				shortcut: 'Ctrl+A',
				target: 'edit/selection.select_all'
			}
		]
	},
	{
		name: 'Image',
		children: [
			{
				name: 'Information',
				shortcut: 'I',
				ellipsis: true,
				target: 'image/information.information'
			},
			{
				name: 'Size',
				ellipsis: true,
				target: 'image/size.size'
			},
			{
				name: 'Trim',
				ellipsis: true,
				shortcut: 'T',
				target: 'image/trim.trim'
			},
			{
				name: 'Zoom',
				children: [
					{
						name: 'Zoom In',
						target: 'image/zoom.in'
					},
					{
						name: 'Zoom Out',
						target: 'image/zoom.out'
					},
					{
						divider: true
					},
					{
						name: 'Original Size',
						target: 'image/zoom.original'
					},
					{
						name: 'Fit Window',
						target: 'image/zoom.auto'
					}
				]
			},
			{
				divider: true
			},
			{
				name: 'Resize',
				ellipsis: true,
				shortcut: 'R',
				target: 'image/resize.resize'
			},
			{
				name: 'Rotate',
				ellipsis: true,
				target: 'image/rotate.rotate'
			},
			{
				name: 'Flip',
				children: [
					{
						name: 'Vertical',
						target: 'image/flip.vertical'
					},
					{
						name: 'Horizontal',
						target: 'image/flip.horizontal'
					}
				]
			},
			{
				name: 'Translate',
				ellipsis: true,
				target: 'image/translate.translate'
			},
			{
				name: 'Opacity',
				ellipsis: true,
				target: 'image/opacity.opacity'
			},
			{
				divider: true
			},
			{
				name: 'Color Corrections',
				ellipsis: true,
				target: 'image/color_corrections.color_corrections'
			},
			{
				name: 'Auto Adjust Colors',
				shortcut: 'F',
				target: 'image/auto_adjust.auto_adjust'
			},
			{
				name: 'Decrease Color Depth',
				target: 'image/decrease_colors.decrease_colors'
			},
			{
				name: 'Color Palette',
				ellipsis: true,
				target: 'image/palette.palette'
			},
			{
				name: 'Grid',
				ellipsis: true,
				shortcut: 'G',
				target: 'image/grid.grid'
			},
			{
				divider: true
			},
			{
				name: 'Histogram',
				ellipsis: true,
				shortcut: 'H',
				target: 'image/histogram.histogram'
			}
		]
	},
	{
		name: 'Layers',
		children: [
			{
				name: 'New',
				shortcut: 'N',
				target: 'layer/new.new'
			},
			{
				name: 'New from Selection',
				target: 'layer/new.new_selection'
			},
			{
				divider: true
			},
			{
				name: 'Duplicate',
				shortcut: 'D',
				target: 'layer/duplicate.duplicate'
			},
			{
				name: 'Show / Hide',
				target: 'layer/visibility.toggle'
			},
			{
				name: 'Delete',
				target: 'layer/delete.delete'
			},
			{
				name: 'Convert to Raster',
				target: 'layer/raster.raster'
			},
			{
				divider: true
			},
			{
				name: 'Move',
				children: [
					{
						name: 'Up',
						target: 'layer/move.up'
					},
					{
						name: 'Down',
						target: 'layer/move.down'
					}
				]
			},
			{
				name: 'Composition',
				ellipsis: true,
				target: 'layer/composition.composition'
			},
			{
				name: 'Rename',
				ellipsis: true,
				target: 'layer/rename.rename'
			},
			{
				name: 'Clear',
				target: 'layer/clear.clear'
			},
			{
				divider: true
			},
			{
				name: 'Differences Down',
				target: 'layer/differences.differences'
			},
			{
				name: 'Merge Down',
				target: 'layer/merge.merge'
			},
			{
				name: 'Flatten Image',
				target: 'layer/flatten.flatten'
			}
		]
	},
	{
		name: 'Effects',
		children: [
			{
				name: 'Effect browser',
				ellipsis: true,
				target: 'effects/browser.browser'
			},
			{
				divider: true
			},
			{
				name: 'Common Filters',
				children: [
					{
						name: 'Gaussian Blur',
						ellipsis: true,
						target: 'effects/common/blur.blur'
					},
					{
						name: 'Brightness',
						ellipsis: true,
						target: 'effects/common/brightness.brightness'
					},
					{
						name: 'Contrast',
						ellipsis: true,
						target: 'effects/common/contrast.contrast'
					},
					{
						name: 'Grayscale',
						ellipsis: true,
						target: 'effects/common/grayscale.grayscale'
					},
					{
						name: 'Hue Rotate',
						ellipsis: true,
						target: 'effects/common/hue-rotate.hue_rotate'
					},
					{
						name: 'Negative',
						ellipsis: true,
						target: 'effects/common/invert.invert'
					},
					{
						name: 'Saturate',
						ellipsis: true,
						target: 'effects/common/saturate.saturate'
					},
					{
						name: 'Sepia',
						ellipsis: true,
						target: 'effects/common/sepia.sepia'
					},
					{
						name: 'Shadow',
						ellipsis: true,
						target: 'effects/common/shadow.shadow'
					},
				]
			},
			{
				name: 'Instagram Filters',
				children: [
					{
						name: '1977',
						target: 'effects/instagram/1977.1977'
					},
					{
						name: 'Aden',
						target: 'effects/instagram/aden.aden'
					},
					{
						name: 'Clarendon',
						target: 'effects/instagram/clarendon.clarendon'
					},
					{
						name: 'Gingham',
						target: 'effects/instagram/gingham.gingham'
					},
					{
						name: 'Inkwell',
						target: 'effects/instagram/inkwell.inkwell'
					},
					{
						name: 'Lo-fi',
						target: 'effects/instagram/lofi.lofi'
					},
					{
						name: 'Toaster',
						target: 'effects/instagram/toaster.toaster'
					},
					{
						name: 'Valencia',
						target: 'effects/instagram/valencia.valencia'
					},
					{
						name: 'X-Pro II',
						target: 'effects/instagram/xpro2.xpro2'
					}
				]
			},
			{
				name: 'Black and White',
				ellipsis: true,
				target: 'effects/black_and_white.black_and_white'
			},
			{
				name: 'Blueprint',
				target: 'effects/blueprint.blueprint'
			},
			{
				name: 'Box Blur',
				ellipsis: true,
				target: 'effects/box_blur.box_blur'
			},
			{
				name: 'Denoise',
				ellipsis: true,
				target: 'effects/denoise.denoise'
			},
			{
				name: 'Dither',
				ellipsis: true,
				target: 'effects/dither.dither'
			},
			{
				name: 'Dot Screen',
				ellipsis: true,
				target: 'effects/dot_screen.dot_screen'
			},
			{
				name: 'Edge',
				target: 'effects/edge.edge'
			},
			{
				name: 'Emboss',
				target: 'effects/emboss.emboss'
			},
			{
				name: 'Enrich',
				ellipsis: true,
				target: 'effects/enrich.enrich'
			},
			{
				name: 'Grains',
				ellipsis: true,
				target: 'effects/grains.grains'
			},
			{
				name: 'Heatmap',
				target: 'effects/heatmap.heatmap'
			},
			{
				name: 'Mosaic',
				ellipsis: true,
				target: 'effects/mosaic.mosaic'
			},
			{
				name: 'Night Vision',
				target: 'effects/night_vision.night_vision'
			},
			{
				name: 'Oil',
				ellipsis: true,
				target: 'effects/oil.oil'
			},
			{
				name: 'Pencil',
				target: 'effects/pencil.pencil'
			},
			{
				name: 'Sharpen',
				ellipsis: true,
				target: 'effects/sharpen.sharpen'
			},
			{
				name: 'Solarize',
				target: 'effects/solarize.solarize'
			},
			{
				name: 'Tilt Shift',
				ellipsis: true,
				target: 'effects/tilt_shift.tilt_shift'
			},
			{
				name: 'Vignette',
				ellipsis: true,
				target: 'effects/vignette.vignette'
			},
			{
				name: 'Vibrance',
				ellipsis: true,
				target: 'effects/vibrance.vibrance'
			},
			{
				name: 'Vintage',
				ellipsis: true,
				target: 'effects/vintage.vintage'
			},
			{
				name: 'Zoom Blur',
				ellipsis: true,
				target: 'effects/zoom_blur.zoom_blur'
			}
		]
	},
	{
		name: 'Tools',
		children: [
			{
				name: 'Borders',
				ellipsis: true,
				target: 'tools/borders.borders'
			},
			{
				name: 'Sprites',
				target: 'tools/sprites.sprites'
			},
			{
				name: 'Key-Points',
				target: 'tools/keypoints.keypoints'
			},
			{
				name: 'Content Fill',
				ellipsis: true,
				target: 'tools/content_fill.content_fill'
			},
			{
				divider: true
			},
			{
				name: 'Color Zoom',
				ellipsis: true,
				target: 'tools/color_zoom.color_zoom'
			},
			{
				name: 'Replace Color',
				ellipsis: true,
				target: 'tools/replace_color.replace_color'
			},
			{
				name: 'Restore Alpha',
				ellipsis: true,
				target: 'tools/restore_alpha.restore_alpha'
			},
			{
				name: 'External',
				children: [
					{
						name: 'TINYPNG - Compress PNG and JPEG',
						href: 'https://tinypng.com'
					},
					{
						name: 'REMOVE.BG - Remove Image Background',
						href: 'https://www.remove.bg'
					},
					{
						name: 'PNGTOSVG - Convert Image to SVG',
						href: 'https://www.pngtosvg.com'
					},
					{
						name: 'SQUOOSH - Compress and Compare Images',
						href: 'https://squoosh.app'
					}
				]
			},
			{
				divider: true
			},
			{
				name: 'Settings',
				ellipsis: true,
				target: 'tools/settings.settings'
			}
		]
	},
	{
		name: 'Help',
		children: [
			{
				name: 'Keyboard Shortcuts',
				ellipsis: true,
				target: 'help/shortcuts.shortcuts'
			},
			{
				name: 'Report Issues',
				href: 'https://github.com/viliusle/miniPaint/issues'
			},
			{
				name: 'Language',
				children: [
					{
						name: 'English',
						target: 'help/translate.translate.en'
					},
					{
						divider: true
					},
					{
						name: '简体中文',
						target: 'help/translate.translate.zh'
					},
					{
						name: 'Español',
						target: 'help/translate.translate.es'
					},
					{
						name: 'Français',
						target: 'help/translate.translate.fr'
					},
					{
						name: 'Deutsch',
						target: 'help/translate.translate.de'
					},
					{
						name: 'Italiano',
						target: 'help/translate.translate.it'
					},
					{
						name: '日本語',
						target: 'help/translate.translate.ja'
					},
					{
						name: '한국어',
						target: 'help/translate.translate.ko'
					},
					{
						name: 'Lietuvių',
						target: 'help/translate.translate.lt'
					},
					{
						name: 'Português',
						target: 'help/translate.translate.pt'
					},
					{
						name: 'русский язык',
						target: 'help/translate.translate.ru'
					},
					{
						name: 'Türkçe',
						target: 'help/translate.translate.tr'
					}
				]
			},
			{
				divider: true
			},
			{
				name: 'About',
				target: 'help/about.about'
			}
		]
	}
];


export default menuDefinition;