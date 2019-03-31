var menu_template = `
	<ul>
		<li>
			<a class="trn" href="#">File</a>
			<ul>
				<li><a class="trn" data-target="file/new.new" href="#">New</a></li>
				<li><div class="mid-line"></div></li>
				<li class="more">
					<a class="trn" href="#">Open</a>
					<ul>
					<li><a class="trn dots" data-target="file/open.open_file" data-key="Drag&Drop" href="#">Open File</a></li>
					<li><a class="trn dots" data-target="file/open.open_dir" href="#">Open Directory</a></li>
					<li><a class="trn dots" data-target="file/open.open_webcam" href="#">Open from Webcam</a></li>
					<li><a class="trn dots" data-target="file/open.open_url" href="#">Open URL</a></li>
					<li><a class="trn dots" data-target="file/open.open_data_url" href="#">Open Data URL</a></li>
					<li><a class="trn dots" data-target="file/open.open_template_test" href="#">Open test template</a></li>
					</ul>
				</li>
				<li><a class="trn dots" data-target="file/search.search" href="#">Search images</a></li>
				<li><div class="mid-line"></div></li>
				<li><a class="trn dots" data-target="file/save.save" data-key="S" href="#">Save as</a></li>
				<li><a class="trn dots" data-target="file/save.save_data_url" href="#">Save as data URL</a></li>
				<li><a class="trn dots" data-target="file/print.print" data-key="Ctrl-P" href="#">Print</a></li>
				<li><div class="mid-line"></div></li>
				<li><a class="trn" data-target="file/quicksave.quicksave" data-key="F9" href="#">Quick save</a></li>
				<li><a class="trn" data-target="file/quickload.quickload" data-key="F10" href="#">Quick load</a></li>
			</ul>
		</li>
		<li>
			<a class="trn" href="#">Edit</a>
			<ul>
				<li><a class="trn" data-target="edit/undo.undo" href="#">Undo</a></li>
				<li><div class="mid-line"></div></li>
				<li><a class="trn" data-target="edit/selection.delete" data-key="Del" href="#">Delete selection</a></li>
				<li><a class="trn" data-target="layer/new.new_selection" href="#">Copy selection</a></li>
				<li><a class="trn" data-target="edit/paste.paste" data-key="Ctrl+V" href="#">Paste</a></li>
				<li><div class="mid-line"></div></li>
				<li><a class="trn" data-target="edit/selection.select_all" href="#">Select all</a></li>
			</ul>
		</li>
		<li>
			<a class="trn" href="#">Image</a>
			<ul>
				<li><a class="trn dots" data-target="image/information.information" href="#">Information</a></li>
				<li><a class="trn dots" data-target="image/size.size" href="#">Size</a></li>
				<li><a class="trn dots" data-target="image/trim.trim" data-key="T" href="#">Trim</a>
				<li class="more">
					<a class="trn" href="#">Zoom</a>
					<ul>
						<li><a class="trn" data-target="image/zoom.in" href="#">Zoom In</a></li>
						<li><a class="trn" data-target="image/zoom.out" href="#">Zoom Out</a></li>
						<li><div class="mid-line"></div></li>
						<li><a class="trn" data-target="image/zoom.original" href="#">Original size</a></li>
						<li><a class="trn" data-target="image/zoom.auto" href="#">Fit window</a></li>
					</ul>
				</li>
				<li><div class="mid-line"></div></li>
				<li><a class="trn dots" data-target="image/resize.resize" href="#">Resize</a></li>
				<li><a class="trn dots" data-target="image/rotate.rotate" href="#">Rotate</a></li>
				<li class="more">
					<a class="trn" href="#">Flip</a>
					<ul>
						<li><a class="trn" data-target="image/flip.vertical" href="#">Vertical</a></li>
						<li><a class="trn" data-target="image/flip.horizontal" href="#">Horizontal</a></li>
					</ul>
				</li>
				<li><a class="trn dots" data-target="image/translate.translate" href="#">Translate</a></li>
				<li><a class="trn dots" data-target="image/opacity.opacity" href="#">Opacity</a></li>
				<li><div class="mid-line"></div></li>
				<li><a class="trn dots" data-target="image/color_corrections.color_corrections" href="#">Color corrections</a></li>
				<li><a class="trn" data-target="image/auto_adjust.auto_adjust" href="#">Auto adjust colors</a></li>
				<li><a class="trn" data-target="image/decrease_colors.decrease_colors" href="#">Decrease color depth</a></li>
				<li><a class="trn dots" data-target="image/palette.palette" href="#">Color palette</a></li>
				<li><a class="trn dots" data-target="image/grid.grid" data-key="G" href="#">Grid</a></li>
				<li><div class="mid-line"></div></li>
				<li><a class="trn dots" data-target="image/histogram.histogram" data-key="H" href="#">Histogram</a></li>
			</ul>
		</li>
		<li>
			<a class="trn" href="#">Layers</a>
			<ul>
				<li><a class="trn" data-target="layer/new.new" data-key="N" href="#">New</a></li>
				<li><a class="trn" data-target="layer/new.new_selection" href="#">New from selection</a></li>
				<li><div class="mid-line"></div></li>
				<li><a class="trn" data-target="layer/duplicate.duplicate" href="#">Duplicate</a></li>
				<li><a class="trn" data-target="layer/visibility.toggle" href="#">Show / Hide</a></li>
				<li><a class="trn" data-target="layer/delete.delete" href="#">Delete</a></li>
				<li><a class="trn" data-target="layer/raster.raster" href="#">Convert to raster</a></li>
				<li><div class="mid-line"></div></li>
				<li class="more">
					<a class="trn" href="#">Move</a>
					<ul>
						<li><a class="trn" data-target="layer/move.up" href="#">Up</a></li>
						<li><a class="trn" data-target="layer/move.down" href="#">Down</a></li>
					</ul>
				</li>
				<li><a class="trn dots" data-target="layer/composition.composition" href="#">Composition</a></li>
				<li><a class="trn dots" data-target="layer/rename.rename" href="#">Rename</a></li>
				<li><a class="trn" data-target="layer/clear.clear" href="#">Clear</a></li>
				<li><div class="mid-line"></div></li>
				<li><a class="trn" data-target="layer/differences.differences" href="#">Differences Down</a></li>
				<li><a class="trn" data-target="layer/merge.merge" href="#">Merge Down</a></li>
				<li><a class="trn" data-target="layer/flatten.flatten" href="#">Flatten Image</a></li>
			</ul>
		</li>
		<li>
			<a class="trn" href="#">Effects</a>
			<ul id="effects_list">
				<li><div class="mid-line"></div></li>
				<li class="more">
					<a class="trn" href="#">CSS filters</a>
					<ul>
						<li><a class="trn dots" data-target="effects/blur.blur" href="#">Gaussian Blur</a>
						<li><a class="trn dots" data-target="effects/brightness.brightness" href="#">Brightness</a>
						<li><a class="trn dots" data-target="effects/contrast.contrast" href="#">Contrast</a>
						<li><a class="trn dots" data-target="effects/grayscale.grayscale" href="#">Grayscale</a>
						<li><a class="trn dots" data-target="effects/hue_rotate.hue_rotate" href="#">Hue Rotate</a>
						<li><a class="trn dots" data-target="effects/negative.negative" href="#">Negative</a>
						<li><a class="trn dots" data-target="effects/saturate.saturate" href="#">Saturate</a>
						<li><a class="trn dots" data-target="effects/sepia.sepia" href="#">Sepia</a>
						<li><a class="trn dots" data-target="effects/shadow.shadow" href="#">Shadow</a>
					</ul>
				</li>
				<li><a class="trn dots" data-target="effects/black_and_white.black_and_white" href="#">Black and White</a>
				<li><a class="trn dots" data-target="effects/blueprint.blueprint" href="#">Blueprint</a>
				<li><a class="trn dots" data-target="effects/box_blur.box_blur" href="#">Box Blur</a>
				<li><a class="trn dots" data-target="effects/denoise.denoise" href="#">Denoise</a>
				<li><a class="trn dots" data-target="effects/dither.dither" href="#">Dither</a>
				<li><a class="trn dots" data-target="effects/dot_screen.dot_screen" href="#">Dot Screen</a>
				<li><a class="trn dots" data-target="effects/edge.edge" href="#">Edge</a>
				<li><a class="trn dots" data-target="effects/emboss.emboss" href="#">Emboss</a>
				<li><a class="trn dots" data-target="effects/enrich.enrich" href="#">Enrich</a>
				<li><a class="trn dots" data-target="effects/grains.grains" href="#">Grains</a>
				<li><a class="trn dots" data-target="effects/heatmap.heatmap" href="#">Heatmap</a>
				<li><a class="trn dots" data-target="effects/mosaic.mosaic" href="#">Mosaic</a>
				<li><a class="trn dots" data-target="effects/night_vision.night_vision" href="#">Night Vision</a>
				<li><a class="trn dots" data-target="effects/oil.oil" href="#">Oil</a>
				<li><a class="trn dots" data-target="effects/pencil.pencil" href="#">Pencil</a>
				<li><a class="trn dots" data-target="effects/sharpen.sharpen" href="#">Sharpen</a>
				<li><a class="trn dots" data-target="effects/solarize.solarize" href="#">Solarize</a>
				<li><a class="trn dots" data-target="effects/tilt_shift.tilt_shift" href="#">Tilt Shift</a>
				<li><a class="trn dots" data-target="effects/vignette.vignette" href="#">Vignette</a>
				<li><a class="trn dots" data-target="effects/vibrance.vibrance" href="#">Vibrance</a>
				<li><a class="trn dots" data-target="effects/vintage.vintage" href="#">Vintage</a>
				<li><a class="trn dots" data-target="effects/zoom_blur.zoom_blur" href="#">Zoom Blur</a>
			</ul>
		</li>
		<li>
			<a class="trn" href="#">Tools</a>
			<ul>
				<li><div class="mid-line"></div></li>
				<li><a class="trn dots" data-target="tools/borders.borders" href="#">Borders</a></li>
				<li><a class="trn" data-target="tools/sprites.sprites" href="#">Sprites</a></li>
				<li><a class="trn" data-target="tools/keypoints.keypoints" href="#">Key-points</a></li>
				<li><a class="trn dots" data-target="tools/content_fill.content_fill" href="#">Content fill</a></li>
				<li><div class="mid-line"></div></li>
				<li><a class="trn dots" data-target="tools/color_to_alpha.color_to_alpha" href="#">Color to alpha</a></li>
				<li><a class="trn dots" data-target="tools/color_zoom.color_zoom" href="#">Color Zoom</a></li>
				<li><a class="trn dots" data-target="tools/replace_color.replace_color" href="#">Replace Color</a></li>
				<li><a class="trn dots" data-target="tools/restore_alpha.restore_alpha" href="#">Restore alpha</a></li>
				<li class="more">
					<a class="trn" href="#">External</a>
					<ul>
						<li><a class="trn external" target="_blank" href="https://tinypng.com/">Compress PNG and JPEG</a>
					</ul>
				</li>
				<li><div class="mid-line"></div></li>
				<li><a class="trn dots" data-target="tools/settings.settings" href="#">Settings</a></li>	
			</ul>
		</li>
		<li>
			<a class="trn" href="#">Help</a>
			<ul>
				<li><a class="trn dots" data-target="help/shortcuts.shortcuts" href="#">Keyboard Shortcuts</a></li>
				<li><a class="trn external" target="_blank" href="https://github.com/viliusle/miniPaint/issues">Report issues</a></li>
				<li class="more">
					<a class="trn" href="#">Language</a>
					<ul>
						<li><a data-target="help/translate.translate.en" href="#">English</a>
						<li><div class="mid-line"></div></li>
						<li><a data-target="help/translate.translate.zh" href="#">简体中文）</a>
						<li><a data-target="help/translate.translate.es" href="#">Español</a>
						<li><a data-target="help/translate.translate.fr" href="#">French</a>	
						<li><a data-target="help/translate.translate.de" href="#">German</a>	
						<li><a data-target="help/translate.translate.it" href="#">Italiano</a>
						<li><a data-target="help/translate.translate.ja" href="#">Japanese</a>
						<li><a data-target="help/translate.translate.ko" href="#">Korean</a>		
						<li><a data-target="help/translate.translate.lt" href="#">Lietuvių</a>
						<li><a data-target="help/translate.translate.pt" href="#">Portuguese</a>	
						<li><a data-target="help/translate.translate.ru" href="#">Russian</a>	
						<li><a data-target="help/translate.translate.tr" href="#">Turkish</a>	
					</ul>
				</li>
				<li><div class="mid-line"></div></li>
				<li><a class="trn dots" data-target="help/about.about" href="#">About</a></li>
			</ul>
		</li>
	</ul>
`;

export default menu_template;