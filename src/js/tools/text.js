import app from './../app.js';
import config from './../config.js';
import zoomView from './../libs/zoomView.js';
import Base_tools_class from './../core/base-tools.js';
import Base_selection_class from './../core/base-selection.js';
import Base_layers_class from './../core/base-layers.js';
import GUI_tools_class from './../core/gui/gui-tools.js';
import Helper_class from './../libs/helpers.js';
import Dialog_class from './../libs/popup.js';
import WebFont from 'webfontloader';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';

/**
 * TODO
 * - Add leading, superscript, subscript
 * - Implement text direction (right to left, top to bottom, etc.); currently partial implementation
 * - Allow search & add google fonts
 * - Undo history
 */

// Default text styling
// WARNING - changing this could break backwards compatibility!
// Defaults aren't saved in text layer in order to reduce data size and increase meta comparison performance.
export const metaDefaults = {
	size: 40,
	family: 'Arial',
	kerning: 0,
	leading: 0,
	bold: false,
	italic: false,
	underline: false,
	strikethrough: false,
	fill_color: '#008800',
	stroke_size: 0,
	stroke_color: '#000000'
};

// Global map of font name to font metrics information.
const fontMetricsMap = new Map();
const layerEditors = new WeakMap();
const fontLoadPromiseMap = new Map();
const fontLoadMap = new Map();
fontLoadMap.set('Arial', true);
fontLoadMap.set('Courier', true);
fontLoadMap.set('Impact', true);
fontLoadMap.set('Helvetica', true);
fontLoadMap.set('Monospace', true);
fontLoadMap.set('Tahoma', true);
fontLoadMap.set('Times New Roman', true);
fontLoadMap.set('Verdana', true);

function load_font_family({ family, variants }, successCallback) {
	if (fontLoadMap.get(family) == null) {
		fontLoadMap.set(family, false);
		const loadPromise = new Promise((resolve, reject) => {
			WebFont.load({
				google: {
					families: [family + (variants ? ':' + variants.join(',') : '')]
				},
				fontactive: (family) => {
					fontLoadMap.set(family, true);
					fontLoadPromiseMap.delete(family);
					resolve();
				},
				fontinactive: (family) => {
					alertify.error('Font ' + family + ' could not be loaded.');
					fontLoadPromiseMap.delete(family);
					reject();
				}
			});
		});
		fontLoadPromiseMap.set(family, loadPromise);
	}
	if (successCallback) {
		const loadPromise = fontLoadPromiseMap.get(family);
		if (loadPromise) {
			loadPromise.then(successCallback);
		} else if (fontLoadMap.get(family) == true) {
			requestAnimationFrame(() => {
				successCallback();
			});
		}
	}
}

/**
 * The canvas's native font metrics implementation doesn't really give us enough information...
 */
const kerningTestCanvas = document.createElement('canvas');
kerningTestCanvas.width = 10;
kerningTestCanvas.height = 10;
kerningTestCanvas.style = 'font-kerning: normal; text-rendering: optimizeLegibility;';
const kerningTestCtx = kerningTestCanvas.getContext('2d');
class Font_metrics_class {
	constructor(family, size) {
		this.family = family || (family = "Arial");
		this.size = parseInt(size) || (size = 12);
		this.kerningMap = new Map();

		// Preparing container
		const line = document.createElement('div');
		const body = document.body;
		line.style.position = 'absolute';
		line.style.whiteSpace = 'nowrap';
		line.style.font = size + 'px ' + family;
		body.appendChild(line);

		// Now we can measure width and height of the letter
		const text = '——————————'; // 10 symbols to be more accurate with width
		line.innerHTML = text;
		this.width = line.offsetWidth / text.length;
		this.height = line.offsetHeight;

		// Now creating 1px sized item that will be aligned to baseline
		// to calculate baseline shift
		const baseline = document.createElement('span');
		baseline.style.display = 'inline-block';
		baseline.style.overflow = 'hidden';
		baseline.style.width = '1px';
		baseline.style.height = '1px';
		line.appendChild(baseline);

		// Baseline is important for positioning text on canvas
		this.baseline = baseline.offsetTop + baseline.offsetHeight;

		document.body.removeChild(line);
	}

	/**
	 * Attempts to determine the height of a letter via pixel comparison
	 * @param {string} letter - The letter to check
	 * @param {string} [baseline] - Baseline position override
	 */
	calculate_letter_bounds(letter, baseline) {
		baseline = baseline || 'alphabetic'
		kerningTestCanvas.width = this.width;
		kerningTestCanvas.height = this.height;
		kerningTestCtx.clearRect(0, 0, this.width, this.height);
		kerningTestCtx.font =
		' ' + (this.size) + 'px' +
		' ' + this.family;
		kerningTestCtx.textAlign = 'left';
		kerningTestCtx.textBaseline = baseline;
		kerningTestCtx.fillStyle = '#000000';
		kerningTestCtx.fillText(letter, 0, baseline === 'alphabetic' ? this.baseline : 0);
		const pixels = kerningTestCtx.getImageData(0, 0, this.width, this.height).data;
		const pixelLength = pixels.length;
		let start = 0;
		let end = this.height;
		for (let i = 0; i < pixelLength; i += 4) {
			if (pixels[i + 3] !== 0) {
				start = Math.floor(i / 4 / this.width);
				break;
			}
		}
		for (let i = pixelLength - 4; i >= 0; i -= 4) {
			if (pixels[i + 3] !== 0) {
				end = Math.floor(i / 4 / this.width);
				break;
			}
		}
		kerningTestCanvas.width = 10;
		kerningTestCanvas.height = 10;
		return {
			top: start,
			bottom: end,
			height: end - start
		}
	}

	/**
	 * Calculate the kerning offset between two letters.
	 * @param {string} letters - a two character string of the two letters to determine font kerning from. Returns the kerning offset that should be used to draw the 2nd letter. 
	 * @param {object} flags - font style, such as bold or italic
	 */
	get_kerning_offset(letters, flags = {}) {
		let offset = this.kerningMap.get(letters);
		if (offset == null) {
			kerningTestCtx.font =
			' ' + (flags.italic ? 'italic' : '') +
			' ' + (flags.bold ? 'bold' : '') +
			' ' + (this.size) + 'px' +
			' ' + this.family;
			offset = kerningTestCtx.measureText(letters).width - (kerningTestCtx.measureText(letters[0]).width + kerningTestCtx.measureText(letters[1]).width);
			this.kerningMap.set(letters, offset);
		}
		return offset;
	}
}

/**
 * This class's job is to store and modify the internal JSON format of a text layer.
 */
class Text_document_class {
	constructor() {
		this.lines = [];
		this.on_change = null;

		// If user edits params while no selection, queue meta insertion for next type.
		this.queuedMetaChanges = null;
	}

	/**
	 * Returns the number of lines in the document.
	 */
	get_line_count() {
		return this.lines.length;
	}

	/**
	 * Returns the length of a given line
	 * @param {number} lineNumber - The number of the line to get the length of
	 */
	get_line_character_count(lineNumber) {
		return this.get_line_text(lineNumber).length;
	}
	
	/**
	 * Returns the text string at a given line (ignores formatting).
	 * @param {number} lineNumber - The number of the line to get the text from
	 */
	get_line_text(lineNumber) {
		let lineText = '';
		for (let i = 0; i < this.lines[lineNumber].length; i++) {
			lineText += this.lines[lineNumber][i].text;
		}
		return lineText;
	}
	
	/**
	 * Returns the position of the end of the the word at the line/character provided
	 * @param {number} line - The reference line number (0 indexed) 
	 * @param {number} character - The reference character position (0 indexed)
	 * @param {boolean} noJump - Dont jump to the next word if at the end of current one
	 */
	get_word_end_position(line, character, noJump) {
		let newLine = line;
		let newCharacter = character;
		let fullText = this.get_line_text(newLine);
		if (character === fullText.length && newLine < this.lines.length - 1) {
			if (noJump) {
				return { line, character };
			}
			newLine += 1;
			character = 0;
			fullText = this.get_line_text(newLine);
		}
		const text = fullText.slice(character);
		if (noJump && text[0] === ' ') {
			return { line, character };
		}
		for (let i = 1; i < text.length; i++) {
			if (text[i] === ' ') {
				newCharacter = character + i;
				break;
			}
		}
		if (newCharacter === character) {
			newCharacter = fullText.length + 1;
		}
		return {
			line: newLine,
			character: newCharacter
		}
	}

	/**
	 * Returns the position of the start of the the word at the line/character provided
	 * @param {number} line - The reference line number (0 indexed) 
	 * @param {number} character - The reference character position (0 indexed)
	 * @param {boolean} noJump - Dont jump to the next word if at the end of current one
	 */
	get_word_start_position(line, character, noJump) {
		let newLine = line;
		let newCharacter = character;
		let isWrap = false;
		if (character === 0 && newLine > 0) {
			if (noJump) {
				return { line, character };
			}
			isWrap = true;
			newLine -= 1;
		}
		const fullText = this.get_line_text(newLine);
		if (isWrap) {
			character = fullText.length;
		}
		const text = fullText.slice(0, character);
		if (noJump && text[text.length - 1] === ' ') {
			return { line, character };
		}
		for (let i = -1; i >= -text.length; i--) {
			if (text[i + text.length - 1] === ' ') {
				newCharacter = character + i;
				break;
			}
		}
		if (newCharacter === character) {
			newCharacter = 0;
		}
		return {
			line: newLine,
			character: newCharacter
		}
	}
	
	/**
	 * Determine if the metadata (formatting) of two text spans is the same, usually used to determine if the spans can be merged together.
	 */
	is_same_span_meta(meta1, meta2) {
		const meta1Keys = Object.keys(meta1).sort();
		const meta2Keys = Object.keys(meta2).sort();
		if (meta1Keys.length !== meta2Keys.length) {
			return false;
		}
		for (let i = 0; i < meta1Keys.length; i++) {
			if (meta1Keys[i] !== meta2Keys[i]) {
				return false;
			}
			const meta1Value = meta1[meta1Keys[i]];
			const meta2Value = meta2[meta2Keys[i]];
			if (JSON.stringify(meta1Value) !== JSON.stringify(meta2Value)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Inserts a span with empty text in the document at the specified line and character position
	 * @param {number} line - The line number to insert at (0 indexed) 
	 * @param {number} character - The character position to insert at (0 indexed)
	 * @param {object} meta - Metadata to associate with span
	 */
	insert_empty_span(line, character, meta) {
		let insertedSpan = null;
		const lineDef = this.lines[line];
		let newLine = [];
		let spanStartCharacter = 0;
		let wasInserted = false;
		for (let span of lineDef) {
			if (!wasInserted && character >= spanStartCharacter && character <= spanStartCharacter + span.text.length) {
				let textBefore = span.text.slice(0, character - spanStartCharacter);
				let textAfter = span.text.slice(character - spanStartCharacter);
				if (textBefore.length > 0) {
					newLine.push({
						text: textBefore,
						meta: JSON.parse(JSON.stringify(span.meta))
					});
				}
				const newMeta = JSON.parse(JSON.stringify(span.meta));
				for (let metaKey in meta) {
					newMeta[metaKey] = meta[metaKey];
				}
				insertedSpan = {
					text: '',
					meta: newMeta
				};
				newLine.push(insertedSpan);
				if (textAfter.length > 0) {
					newLine.push({
						text: textAfter,
						meta: JSON.parse(JSON.stringify(span.meta))
					});
				}
				wasInserted = true;
			} else {
				newLine.push(span);
			}
			spanStartCharacter += span.text.length;
		}
		this.lines[line] = newLine;
		return insertedSpan;
	}
	
	/**
	 * Inserts a text string in the document at the specified line and character position
	 * @param {string} text - The text string to insert
	 * @param {number} line - The line number to insert at (0 indexed) 
	 * @param {number} character - The character position to insert at (0 indexed)
	 */
	insert_text(text, line, character) {

		let insertedSpan;
		if (this.queuedMetaChanges) {
			insertedSpan = this.insert_empty_span(line, character, this.queuedMetaChanges);
			this.queuedMetaChanges = null;
		}

		const insertLine = this.lines[line];
		const textHasNewline = text.includes('\n');
		let characterCount = 0;
		let modifyingSpan = null;
		let previousSpans = [];
		let nextSpans = [];
		let newLine = line;
		let newCharacter = character;

		// Insert text into span at specified line/character
		for (let i = 0; i < insertLine.length; i++) {
			const span = insertLine[i];
			const spanLength = span.text.length;
			if (!modifyingSpan && (character > characterCount || character === 0) && character <= characterCount + spanLength) {
				if (insertLine[i + 1] && insertLine[i + 1].text === '') {
					modifyingSpan = insertLine[i + 1];
				} else {
					modifyingSpan = span;
				}
				const textIdx = character - characterCount;
				modifyingSpan.text = modifyingSpan.text.slice(0, textIdx) + text + modifyingSpan.text.slice(textIdx);
				if (!textHasNewline) {
					newCharacter = characterCount + textIdx + text.length;
					break;
				}
			} else if (textHasNewline) {
				if (modifyingSpan) {
					nextSpans.push(span);
				} else {
					previousSpans.push(span);
				}
			}
			characterCount += spanLength;
		}

		// Create new lines if newline character was used
		if (textHasNewline && modifyingSpan) {
			const modifiedSpans = [];
			const textLines = modifyingSpan.text.split('\n');
			for (let i = 0; i < textLines.length; i++) {
				modifiedSpans.push({
					meta: JSON.parse(JSON.stringify(modifyingSpan.meta)),
					text: textLines[i]
				});
			}
			this.lines[line] = [...previousSpans, modifiedSpans.shift()];
			for (let i = 0; i < modifiedSpans.length; i++) {
				if (i === modifiedSpans.length - 1) {
					if (!modifiedSpans[i].text && nextSpans.length > 0) {
						this.lines.splice(line + i + 1, 0, nextSpans);
					} else {
						this.lines.splice(line + i + 1, 0, [modifiedSpans[i], ...nextSpans]);
					}
					newLine = line + i + 1;
					newCharacter = text.length - 1 - text.lastIndexOf('\n');
				} else {
					this.lines.splice(line + i + 1, 0, [modifiedSpans[i]]);
				}
			}
		}

		// Notify change
		if (this.on_change) {
			this.on_change(this.lines);
		}

		// Return end position
		return {
			line: newLine,
			character: newCharacter
		};
	}
	
	/**
	 * Deletes text withing the specified range
	 * @param {number} startLine - The starting line of the text range
	 * @param {number} startCharacter - The character position at the starting line of the text range
	 * @param {number} endLine - The ending line of the text range
	 * @param {number} endCharacter - The character position at the ending line of the text range
	 */
	delete_range(startLine, startCharacter, endLine, endCharacter) {
		// Check bounds
		startLine >= 0 || (startLine = 0);
		startCharacter >= 0 || (startCharacter = 0);
		endLine < this.lines.length || (endLine = this.lines.length - 1);
		const endLineCharacterCount = this.get_line_character_count(endLine);
		endCharacter <= endLineCharacterCount || (
			endCharacter = endLineCharacterCount
		);

		// Early return if there's nothing to delete
		if (startLine === endLine && startCharacter === endCharacter) {
			return {
				line: startLine,
				character: startCharacter
			};
		}

		// Get spans in start line before range
		const beforeSpans = [];
		const afterSpans = [];
		let characterCount = 0;
		let startSpan = null;
		let startSpanDeleteIndex = 0;
		for (let i = 0; i < this.lines[startLine].length; i++) {
			const span = this.lines[startLine][i];
			const spanLength = span.text.length;
			if (!startSpan && (startCharacter > characterCount || startCharacter === 0) && startCharacter <= characterCount + spanLength) {
				startSpan = span;
				startSpanDeleteIndex = Math.max(0, startCharacter - characterCount);
				break;
			}
			if (!startSpan) {
				beforeSpans.push(span);
			}
			characterCount += spanLength;
		}

		// Get spans in end line after range
		characterCount = 0;
		let endSpan = null;    
		let endSpanDeleteIndex = 0;
		for (let i = 0; i < this.lines[endLine].length; i++) {
			const span = this.lines[endLine][i];
			const spanLength = span.text.length;
			if (!endSpan && (endCharacter > characterCount || endCharacter === 0) && endCharacter <= characterCount + spanLength) {
				endSpan = span;
				endSpanDeleteIndex = Math.max(0, endCharacter - characterCount);
			}
			else if (endSpan) {
				afterSpans.push(span);
			}
			characterCount += spanLength;
		}

		// Merge start and end lines
		this.lines[startLine] = [...beforeSpans];
		if (startSpan === endSpan || this.is_same_span_meta(startSpan.meta, endSpan.meta)) {
			const combinedSpans = {
				meta: startSpan.meta,
				text: startSpan.text.slice(0, startSpanDeleteIndex) + endSpan.text.slice(endSpanDeleteIndex)
			};
			if (combinedSpans.text || (beforeSpans.length === 0 && afterSpans.length === 0)) {
				this.lines[startLine].push(combinedSpans);
			}
		} else {
			const middleSpans = [];
			let isAddedStartSpan = false;
			let isAddedEndSpan = false;
			if (startSpan) {
				startSpan.text = startSpan.text.slice(0, startSpanDeleteIndex);
				if (startSpan.text) {
					middleSpans.push(startSpan);
					isAddedStartSpan = true;
				}
			}
			if (endSpan) {
				endSpan.text = endSpan.text.slice(endSpanDeleteIndex)
				if (endSpan.text || middleSpans.length === 0) {
					middleSpans.push(endSpan);
					isAddedEndSpan = true;
				}
			}
			if (isAddedStartSpan && !isAddedEndSpan) {
				const afterSpan = afterSpans[0];
				if (afterSpan && this.is_same_span_meta(startSpan.meta, afterSpan.meta)) {
					afterSpans.shift();
					startSpan.text += afterSpan.text;
				}
			}
			else if (isAddedEndSpan && !isAddedStartSpan) {
				const beforeSpan = beforeSpans[beforeSpans.length - 1];
				if (beforeSpan && this.is_same_span_meta(beforeSpan.meta, endSpan.meta)) {
					beforeSpans.pop();
					beforeSpan.text += endSpan.text;
				}
			}
			else if (middleSpans.length === 0) {
				const beforeSpan = beforeSpans[beforeSpans.length - 1];
				const afterSpan = afterSpans[0];
				if (beforeSpan && afterSpan && this.is_same_span_meta(beforeSpan.meta, afterSpan.meta)) {
					afterSpans.shift();
					beforeSpan.text += afterSpan.text;
				}
			}
			this.lines[startLine] = this.lines[startLine].concat(middleSpans);
		}
		this.lines[startLine] = this.lines[startLine].concat(afterSpans);

		// Delete lines in-between range
		this.lines.splice(startLine + 1, endLine - startLine);

		// Notify change
		if (this.on_change) {
			this.on_change(this.lines);
		}

		// Return new position
		return {
			line: startLine,
			character: startCharacter
		};
	}
	
	/**
	 * Deletes a single character in front or behind the specified character position, handling deleting new lines, etc.
	 * @param {boolean} forward - True if deleting the next character, otherwise deletes the previous character
	 * @param {number} startLine - The line number to delete from
	 * @param {number} startCharacter - The character position to delete from
	 */
	delete_character(forward, startLine, startCharacter) {
		let endLine = startLine;
		let endCharacter = startCharacter;
		
		// Delete forwards
		if (forward) {
			// If there are characters after cursor on this line we remove one
			if (startCharacter < this.get_line_character_count(startLine)) {
				++endCharacter;
			}
			// if there are Lines after this one we append it
			else if (startLine < this.lines.length - 1) {
				++endLine;
				endCharacter = 0;
			}
		}
		// Delete backwards
		else {
			// If there are characters before the cursor on this line we remove one
			if (startCharacter > 0) {
				--startCharacter;
			}
			// if there are rows before we append current to previous one
			else if (startLine > 0) {
				--startLine;
				startCharacter = this.get_line_character_count(startLine);
			}
		}

		return this.delete_range(startLine, startCharacter, endLine, endCharacter);
	}
	
	/**
	 * Retrieves a metadata summary object for the specified range of text. 
	 * @param {number} startLine - The starting line of the text range
	 * @param {number} startCharacter - The character position at the starting line of the text range
	 * @param {number} endLine - The ending line of the text range
	 * @param {number} endCharacter - The character position at the ending line of the text range
	 */
	get_meta_range(startLine, startCharacter, endLine, endCharacter) {
		// Check bounds
		startLine >= 0 || (startLine = 0);
		startCharacter >= 0 || (startCharacter = 0);
		endLine < this.lines.length || (endLine = this.lines.length - 1);
		const endLineCharacterCount = this.get_line_character_count(endLine);
		endCharacter <= endLineCharacterCount || (
			endCharacter = endLineCharacterCount
		);
		const isEmpty = startLine === endLine && startCharacter === endCharacter;

		// Loop through all spans in range and collect meta values
		const metaCollection = {};
		for (const metaKey in metaDefaults) {
			metaCollection[metaKey] = [];
		}
		let isInsideRange = false;
		for (let lineIndex = startLine; lineIndex <= endLine; lineIndex++) {
			const line = this.lines[lineIndex];
			let spanStartCharacter = 0;
			let startSpan = null;
			let endSpan = null;
			for (let spanIndex = 0; spanIndex < line.length; spanIndex++) {
				const span = line[spanIndex];
				if (lineIndex === startLine) {
					if (
						(!isEmpty && startCharacter >= spanStartCharacter && startCharacter < spanStartCharacter + span.text.length) ||
						(isEmpty && startCharacter > spanStartCharacter && startCharacter <= spanStartCharacter + span.text.length) ||
						(startCharacter === 0 && spanStartCharacter === 0)
					) {
						isInsideRange = true;
						startSpan = span;
					}
				}
				if (lineIndex === endLine && isInsideRange) {
					if (
						(!isEmpty && endCharacter <= spanStartCharacter + span.text.length) ||
						(isEmpty && endCharacter < spanStartCharacter + span.text.length)
					) {
						endSpan = span;
						isInsideRange = false;
					}
				}
				if (isInsideRange || startSpan === span || (!isEmpty && endSpan === span)) {
					for (const metaKey in metaCollection) {
						let metaValue = span.meta[metaKey];
						if (metaValue == null) {
							metaValue = metaDefaults[metaKey];
						}
						if (!metaCollection[metaKey].includes(metaValue)) {
							metaCollection[metaKey].push(metaValue);
						}
					}
				}
				spanStartCharacter += span.text.length;
			}
		}

		// Fill in default values for undefined meta keys
		for (const metaKey in metaDefaults) {
			if (metaCollection[metaKey].length === 0) {
				metaCollection[metaKey] = [metaDefaults[metaKey]];
			}
		}
		return metaCollection;
	}

	/**
	 * Sets styling metadata for the specified range of text. 
	 * @param {number} startLine - The starting line of the text range
	 * @param {number} startCharacter - The character position at the starting line of the text range
	 * @param {number} endLine - The ending line of the text range
	 * @param {number} endCharacter - The character position at the ending line of the text range
	 * @param {object} meta - The meta to set
	 */
	set_meta_range(startLine, startCharacter, endLine, endCharacter, meta) {
		// Check bounds
		startLine >= 0 || (startLine = 0);
		startCharacter >= 0 || (startCharacter = 0);
		endLine < this.lines.length || (endLine = this.lines.length - 1);
		const endLineCharacterCount = this.get_line_character_count(endLine);
		endCharacter <= endLineCharacterCount || (
			endCharacter = endLineCharacterCount
		);

		// Set meta of spans in selection
		let isInsideRange = false;
		for (let lineIndex = startLine; lineIndex <= endLine; lineIndex++) {
			const line = this.lines[lineIndex];
			let newLine = [];
			let spanStartCharacter = 0;
			for (let span of line) {
				const spanText = span.text;
				const spanLength = spanText.length;
				if (lineIndex === startLine) {
					if (startCharacter <= spanStartCharacter) {
						isInsideRange = true;
					}
				}
				if (lineIndex === endLine) {
					if (endCharacter < spanStartCharacter + spanLength) {
						isInsideRange = false;
					}
				}
				// Selection start splits the span it's inside of
				let choppedStartCharacters = 0;
				if (startCharacter > spanStartCharacter && startCharacter < spanStartCharacter + spanLength && lineIndex === startLine) {
					choppedStartCharacters = startCharacter - spanStartCharacter;
					newLine.push({
						text: span.text.slice(0, startCharacter - spanStartCharacter),
						meta: JSON.parse(JSON.stringify(span.meta))
					});
					span.text = span.text.slice(startCharacter - spanStartCharacter);
					isInsideRange = true;
				}
				newLine.push(span);
				// Selection end splits the span it's inside of
				if (endCharacter > spanStartCharacter && endCharacter < spanStartCharacter + spanLength && lineIndex === endLine) {
					newLine.push({
						text: span.text.slice(endCharacter - spanStartCharacter - choppedStartCharacters),
						meta: JSON.parse(JSON.stringify(span.meta))
					});
					span.text = span.text.slice(0, endCharacter - spanStartCharacter - choppedStartCharacters);
					isInsideRange = true;
				}
				// Add meta to span
				if (isInsideRange) {
					for (const metaKey in meta) {
						span.meta[metaKey] = meta[metaKey];
					}
				}
				spanStartCharacter += spanLength;
			}
			this.lines[lineIndex] = newLine;
		}

		this.normalize(startLine, endLine);

		// Notify change
		if (this.on_change) {
			this.on_change(this.lines);
		}
	}

	/**
	 * Merges sibling spans that have the same metadata, and removes empty spans. 
	 * @param {number} startLine - The starting line of the text range
	 * @param {number} endLine - The ending line of the text range
	 */
	normalize(startLine, endLine) {
		for (let lineIndex = startLine; lineIndex <= endLine; lineIndex++) {
			const line = this.lines[lineIndex];
			let spanIndex = 0;
			for (spanIndex = 0; spanIndex < line.length; spanIndex++) {
				const span1 = line[spanIndex];
				const span2 = line[spanIndex + 1];
				if (span1 && span2 && this.is_same_span_meta(span1.meta, span2.meta)) {
					line[spanIndex] = {
						text: span1.text + span2.text,
						meta: span1.meta
					};
					line.splice(spanIndex + 1, 1);
					spanIndex--;
					continue;
				}
				if (span1.text === '' && line.length > 1) {
					line.splice(spanIndex, 1);
					spanIndex--;
					continue;
				}
			}
		}
	}

}


/**
 * This class represents a single selection range in a text editor's document.
 */
class Text_selection_class {
	constructor(/* Text_editor_class */ editor) {
		this.editor = editor;
		this.isVisible = false;
		this.isCursorVisible = false;
		this.isActiveSideEnd = true;
		this.isBlinkVisible = true;
		this.blinkInterval = 500;

		this.start = {
			line: 0,
			character: 0
		};
		
		this.end = {
			line: 0,
			character: 0
		};

		this.set_position(0, 0);
	}
	
	/**
	 * Returns if the current text selection contains no characters
	 * @returns {boolean}
	 */
	is_empty() {
		return this.compare_position(this.start.line, this.start.character, this.end.line, this.end.character) === 0;
	}
	
	/**
	 * Determines the relative position of two line/character sets.
	 * @param {number} line1
	 * @param {number} character1 
	 * @param {number} line2 
	 * @param {number} character2
	 * @returns {number} -1 if line1/character1 is less than line2/character2, 1 if greater, and 0 if equal
	 */
	compare_position(line1, character1, line2, character2) {
		if (line1 < line2) {
			return -1;
		} else if (line1 > line2) {
			return 1;
		} else {
			if (character1 < character2) {
				return -1;
			} else if (character1 > character2) {
				return 1;
			} else {
				return 0;
			}
		}
	}
	
	/**
	 * Sets the head position of the selection to the specified line/character, optionally extends to selection to that position.
	 * @param {number} line - The line number to set the selection to 
	 * @param {number} character - The character index to set the selection to
	 * @param {boolean} [keepSelection] - If true, extends the current selection to the specified position. If false or undefined, sets an empty selection at that position. 
	 */
	set_position(line, character, keepSelection) {
		if (line == null) {
			line = this.end.line;
		}
		if (character == null) {
			character = this.end.character;
		}

		// Check lower bounds
		line >= 0 || (line = 0);
		character >= 0 || (character = 0);

		// Check upper bounds
		const lineCount = this.editor.document.get_line_count();
		line < lineCount || (line = lineCount - 1);
		const lineCharacterCount = this.editor.document.get_line_character_count(line);
		character <= lineCharacterCount || (character = lineCharacterCount);

		// Add to selection
		if (keepSelection) {
			const positionCompare = this.compare_position(
				line,
				character,
				this.start.line,
				this.start.character
			);

			// Determine whether we should make the start side of the range active, selection moving left or up.
			if (positionCompare === -1 && (this.is_empty() || line < this.start.line)) {
				this.isActiveSideEnd = false;
			}

			// Assign new value to the side that is active
			if (this.isActiveSideEnd) {
				this.end.line = line;
				this.end.character = character;
			} else {
				this.start.line = line;
				this.start.character = character;
			}

			// Making sure that end is greater than start and swap if necessary
			if (this.compare_position(this.start.line, this.start.character, this.end.line, this.end.character) > 0) {
				this.isActiveSideEnd = !this.isActiveSideEnd;
				const temp = {
					line: this.start.line,
					character: this.start.character
				}
				this.start.line = this.end.line;
				this.start.character = this.end.character;
				this.end.line = temp.line;
				this.end.character = temp.character;
			}
		}
		// Empty cursor move
		else {
			this.isActiveSideEnd = true;
			this.start.line = this.end.line = line;
			this.start.character = this.end.character = character;
		}

		// Reset cursor blink
		this.isBlinkVisible = true;
		if (this.isVisible) {
			this.start_blinking();
		}
	}
	
	/**
	 * Retrieves the position of the head of the selection (could be the start or end of the selection based on previous operations)
	 * @returns {object} - { line, character }
	 */
	get_position() {
		if (this.isActiveSideEnd) {
			return {
				character: this.end.character,
				line: this.end.line
			};
		} else {
			return {
				character: this.start.character,
				line: this.start.line
			};
		}
	}

	/**
	 * Gets the plain text value in the current selection range.
	 * @returns {string}
	 */
	get_text() {
		const positionCompare = this.compare_position(this.start.line, this.start.character, this.end.line, this.end.character);
		const firstLine = positionCompare === 1 ? this.end.line : this.start.line;
		const lastLine = positionCompare === 1 ? this.start.line : this.end.line;
		const firstCharacter = positionCompare === 1 ? this.end.character : this.start.character;
		const lastCharacter = positionCompare === 1 ? this.start.character : this.end.character;
		let textLines = [];
		for (let i = firstLine; i <= lastLine; i++) {
			if (i === firstLine && i === lastLine) {
				textLines.push(this.editor.document.get_line_text(i).slice(firstCharacter, lastCharacter));
			} else if (i === firstLine) {
				textLines.push(this.editor.document.get_line_text(i).slice(firstCharacter));
			} else if (i === lastLine) {
				textLines.push(this.editor.document.get_line_text(i).slice(0, lastCharacter));
			} else {
				textLines.push(this.editor.document.get_line_text(i));
			}
		}
		return textLines.join('\n');
	}
	
	/**
	 * Sets the visibility of the selection in the editor.
	 * @param {boolean} isVisible 
	 */
	set_visible(isVisible) {
		if (this.isVisible != isVisible) {
			this.isVisible = isVisible;
		}
	}

	/**
	 * Sets the visibility of the selection cursor in the editor.
	 * @param {boolean} isVisible 
	 */
	set_cursor_visible(isVisible) {
		if (this.isCursorVisible != isVisible) {
			this.isCursorVisible = isVisible;
			if (this.isCursorVisible) {
				this.isBlinkVisible = true;
				this.start_blinking();
			} else {
				this.stop_blinking();
			}
		}
	}
	
	/**
	 * Starts the selection cursor blinking.
	 */
	start_blinking() {
		clearInterval(this.blinkIntervalHandle);
		this.blinkIntervalHandle = setInterval(this.blink.bind(this), this.blinkInterval);
	}
	
	/**
	 * Stops the selection cursor blinking.
	 */
	stop_blinking() {
		clearInterval(this.blinkIntervalHandle);
	}
	
	/**
	 * Toggles the visibility of the selection cursor.
	 */
	blink() {
		this.isBlinkVisible = !this.isBlinkVisible;
		const firstLine = Math.min(this.start.line, this.end.line);
		const lastLine = Math.max(this.start.line, this.end.line);
		/*
		this.editor.render({
			lineStart: firstLine,
			lineEnd: lastLine
		});
		*/
		// this.Base_layers.render();
	}
	
	/**
	 * Moves the cursor to a previous line.
	 * @param {number} length - The number of lines to move 
	 * @param {boolean} keepSelection - Whether to move to an empty selection or extend the current selection
	 */
	move_line_previous(length, keepSelection) {
		length = length == null ? 1 : length;
		const position = this.get_position();
		this.set_position(position.line - length, null, keepSelection);
	}
	
	/**
	 * Moves the cursor to a next line.
	 * @param {number} length - The number of lines to move 
	 * @param {boolean} keepSelection - Whether to move to an empty selection or extend the current selection
	 */
	move_line_next(length, keepSelection) {
		length = length == null ? 1 : length;
		const position = this.get_position();
		this.set_position(position.line + length, null, keepSelection);
	}
		
	/**
	 * Moves to the start of the current line.
	 * @param {boolean} keepSelection - Whether to move to an empty selection or extend the current selection 
	 */
	move_line_start(keepSelection) {
		const position = this.get_position();
		this.set_position(position.line, 0, keepSelection);
	}

	/**
	 * Moves to the end of the current line.
	 * @param {boolean} keepSelection - Whether to move to an empty selection or extend the current selection 
	 */
	move_line_end(keepSelection) {
		const position = this.get_position();
		this.set_position(position.line, this.editor.document.get_line_character_count(position.line), keepSelection);
	}
	
	/**
	 * Moves the cursor to a character behind in the document, handles line wrapping.
	 * @param {number} length - The number of characters to move 
	 * @param {boolean} keepSelection - Whether to move to an empty selection or extend the current selection 
	 */
	move_character_previous(length, keepSelection) {
		length = length == null ? 1 : length;
		const position = this.get_position();
		if (position.character - length < 0) {
			if (position.line > 0) {
				this.set_position(position.line - 1, this.editor.document.get_line_character_count(position.line - 1), keepSelection);
			}
		} else {
			this.set_position(position.line, position.character - length, keepSelection);
		}
	}
	
	/**
	 * Moves the cursor to a character ahead in the document, handles line wrapping.
	 * @param {number} length - The number of characters to move 
	 * @param {boolean} keepSelection - Whether to move to an empty selection or extend the current selection 
	 */
	move_character_next(length, keepSelection) {
		length = length == null ? 1 : length;
		const position = this.get_position();
		const characterCount = this.editor.document.get_line_character_count(position.line);
		if (position.character + length > characterCount) {
			if (position.line + 1 < this.editor.document.lines.length) {
				this.set_position(position.line + 1, 0, keepSelection);
			}
		} else {
			this.set_position(position.line, position.character + length, keepSelection);
		}
	}

	/**
	 * Moves the cursor to the beginning of the current word or previous word, handles line wrapping.
	 * @param {boolean} keepSelection - Whether to move to an empty selection or extend the current selection 
	 */
	move_word_previous(keepSelection) {
		const position = this.get_position();
		const newPosition = this.editor.document.get_word_start_position(position.line, position.character);
		this.set_position(newPosition.line, newPosition.character, keepSelection);
	}

	/**
	 * Moves the cursor to the end of the current word or next word, handles line wrapping.
	 * @param {boolean} keepSelection - Whether to move to an empty selection or extend the current selection 
	 */
	move_word_next(keepSelection) {
		const position = this.get_position();
		const newPosition = this.editor.document.get_word_end_position(position.line, position.character);
		this.set_position(newPosition.line, newPosition.character, keepSelection);
	}
}


/**
 * This class handles rendering a text layer and editing it based on keyboard/mouse/touch controls
 */
class Text_editor_class {
	constructor(options) {
		options = options || {};

		this.editingCtx = document.getElementById('canvas_minipaint').getContext("2d");
		this.hasValueChanged = false;

		// Text boundary and offsets are precomputed before drawn
		this.lineRenderInfo = null;
		this.lastCalculatedZoom = 0;
		this.lastCalculatedLayerWidth = 0;
		this.lastCalculatedLayerHeight = 0;
		this.textBoundaryWidth = 0;
		this.textBoundaryHeight = 0;

		// Styling options during render
		this.selectionBackgroundColor = options.selectionBackgroundColor || '#1C79C4';
		this.selectionTextColor = options.selectionTextColor || '#FFFFFF';

		// Offset from top/left of layer for cursor visibility
		this.drawOffsetTop = options.paddingVertical != null ? options.paddingVertical : 6;
		this.drawOffsetLeft = options.paddingHorizontal != null ? options.paddingHorizontal : 10;

		// Tracking internal state for keyboard/mouse/touch control
		this.shiftPressed = false;
		this.ctrlPressed = false;
		this.isMouseSelectionActive = false;
		this.mouseSelectionStartX = 0;
		this.mouseSelectionStartY = 0;
		this.mouseSelectionStartLine = null;
		this.mouseSelectionStartCharacter = null;
		this.mouseSelectionMoveX = null;
		this.mouseSelectionMoveY = null;
		this.mouseSelectionEdgeScrollInterval = null;
		this.focused = false;
		
		// Text document for this editor
		this.document = new Text_document_class();
		this.document.lines = [[{ text: '', meta: {} }]];
		this.wrappedLines = [[]];

		// Text selection for this editor
		this.selection = new Text_selection_class(this);

		// The layer associated with this editor (so data can be updated)
		this.layer = null;
		this.document.on_change = () => {
			this.layer.data = this.document.lines;
		};
	}

	/**
	 * Sets the lines of the document (from layer data)
	 * @param {array} lines 
	 */
	set_lines(lines) {
		this.document.lines = lines || [[{ text: '', meta: {} }]];
	}

	/**
	 * Returns the text string at a given line wrap (ignores formatting).
	 * @param {object} wrap - The wrap definition 
	 */
	get_wrap_text(wrap) {
		let wrapText = '';
		for (let i = 0; i < wrap.spans.length; i++) {
			wrapText += wrap.spans[i].text;
		}
		return wrapText;
	}

	/**
	 * Calculates font metrics for the given span and returns it. Caches by default.
	 * @param {object} span - The span to calculate metrics for
	 * @param {boolean} noCache - Skip caching if the metrics is expected to change in the future (e.g. font family not loaded yet.) 
	 */
	get_span_font_metrics(span, noCache) {
		const fontSize = (span.meta.size || metaDefaults.size);
		const fontName = (span.meta.family || metaDefaults.family);
		let fontMetrics = fontMetricsMap.get(fontName + '_' + fontSize);
		if (!fontMetrics) {
			fontMetrics = new Font_metrics_class(fontName, fontSize);
			if (!noCache) {
				fontMetricsMap.set(fontName + '_' + fontSize, fontMetrics);
			}
		}
		return fontMetrics;
	}

	/**
	 * Returns the complete text of the document.
	 */
	get_complete_text() {
		let completeText = '';
		for (let line of this.document.lines) {
				for (let span of line) {
						completeText += span.text;
				}
				if (this.document.lines.indexOf(line) !== this.document.lines.length - 1) {
						completeText += '\n';
				}
		}
		return completeText;
	}

	replace_entire_IME_text(beforeTempText, newText) {
		const cursorPosition = this.selection.get_position();
		let allText = beforeTempText;
		let lines = allText.split('\n');
		let currentLineText = lines[cursorPosition.line];
		let beforeText = currentLineText.substring(0, cursorPosition.character);
		let afterText = currentLineText.substring(cursorPosition.character);
		let updatedLineText = beforeText + newText + afterText;
		lines[cursorPosition.line] = updatedLineText;

		const newLines = lines.map(lineText => {
				return [{ text: lineText, meta: {} }];
		});
		this.set_lines(newLines);
		this.hasValueChanged = true;
	}

	set_IME_position(newText) {
		const cursorPosition = this.selection.get_position();
		let newTextLines = newText.split('\n');
		let newCursorLine = cursorPosition.line + newTextLines.length - 1;
		let newCursorCharacter = newText.length;
		this.selection.set_position(newCursorLine, newCursorCharacter + cursorPosition.character);
		this.hasValueChanged = true;
	}



	insert_text_at_current_position(text) {
		if (!this.selection.is_empty()) {
			this.delete_character_at_current_position();
		}
		const position = this.selection.get_position();
		const newPosition = this.document.insert_text(text, position.line, position.character);
		this.selection.set_position(newPosition.line, newPosition.character);
		this.hasValueChanged = true;
	}
	
	delete_character_at_current_position(forward) {
		let newPosition;
		if (this.selection.is_empty()) {
			const position = this.selection.get_position();
			newPosition = this.document.delete_character(forward, position.line, position.character);
		} else {
			newPosition = this.document.delete_range(
				this.selection.start.line,
				this.selection.start.character,
				this.selection.end.line,
				this.selection.end.character
			);
		}
		this.selection.set_position(newPosition.line, newPosition.character);
		this.hasValueChanged = true;
	}

	delete_selection() {
		let newPosition = this.document.delete_range(
			this.selection.start.line,
			this.selection.start.character,
			this.selection.end.line,
			this.selection.end.character
		);
		this.selection.set_position(newPosition.line, newPosition.character);
		this.hasValueChanged = true;
	}

	trigger_cursor_start(layer, layerX, layerY) {
		this.isMouseSelectionActive = true;
		this.mouseSelectionStartX = layerX;
		this.mouseSelectionStartY = layerY;
		const cursorStart = this.get_cursor_position_from_absolute_position(layer, layerX, layerY);
		this.mouseSelectionStartLine = cursorStart.line;
		this.mouseSelectionStartCharacter = cursorStart.character;
		this.selection.set_position(cursorStart.line, cursorStart.character, false);
	}
	
	trigger_cursor_move(layer, layerX, layerY) {
		const isInsideCanvas = true; // layerX > 0 && layerY > 0 && layerX < this.lastCalculatedLayerWidth && layerY < this.lastCalculatedLayerHeight;
		if (this.isMouseSelectionActive && isInsideCanvas) {
			this.mouseSelectionMoveX = layerX;
			this.mouseSelectionMoveY = layerY;
			const cursorEnd = this.get_cursor_position_from_absolute_position(layer, layerX, layerY);
			this.selection.set_position(this.mouseSelectionStartLine, this.mouseSelectionStartCharacter, false);
			this.selection.set_position(cursorEnd.line, cursorEnd.character, true);
		}
	}
	
	trigger_cursor_end() {
		this.isMouseSelectionActive = false;
		this.mouseSelectionMoveX = null;
		this.mouseSelectionMoveY = null;
	}
	
	get_cursor_position_from_absolute_position(layer, x, y) {
		let line = -1;
		let character = -1;

		if (this.lineRenderInfo) {
			const textDirection = layer.params.text_direction;
			const wrapDirection = layer.params.wrap_direction;
			const isHorizontalTextDirection = ['ltr', 'rtl'].includes(textDirection);
			const isNegativeTextDirection = ['rtl', 'btt'].includes(textDirection);

			let characterPosition = isHorizontalTextDirection ? x : y;
			let wrapPosition = isHorizontalTextDirection ? y : x;
			
			const wrapSizes = this.lineRenderInfo.wrapSizes;
			let wrapRelativeIndex = -1;
		
			let globalWrapIndex = 0;
			for (let [lineIndex, lineInfo] of this.lineRenderInfo.lines.entries()) {
				wrapRelativeIndex = 0;
				for (let wrap of lineInfo.wraps) {
					if (wrapPosition < wrapSizes[globalWrapIndex].offset + wrapSizes[globalWrapIndex].size) {
						line = lineIndex;
						break;
					}
					globalWrapIndex++;
					wrapRelativeIndex++;
				}
				if (line > -1) {
					break;
				}
			}
			if (line === -1) {
				line = this.lineRenderInfo.lines.length - 1;
				wrapRelativeIndex = -1;
			}
			const wraps = this.lineRenderInfo.lines[line].wraps;
			if (wrapRelativeIndex === -1) {
				wrapRelativeIndex = wraps.length - 1;
			}
			let previousWrapCharacterCount = 0;
			for (let w = 0; w < wrapRelativeIndex; w++) {
				previousWrapCharacterCount += this.get_wrap_text(wraps[w]).length;
			}
			const characterCount = this.get_wrap_text(wraps[wrapRelativeIndex]).length;
			const characterOffsets = wraps[wrapRelativeIndex].characterOffsets;
			for (let characterNumber = 0; characterNumber < characterCount; characterNumber++) {
				const leftPosition = characterOffsets[characterNumber];
				const rightPosition = characterOffsets[characterNumber + 1];
				if (characterPosition <= leftPosition + ((rightPosition - leftPosition) * 0.5)) {
					character = previousWrapCharacterCount + characterNumber;
					break;
				}
				if (characterNumber === characterCount - 1 && character === -1) {
					character = previousWrapCharacterCount + characterCount;
				}
			}
			if (character === -1) {
				character = this.document.get_line_character_count(line);
			}
		}
		return { line, character };
	}

	calculate_text_placement(ctx, layer) {
		const boundary = layer.params.boundary;
		const textDirection = layer.params.text_direction;
		const wrapDirection = layer.params.wrap_direction;
		const halign = layer.params.halign;
		const valign = layer.params.valign;
		const isHorizontalTextDirection = ['ltr', 'rtl'].includes(textDirection);
		const isNegativeTextDirection = ['rtl', 'btt'].includes(textDirection);

		let totalTextDirectionSize = 0;
		let totalWrapDirectionSize = 0;
		let textDirectionMaxSize = isHorizontalTextDirection ? layer.width : layer.height;

		// Determine new lines based on text wrapping, if applicable
		let lineRenderInfo = {
			wrapSizes: [],
			lines: []
		};
		for (let line of this.document.lines) {
			let wrapAccumulativeSize = 0;
			let wrapCharacterOffsets = [0];
			let lineWraps = [];
			let currentWrapSpans = [...line];
			let s = 0;
			let fontMetrics = null;
			let character = null;
			let nextCharacter = null;
			let fontKerning = 0;
			for (s = 0; s < currentWrapSpans.length; s++) {
				const span = currentWrapSpans[s];
				const kerning = span.meta.kerning || metaDefaults.kerning;
				const family = span.meta.family || metaDefaults.family;
				const size = span.meta.size || metaDefaults.size;
				fontMetrics = this.get_span_font_metrics(span, !fontLoadMap.get(family));
				if (isHorizontalTextDirection) {
					ctx.font =
						' ' + (span.meta.italic ? 'italic' : '') +
						' ' + (span.meta.bold ? 'bold' : '') +
						' ' + size + 'px' +
						' ' + family;
				}
				for (let c = 0; c < span.text.length; c++) {
					character = span.text[c];
					if (layer.params.kerning === 'metrics') {
						nextCharacter = span.text[c + 1];
						if (!nextCharacter && c === span.text.length - 1 && currentWrapSpans[s + 1]) {
							const nextSpan = currentWrapSpans[s + 1];
							if (family === (nextSpan.meta.family || metaDefaults.family) && size === (nextSpan.meta.size || metaDefaults.size)) {
								nextCharacter = nextSpan.text[0];
							}
						}
						fontKerning = isHorizontalTextDirection && nextCharacter ? fontMetrics.get_kerning_offset(character + nextCharacter) : 0;
					}
					const characterSize = isHorizontalTextDirection ? ctx.measureText(character).width : fontMetrics.height;
					wrapAccumulativeSize += characterSize + fontKerning + kerning;
					if (boundary !== 'dynamic' && wrapAccumulativeSize > textDirectionMaxSize && ![' ', '-'].includes(character)) {
						// Find last span with space
						let dividerPosition = -1;
						let bs = s;
						for (; bs >= 0; bs--) {
							const backwardsSpan = currentWrapSpans[bs];
							const backwardsSpanText = (bs === s) ? backwardsSpan.text.substring(0, c) : backwardsSpan.text;
							dividerPosition = backwardsSpanText.lastIndexOf(' ');
							const dashPosition = backwardsSpanText.lastIndexOf('-');
							if (dashPosition > dividerPosition) {
								dividerPosition = dashPosition;
							}
							if (dividerPosition > -1) {
								break;
							}
						}
						let beforeSpans = [];
						let afterSpans = [];
						// Found a previous span on the current line wrap that contains a space, split the line
						if (dividerPosition > -1) {
							beforeSpans = currentWrapSpans.slice(0, bs);
							afterSpans = currentWrapSpans.slice(bs + 1);
							const beforeText = currentWrapSpans[bs].text.substring(0, dividerPosition + 1);
							const afterText = currentWrapSpans[bs].text.substring(dividerPosition + 1);
							if (beforeText.length > 0) {
								beforeSpans.push({
									text: beforeText,
									meta: currentWrapSpans[bs].meta
								});
							}
							if (afterText.length > 0) {
								afterSpans.unshift({
									text: afterText,
									meta: currentWrapSpans[bs].meta
								});
							}
						}
						// For word split only, break out.
						else if (layer.params.wrap === 'word') {
							wrapCharacterOffsets.push(wrapAccumulativeSize);
							break;
						}
						// Otherwise, split the word
						else {
							if (s === 0 && c === 0) {
								c++;
								wrapCharacterOffsets.push(wrapAccumulativeSize);
							}
							beforeSpans = currentWrapSpans.slice(0, s);
							afterSpans = currentWrapSpans.slice(s + 1);
							const beforeText = currentWrapSpans[s].text.substring(0, c);
							const afterText = currentWrapSpans[s].text.substring(c);
							if (beforeText.length > 0) {
								beforeSpans.push({
									text: beforeText,
									meta: currentWrapSpans[s].meta
								});
							}
							if (afterText.length > 0) {
								afterSpans.unshift({
									text: afterText,
									meta: currentWrapSpans[s].meta
								});
							}
						}
						let largestOffset = wrapCharacterOffsets[wrapCharacterOffsets.length-1];
						if (largestOffset > totalTextDirectionSize) {
							totalTextDirectionSize = largestOffset;
						}
						const newWrap = {
							characterOffsets: wrapCharacterOffsets,
							spans: beforeSpans
						};
						newWrap.characterOffsets = newWrap.characterOffsets.slice(0, this.get_wrap_text(newWrap).length + 1);
						lineWraps.push(newWrap);
						currentWrapSpans = afterSpans;
						wrapAccumulativeSize = 0;
						wrapCharacterOffsets = [0];
						s = -1;
						break;
					} else {
						wrapCharacterOffsets.push(wrapAccumulativeSize);
					}
				}
				if (s === -1) {
					continue;
				}
			}
			if (currentWrapSpans.length > 0) {
				let largestOffset = wrapCharacterOffsets[wrapCharacterOffsets.length-1];
				if (largestOffset > totalTextDirectionSize) {
					totalTextDirectionSize = largestOffset;
				}
				lineWraps.push({
					characterOffsets: wrapCharacterOffsets,
					spans: currentWrapSpans
				});
			}
			lineRenderInfo.lines.push({
				firstWrapIndex: 0,
				wraps: lineWraps
			});
		}

		// Adjust offsets for alignment along the text direction
		if ((isHorizontalTextDirection && halign !== 'left') || (!isHorizontalTextDirection && valign !== 'top')) {
			const maxTextDirectionSize = boundary === 'dynamic' ? totalTextDirectionSize : (isHorizontalTextDirection ? layer.width : layer.height);
			for (let line of lineRenderInfo.lines) {
				for (let wrap of line.wraps) {
					const isCentered = (isHorizontalTextDirection && halign == 'center') || (!isHorizontalTextDirection && valign === 'middle');
					const lastSpan = wrap.spans[wrap.spans.length - 1];
					const wrapSize = wrap.characterOffsets[wrap.characterOffsets.length - 1 - (lastSpan.text[lastSpan.text.length - 1] === ' ' ? 1 : 0)];
					const startOffset = (isCentered ? maxTextDirectionSize / 2 : maxTextDirectionSize) - (isCentered ? wrapSize / 2 : wrapSize);
					if (startOffset > 0) {
						for (let oi = 0; oi < wrap.characterOffsets.length; oi++) {
							wrap.characterOffsets[oi] += startOffset;
						}
					}
				}
			}
		}

		// Determine the size of each line (e.g. line height if horizontal typing direction)
		let wrapSizeAccumulator = 0;
		let wrapCounter = 0;
		for (let line of lineRenderInfo.lines) {
			line.firstWrapIndex = wrapCounter;
			for (let wrap of line.wraps) {
				let ascenderSize = 0;
				let descenderSize = 0;
				for (let span of wrap.spans) {
					let fontMetrics;
					const family = span.meta.family || metaDefaults.family;
					const leading = span.meta.leading != null ? span.meta.leading : metaDefaults.leading;
					if (isHorizontalTextDirection) {
						fontMetrics = this.get_span_font_metrics(span, !fontLoadMap.get(family));
					} else {
						ctx.font =
							' ' + (span.meta.italic ? 'italic' : '') +
							' ' + (span.meta.bold ? 'bold' : '') +
							' ' + (span.meta.size || metaDefaults.size) + 'px' +
							' ' + family;
					}
					let spanAscenderSize = isHorizontalTextDirection ? fontMetrics.baseline : ctx.measureText(character).width;
					let spanDescenderSize = isHorizontalTextDirection ? Math.abs(fontMetrics.baseline - fontMetrics.height) : ctx.measureText(character).width;
					if (leading) {
						spanAscenderSize += leading;
						if (spanAscenderSize < 0) {
							spanDescenderSize += spanAscenderSize;
							spanAscenderSize = 0;
							if (spanDescenderSize < 0) {
								spanDescenderSize = 0;
							}
						}
					}
					if (spanAscenderSize > ascenderSize) {
						ascenderSize = spanAscenderSize;
					}
					if (spanDescenderSize > descenderSize) {
						descenderSize = spanDescenderSize;
					}
				}
				let lineSize = ascenderSize + descenderSize;
				lineRenderInfo.wrapSizes.push({ size: lineSize, offset: wrapSizeAccumulator, baseline: ascenderSize });
				wrapSizeAccumulator += lineSize;
				wrapCounter++;
			}
		}
		totalWrapDirectionSize = wrapSizeAccumulator;

		this.lastCalculatedLayerWidth = layer.width;
		this.lastCalculatedLayerHeight = layer.height;
		this.textBoundaryWidth = Math.max(1, Math.round(isHorizontalTextDirection ? totalTextDirectionSize : totalWrapDirectionSize));
		this.textBoundaryHeight = Math.max(1, Math.round(isHorizontalTextDirection ? totalWrapDirectionSize : totalTextDirectionSize));
		this.lineRenderInfo = lineRenderInfo;
		
	}

	render(ctx, layer) {
		if (config.need_render_changed_params || this.hasValueChanged || layer.width != this.lastCalculatedLayerWidth || layer.height != this.lastCalculatedLayerHeight || !this.textBoundaryWidth || !this.textBoundaryHeight) {
			this.calculate_text_placement(ctx, layer);
		}

		if (!this.lineRenderInfo) return;

		try {

			let options = options || {};
			let isSelectionEmpty = this.selection.is_empty();

			ctx.textAlign = 'left';
			ctx.textBaseline = 'alphabetic';

			const boundary = layer.params.boundary;
			let drawOffsetTop = layer.y + 1;
			let drawOffsetLeft = layer.x + 1;
			const textDirection = layer.params.text_direction;
			const wrapDirection = layer.params.wrap_direction;
			const isHorizontalTextDirection = ['ltr', 'rtl'].includes(textDirection);
			const isNegativeTextDirection = ['rtl', 'btt'].includes(textDirection);

			const wrapSizes = this.lineRenderInfo.wrapSizes;
			let lineIndex = 0;
			let wrapIndex = 0;
			const cursorLine = this.selection.isActiveSideEnd ? this.selection.end.line : this.selection.start.line;
			const cursorCharacter = this.selection.isActiveSideEnd ? this.selection.end.character : this.selection.start.character;
			if(layer.rotate){
				const alpha = (layer.rotate * Math.PI) / 180;
				ctx.save();
				// Move the canvas to the center before rotating
				ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
				ctx.rotate(alpha);
				// Move it back after it
				ctx.translate(-layer.x - layer.width / 2, -layer.y - layer.height / 2);

			}
			for (let line of this.lineRenderInfo.lines) {
				let lineLetterCount = 0;
				for (let [localWrapIndex, wrap] of line.wraps.entries()) {
					let cursorStartX = null;
					let cursorStartY = null;
					let cursorSize = null;
					let characterIndex = 0;
					const characterOffsets = wrap.characterOffsets;
					for (let [spanIndex, span] of wrap.spans.entries()) {
						const kerning = span.meta.kerning != null ? span.meta.kerning : metaDefaults.kerning;
						const bold = span.meta.bold != null ? span.meta.bold : metaDefaults.bold;
						const italic = span.meta.italic != null ? span.meta.italic : metaDefaults.italic;
						const underline = span.meta.underline != null ? span.meta.underline : metaDefaults.underline;
						const strikethrough = span.meta.strikethrough != null ? span.meta.strikethrough : metaDefaults.strikethrough;
						const family = span.meta.family || metaDefaults.family;

						if (fontLoadMap.get(family) !== true) {
							const variants = config.user_fonts[family] ? config.user_fonts[family].variants : undefined;
							load_font_family({ family, variants }, () => {
								this.hasValueChanged = true;
								this.Base_layers.render();
							});
						}

						let fontMetrics;
						if (underline || strikethrough) {
							fontMetrics = this.get_span_font_metrics(span, !fontLoadMap.get(family));
						}

						// Set styles for drawing
						ctx.font =
							' ' + (italic ? 'italic' : '') +
							' ' + (bold ? 'bold' : '') +
							' ' + Math.round(span.meta.size || metaDefaults.size) + 'px' +
							' ' + family;
						const fill_color = span.meta.fill_color || metaDefaults.fill_color;
						let fillStyle;
						if (fill_color.startsWith('#')) {
							fillStyle = fill_color;
						}
						const stroke_size = ((span.meta.stroke_size != null) ? span.meta.stroke_size : metaDefaults.stroke_size);
						let strokeStyle;
						if (stroke_size) {
							const stroke_color = span.meta.stroke_color || metaDefaults.stroke_color;
							if (stroke_color.startsWith('#')) {
								strokeStyle = stroke_color;
							}
							ctx.lineWidth = stroke_size;
						} else {
							ctx.lineWidth = 0;
						}

						
						
						// Loop through each letter in each span and draw it
						for (let c = 0; c < span.text.length; c++) {
							const letter = span.text.charAt(c);
							const lineStart = Math.round(drawOffsetTop + wrapSizes[wrapIndex].offset);
							const letterWidth = characterOffsets[characterIndex + 1] - characterOffsets[characterIndex];
							const letterHeight = Math.round(wrapSizes[wrapIndex].size);
							const textDirectionOffset = drawOffsetLeft + characterOffsets[characterIndex];
							const wrapDirectionOffset = Math.round(drawOffsetTop + wrapSizes[wrapIndex].offset + wrapSizes[wrapIndex].baseline);
							const letterDrawX = isHorizontalTextDirection ? textDirectionOffset + kerning : wrapDirectionOffset;
							const letterDrawY = isHorizontalTextDirection ? wrapDirectionOffset : textDirectionOffset + kerning;
							let isLetterSelected = false;
							if (this.selection.isVisible) {
								if (!isSelectionEmpty) {
									isLetterSelected = (
										(
											this.selection.start.line === lineIndex &&
											this.selection.start.character <= lineLetterCount &&
											(this.selection.end.line > lineIndex || this.selection.end.character > lineLetterCount)
										) ||
										(
											this.selection.end.line === lineIndex &&
											this.selection.end.character > lineLetterCount &&
											(this.selection.start.line < lineIndex || this.selection.start.character <= lineLetterCount)
										) ||
										(
											this.selection.start.line < lineIndex &&
											this.selection.end.line > lineIndex
										)
									);
								}
								if (cursorLine === lineIndex) {
									if (cursorCharacter === lineLetterCount) {
										cursorStartX = (isHorizontalTextDirection ? textDirectionOffset : lineStart) - 0.5;
										cursorStartY = (isHorizontalTextDirection ? lineStart : textDirectionOffset) - 0.5;
										cursorSize = isHorizontalTextDirection ? letterHeight : letterWidth;
									}
									else if (cursorCharacter === lineLetterCount + 1 && localWrapIndex === line.wraps.length - 1 && spanIndex === wrap.spans.length - 1 && c === span.text.length - 1) {
										cursorStartX = (isHorizontalTextDirection ? textDirectionOffset + letterWidth : lineStart) - 0.5;
										cursorStartY = (isHorizontalTextDirection ? lineStart : textDirectionOffset + letterHeight) - 0.5;
										cursorSize = isHorizontalTextDirection ? letterHeight : letterWidth;
									}
								}
							}
							if (isLetterSelected && this.editingCtx === ctx) {
								const letterStartX = isHorizontalTextDirection ? textDirectionOffset : lineStart;
								const letterStartY = isHorizontalTextDirection ? lineStart : textDirectionOffset;
								const letterSizeX = isHorizontalTextDirection ? letterWidth : letterHeight;
								const letterSizeY = isHorizontalTextDirection ? letterHeight : letterWidth;
								ctx.fillStyle = this.selectionBackgroundColor + '22';
								ctx.fillRect(letterStartX, letterStartY, letterSizeX, letterSizeY);
								ctx.strokeStyle = this.selectionBackgroundColor;
								ctx.lineWidth = 0.75;
								ctx.strokeRect(letterStartX, letterStartY, letterSizeX, letterSizeY);
								ctx.lineWidth = stroke_size;
							}
							ctx.fillStyle = fillStyle;
							ctx.strokeStyle = strokeStyle;
							ctx.fillText(letter, letterDrawX, letterDrawY);
							if (stroke_size) {
								ctx.lineWidth = stroke_size;
								ctx.strokeText(letter, letterDrawX, letterDrawY);
							}
							if (strikethrough) {
								ctx.fillStyle = fillStyle;
								ctx.lineWidth = Math.max(1, fontMetrics.height / 20);
								ctx.fillRect(letterDrawX - 0.25 - kerning, letterDrawY - (fontMetrics.height * .28), letterWidth + 0.5, ctx.lineWidth);
							}
							if (underline) {
								ctx.fillStyle = fillStyle;
								ctx.lineWidth = Math.max(1, fontMetrics.height / 20);
								ctx.fillRect(letterDrawX - 0.25 - kerning, letterDrawY + (ctx.lineWidth), letterWidth + 0.5, ctx.lineWidth);
							}
							characterIndex++;
							lineLetterCount++;
						}

						

						if (span.text.length === 0) {
							if (cursorLine === lineIndex && cursorCharacter === lineLetterCount) {
								const lineStart = Math.round(drawOffsetTop + wrapSizes[wrapIndex].offset);
								const textDirectionOffset = drawOffsetLeft + characterOffsets[0] + (lineIndex === 0 ? (boundary === 'dynamic' ? 5 : 2) : 0);
								const letterWidth = 3;
								const letterHeight = Math.round(wrapSizes[wrapIndex].size);
								cursorStartX = (isHorizontalTextDirection ? textDirectionOffset : lineStart) - 0.5;
								cursorStartY = (isHorizontalTextDirection ? lineStart : textDirectionOffset) - 0.5;
								cursorSize = isHorizontalTextDirection ? letterHeight : letterWidth;
							}
						}
					}

					// Draw cursor
					if (this.selection.isCursorVisible /*&& this.selection.isBlinkVisible*/ && cursorStartX && this.editingCtx == ctx) {
						ctx.lineCap = 'butt';
						ctx.strokeStyle = '#55555577';
						ctx.lineWidth = 3;
						ctx.beginPath();
						ctx.moveTo(cursorStartX, cursorStartY + 1);
						ctx.lineTo(cursorStartX, cursorStartY + cursorSize - 1);
						if (cursorSize > 14) {
							ctx.moveTo(cursorStartX - 3, cursorStartY + 2);
							ctx.lineTo(cursorStartX + 3, cursorStartY + 2);
							ctx.moveTo(cursorStartX - 3, cursorStartY + cursorSize - 2);
							ctx.lineTo(cursorStartX + 3, cursorStartY + cursorSize - 2);
						}
						ctx.stroke();
						ctx.strokeStyle = '#ffffffff';
						ctx.lineWidth = 1;
						ctx.beginPath();
						ctx.moveTo(cursorStartX, cursorStartY + 2);
						ctx.lineTo(cursorStartX, cursorStartY + cursorSize - 2);
						if (cursorSize > 14) {
							ctx.moveTo(cursorStartX - 2, cursorStartY + 2);
							ctx.lineTo(cursorStartX + 2, cursorStartY + 2);
							ctx.moveTo(cursorStartX - 2, cursorStartY + cursorSize - 2);
							ctx.lineTo(cursorStartX + 2, cursorStartY + cursorSize - 2);
						}
						ctx.stroke();
					}
					wrapIndex++;
				}
				lineIndex++;
			}
			if(layer.rotate){
				ctx.restore();
			}
		} catch (error) {
			console.warn(error);
		}

		this.hasValueChanged = false;
	}
}

class Google_fonts_search_class {
	constructor() {
		this.POP = new Dialog_class();
		this.GUI_tools = new GUI_tools_class();
		this.popup = null;
		this.fontsPerPage = 8;
		this.dialogContentNode = null;
		this.fontListNode = null;
		this.fontList = [];
		this.fontListFiltered = [];
		this.selectedFonts = {};
		this.searchTimeoutHandle = null;
	}

	render_font_list(page) {
		page = page || 1;
		const pageCount = Math.ceil(this.fontListFiltered.length / 8);
		const startIndex = (page - 1) * this.fontsPerPage;
		let html = '<div class="selection_card_list">';
		for (let i = startIndex; i < startIndex + this.fontsPerPage; i++) {
			const font = this.fontListFiltered[i];
			if (!font) break;
			const isSelected = !!this.selectedFonts[font.family];
			load_font_family({ family: font.family, variants: font.variants });
			html += `
				<div class="selection_card">
					<input type="checkbox" id="google_font_selection_${font.family}" value="${font.family}" ${isSelected ? 'checked="checked"' : ''}>
					<label for="google_font_selection_${font.family}"">
						<div class="font_preview" style="font-family: '${font.family}'">
							The quick brown fox jumps over the lazy dog.
						</div>
						<div class="text_muted">
							${font.family}
						</div>
					</label>
				</div>
			`;
		}
		html += `
				</div>
				<div class="pagination">
					${page > 1 ? '<button title="Previous Page" data-page="' + (page - 1) + '">&laquo;</button>' : ''}
					${page - 2 > 0 ? '<button title="Page ' + (page - 2) + '" data-page="' + (page - 2) + '">' + (page - 2) + '</button>' : ''}
					${page - 1 > 0 ? '<button title="Page ' + (page - 1) + '" data-page="' + (page - 1) + '">' + (page - 1) + '</button>' : ''}
					<button title="Page ${page}" aria-pressed="true" data-page="${page}">${page}</button>
					${page + 1 <= pageCount ? '<button title="Page ' + (page + 1) + '" data-page="' + (page + 1) + '">' + (page + 1) + '</button>' : ''}
					${page + 2 <= pageCount ? '<button title="Page ' + (page + 2) + '" data-page="' + (page + 2) + '">' + (page + 2) + '</button>' : ''}
					${page < pageCount ? '<button title="Next Page" data-page="' + (page + 1) + '">&raquo;</button>' : ''}
				</div>
			</div>
		`;
		this.fontListNode.innerHTML = html;

		// Attempt to remove vertical scroll by decreasing page size.
		if (this.fontsPerPage > 3 && this.dialogContentNode.scrollHeight > this.dialogContentNode.clientHeight) {
			this.fontsPerPage--;
			this.render_font_list(page);
			return;
		}

		// Handle checkbox
		this.fontListNode.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
			checkbox.addEventListener('change', (e) => {
				if (checkbox.checked) {
					this.selectedFonts[checkbox.value] = this.fontListFiltered
						.slice(startIndex, startIndex + this.fontsPerPage)
						.filter((font) => { return font.family === checkbox.value; })[0];
				} else {
					delete this.selectedFonts[checkbox.value];
				}
			});
		});

		// Handle pagination
		this.fontListNode.querySelector('.pagination').addEventListener('click', (e) => {
			const page = parseInt(e.target.getAttribute('data-page'), 10);
			this.render_font_list(page);
		});
	}

	show() {
		this.POP.show({
			title: 'Search for Font',
			params: [
				{ name: "query", title: "Search:", value: '', prevent_submission: true }
			],
			on_load: (params, popup) => {
				this.popup = popup;
				var node = document.createElement("div");
				this.dialogContentNode = popup.el.querySelector('.dialog_content');
				this.dialogContentNode.appendChild(node);
				this.fontListNode = node;				

				const queryInput = popup.el.querySelector('#pop_data_query');
				queryInput.addEventListener('input', (e) => {
					const query = (e.target.value || '').toLowerCase();
					if (!query) {
						this.fontListFiltered = this.fontList;
						this.render_font_list();
					} else {
					clearTimeout(this.searchTimeoutHandle);
						this.searchTimeoutHandle = setTimeout(() => {
							this.fontListFiltered = [];
							for (let i = 0; i < this.fontList.length; i++) {
								const fontFamily = this.fontList[i].family.toLowerCase();
								if (fontFamily.includes(query)) {
									this.fontListFiltered.push(this.fontList[i]);
								}
							}
							this.render_font_list();
						}, 350);
					}
				});

				const apiKey = config.google_webfonts_key;
				$.getJSON(`https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`, (data) => {
					this.fontList = data.items;
					this.fontListFiltered = data.items;
					this.render_font_list();
				}).fail(function () {
					alertify.error('Error loading the list of fonts from Google.');
				});
			},
			on_finish: () => {
				this.popup = null;
				this.POP = null;
				if (Object.keys(this.selectedFonts).length > 0) {
					let firstFont = null;
					for (let font in this.selectedFonts) {
						if (!firstFont) {
							firstFont = font;
						}
						config.user_fonts[font] = this.selectedFonts[font];
					}
					app.GUI.GUI_tools.action_data().attributes.font.value = firstFont;
					app.GUI.GUI_tools.show_action_attributes();
					try {
						const changeEvent = new Event('change');
						document.querySelector('#action_attributes select#font').dispatchEvent(changeEvent);
					} catch (error) {
						console.warn('Application markup may have changed, ', error);
					}
				}
			}
		});
	}
}


class Text_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.GUI_tools = new GUI_tools_class();
		this.Helper = new Helper_class();
		this.ctx = ctx;
		this.name = 'text';
		this.layer = {};
		this.creating = false;
		this.selecting = false;
		this.resizing = false;
		this.focused = false;
		this.focusedValue = null;
		this.mousedownX = 0;
		this.mousedownY = 0;
		this.mousedownBounds = {};
		this.is_fonts_loaded = false;
		if (ctx) {
			this.selection = {
				x: null,
				y: null,
				width: null,
				height: null,
			};
			var sel_config = {
				enable_background: false,
				enable_borders: true,
				enable_controls: true,
				enable_rotation: true,
				enable_move: false,
				data_function: () => {
					return this.selection;
				},
			};
			this.Base_selection = new Base_selection_class(ctx, sel_config, this.name);

			// Need a textarea in order to listen for keyboard inputs in an accessible, multi-platform independent way
			this.textarea = document.createElement('textarea');
			this.textarea.id = 'text_tool_keyboard_input';
			this.textarea.setAttribute('autocorrect', 'off');
			this.textarea.setAttribute('autocapitalize', 'off');
			this.textarea.setAttribute('autocomplete', 'off');
			this.textarea.setAttribute('spellcheck', 'false');
			this.textarea.style = `position: absolute; top: 0; left: 0; padding: 0; width: 1px; height: 1px; background: transparent; border: none; outline: none; color: transparent; opacity: 0.01; pointer-events: none;`;
			document.body.appendChild(this.textarea);

			this.textarea.addEventListener('focus', () => {
				this.focused = true;
				let editor = this.get_editor(this.layer);
				if (editor) {
					this.focusedValue = JSON.stringify(editor.document.lines);
				}
			}, true);

			this.textarea.addEventListener('blur', () => {
				this.focused = false;
				let editor = this.get_editor(this.layer);
				if (editor) {
					let value = JSON.stringify(editor.document.lines);
					if (this.focusedValue !== value) {
						this.layer.data = JSON.parse(this.focusedValue);
						app.State.do_action(
							new app.Actions.Update_layer_action(this.layer.id, { data: JSON.parse(value) })
						);
					}
				}
				this.focusedValue = null;
				this.Base_layers.render();
			}, true);

			let isComposing = false;
			let beforeImeText = "";
			this.textarea.addEventListener('compositionstart', () => {
				beforeImeText = "";
					isComposing = true;
					if (config.layer) {
						const editor = this.get_editor(config.layer);
						beforeImeText = editor.get_complete_text();
					}
			});

			this.textarea.addEventListener('compositionend', (e) => {
				const editor = this.get_editor(config.layer);
				editor.set_IME_position(e.target.value);
				beforeImeText = "";
				isComposing = false;
				e.target.value = '';
			});

			this.textarea.addEventListener('input', (e) => {
				if(isComposing){
					const editor = this.get_editor(config.layer);
					editor.replace_entire_IME_text(beforeImeText, e.target.value);
					this.Base_layers.render();
					this.extend_fixed_bounds(config.layer, editor);
				}else if (config.layer) {
					const editor = this.get_editor(config.layer);
					editor.insert_text_at_current_position(e.target.value);
					e.target.value = '';
					this.Base_layers.render();
					this.extend_fixed_bounds(config.layer, editor);
				}
			}, true);

			this.textarea.addEventListener('keydown', (e) => {
				if (config.layer) {
					let handled = true;
					const editor = this.get_editor(config.layer);
					switch (e.key) {
						case 'Backspace':
							editor.delete_character_at_current_position(false);
							break;
						case 'Delete':
							editor.delete_character_at_current_position(true);
							break;
						case 'Home':
							editor.selection.move_line_start(e.shiftKey);
							break;
						case 'End':
							editor.selection.move_line_end(e.shiftKey);
							break;
						case 'Left': case 'ArrowLeft':
							if (!e.shiftKey && !editor.selection.is_empty()) {
								editor.selection.isActiveSideEnd = false;
								editor.selection.move_character_previous(0, false);
							} else if (e.ctrlKey) {
								editor.selection.move_word_previous(e.shiftKey);
							} else {
								editor.selection.move_character_previous(1, e.shiftKey);
							}
							break;
						case 'Right': case 'ArrowRight':
							if (!e.shiftKey && !editor.selection.is_empty()) {
								editor.selection.isActiveSideEnd = true;
								editor.selection.move_character_next(0, false);
							} else if (e.ctrlKey) {
								editor.selection.move_word_next(e.shiftKey);
							} else {
								editor.selection.move_character_next(1, e.shiftKey);
							}
							break;
						case 'Up': case 'ArrowUp':
							editor.selection.move_line_previous(1, e.shiftKey);
							break;
						case 'Down': case 'ArrowDown':
							editor.selection.move_line_next(1, e.shiftKey);
							break;
						case 'a':
							if (e.ctrlKey) {
								editor.selection.set_position(0, 0);
								const lastLine = editor.document.lines.length - 1;
								editor.selection.set_position(lastLine, editor.document.get_line_character_count(lastLine), true);
								break;
							}
						case 'b':
							if (e.ctrlKey) {
								e.preventDefault();
								document.querySelector('#action_attributes #bold').click();
								break;
							}
						case 'c':
							if (e.ctrlKey) {
								e.preventDefault();
								this.textarea.value = editor.selection.get_text();
								this.textarea.select();
								this.textarea.setSelectionRange(0, 99999);
								document.execCommand('copy');
								this.textarea.value = '';
								break;
							}
						case 'i':
							if (e.ctrlKey) {
								e.preventDefault();
								document.querySelector('#action_attributes #italic').click();
								break;
							}
						case 'u':
							if (e.ctrlKey) {
								e.preventDefault();
								document.querySelector('#action_attributes #underline').click();
								break;
							}
						case 'x':
							if (e.ctrlKey) {
								e.preventDefault();
								this.textarea.value = editor.selection.get_text();
								this.textarea.select();
								this.textarea.setSelectionRange(0, 99999);
								document.execCommand('copy');
								this.textarea.value = '';
								editor.delete_selection();
								break;
							}
						default:
							handled = false;
					}
					if (handled) {
						this.update_tool_attributes(config.layer, editor);
						this.Base_layers.render();
					}
					this.extend_fixed_bounds(config.layer, editor);
					return !handled;
				}
			}, true);
		}
	}

	dragStart(event) {
		if (config.TOOL.name != this.name)
			return;
		this.mousedown(event);
	}

	dragMove(event) {
		if (config.TOOL.name != this.name)
			return;
		this.mousemove(event);
	}

	dragEnd(event) {
		if (config.TOOL.name != this.name)
			return;
		this.mouseup(event);
	}

	load() {
		// Mouse events
		document.addEventListener('mousedown', (event) => {
			this.dragStart(event);
		});
		document.addEventListener('mousemove', (event) => {
			this.dragMove(event);
		});
		document.addEventListener('mouseup', (event) => {
			this.dragEnd(event);
		});
		document.addEventListener('dblclick', (event) => {
			this.doubleClick(event);
		});

		// Touch events
		document.addEventListener('touchstart', (event) => {
			this.dragStart(event);
		});
		document.addEventListener('touchmove', (event) => {
			this.dragMove(event);
		});
		document.addEventListener('touchend', (event) => {
			this.dragEnd(event);
		});
	}

	mousedown(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.click_valid == false)
			return;

		this.creating = false;
		this.selecting = false;
		this.resizing = false;

		this.mousedownX = mouse.x;
		this.mousedownY = mouse.y;
		this.mousedownBounds = {
			x: config.layer.x,
			y: config.layer.y,
			width: config.layer.width,
			height: config.layer.height,
			boundary: config.layer.params.boundary
		};

		if (this.Base_selection.mouse_lock !== null) {
			this.resizing = true;
			return;
		}

		const existingLayer = this.get_text_layer_at_mouse(e);
		if (existingLayer) {
			this.selecting = true;
			this.layer = existingLayer;
			const editor = this.get_editor(this.layer);
			editor.trigger_cursor_start(this.layer, -1 + mouse.x - this.layer.x, mouse.y - this.layer.y);
			app.State.do_action(
				new app.Actions.Bundle_action('select_text_layer', 'Select Text Layer', [
					new app.Actions.Select_layer_action(existingLayer.id),
					new app.Actions.Set_selection_action(this.layer.x, this.layer.y, this.layer.width, this.layer.height)
				])
			);
		}
		else {
			// Create a new text layer
			this.creating = true;
			const layer = {
				type: this.name,
				params: {
					boundary: 'dynamic',
					kerning: 'metrics',
					text_direction: 'ltr',
					wrap_direction: 'ttb',
					halign: 'left',
					valign: 'top',
					wrap: 'letter'
				},
				render_function: [this.name, 'render'],
				x: mouse.x,
				y: mouse.y,
				rotate: 0,
				is_vector: true,
			};
			app.State.do_action(
				new app.Actions.Bundle_action('new_text_layer', 'New Text Layer', [
					new app.Actions.Insert_layer_action(layer),
					new app.Actions.Set_selection_action(mouse.x, mouse.y, 0, 0)
				])
			);
			this.layer = config.layer;
		}
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.is_drag == false)
			return;
		if (mouse.click_valid == false) {
			return;
		}

		if (this.resizing) {
			config.layer.x = this.selection.x;
			config.layer.y = this.selection.y;
			config.layer.width = this.selection.width;
			config.layer.height = this.selection.height;
			if (config.layer.params.boundary === 'dynamic') {
				config.layer.params.boundary = 'box';
			}
		}
		else if (this.creating) {
			const width = Math.abs(mouse.x - this.mousedownX);
			const height = Math.abs(mouse.y - this.mousedownY);

			//more data
			if (config.layer.params.boundary === 'dynamic') {
				config.layer.params.boundary = 'box';
			}
			config.layer.x = Math.min(mouse.x, this.mousedownX);
			config.layer.y = Math.min(mouse.y, this.mousedownY);
			config.layer.width = width;
			config.layer.height = height;
		} else {
			this.get_editor(this.layer).trigger_cursor_move(this.layer, -1 + mouse.x - this.layer.x, mouse.y - this.layer.y);
		}
		this.Base_layers.render();
	}

	mouseup(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.click_valid == false) {
			return;
		}
		const editor = this.get_editor(this.layer);

		if (this.resizing) {
			config.layer.x = this.mousedownBounds.x;
			config.layer.y = this.mousedownBounds.y;
			config.layer.width = this.mousedownBounds.width;
			config.layer.height = this.mousedownBounds.height;
			const new_params = JSON.parse(JSON.stringify(config.layer.params));
			new_params.boundary = config.layer.params.boundary;
			config.layer.params.boundary = this.mousedownBounds.boundary;
			app.State.do_action(
				new app.Actions.Bundle_action('resize_text_layer', 'Resize Text Layer', [
					new app.Actions.Update_layer_action(config.layer.id, {
						x: this.selection.x,
						y: this.selection.y,
						width: this.selection.width,
						height: this.selection.height,
						params: new_params
					}),
					new app.Actions.Set_selection_action(this.selection.x, this.selection.y, this.selection.width, this.selection.height)
				])
			);
		}
		else if (this.creating) {
			let width = Math.abs(mouse.x - this.mousedownX);
			let height = Math.abs(mouse.y - this.mousedownY);

			if (width == 0 && height == 0) {
				// Same coordinates - let render figure out dynamic width
				width = 1;
				height = 1;
			}
			app.State.do_action(
				new app.Actions.Bundle_action('resize_text_layer', 'Resize Text Layer', [
					new app.Actions.Update_layer_action(config.layer.id, {
						x: Math.min(mouse.x, this.mousedownX),
						y: Math.min(mouse.y, this.mousedownY),
						width,
						height
					})
				]),
				{ merge_with_history: 'new_text_layer' }
			);
			this.textarea.focus();
		}
		else if (this.selecting) {
			editor.trigger_cursor_end();
			this.textarea.focus();
			
			if (editor.selection.is_empty() && editor.document.queuedMetaChanges) {
				let meta = {};
				const existingMeta = editor.document.get_meta_range(editor.selection.start.line, editor.selection.start.character, editor.selection.end.line, editor.selection.end.character);
				for (let metaKey in existingMeta) {
					meta[metaKey] = editor.document.queuedMetaChanges[metaKey] != null ? editor.document.queuedMetaChanges[metaKey] : existingMeta[metaKey][0];
				}
			} else {
				editor.document.queuedMetaChanges = null;
				this.update_tool_attributes(this.layer, editor);
			}
		}

		// Resize layer based on text boundaries.
		this.extend_fixed_bounds(this.layer, editor);
		this.Base_layers.render();

		// Center layer on mouse if not click & drag
		if (this.creating && config.layer.params.boundary === 'dynamic') {
			requestAnimationFrame(() => {
				app.State.do_action(
					new app.Actions.Update_layer_action(config.layer.id, {
						x: config.layer.x - config.layer.width / 2,
						y: config.layer.y - config.layer.height / 2
					}),
					{ merge_with_history: 'new_text_layer' }
				);
			});
		}

		this.resizing = false;
		this.selecting = false;
		this.creating = false;
	}


	doubleClick(event) {
		if (document.activeElement === this.textarea) {
			const editor = this.get_editor(this.layer);
			if (editor.selection.is_empty()) {
				const position = editor.selection.get_position();
				const wordStart = editor.document.get_word_start_position(position.line, position.character, true);
				const wordEnd = editor.document.get_word_end_position(position.line, position.character, true);
				editor.selection.set_position(wordStart.line, wordStart.character);
				editor.selection.set_position(wordEnd.line, wordEnd.character, true);
				this.update_tool_attributes(this.layer, editor);
			}
		}
	}

	on_params_update(param) {
		const editor = this.get_editor(config.layer);
		const value = param.value;
		const meta = {};
		let returnValue = undefined;
		switch (param.key) {
			case 'font':
				if (value.includes('...')) {
					returnValue = {
						new_values: {
							font: ''
						}
					};
					new Google_fonts_search_class().show();
				}
				else if (value) meta.family = value;
				break;
			case 'size':
				if (value) meta.size = value;
				break;
			case 'bold':
				meta.bold = value;
				break;
			case 'italic':
				meta.italic = value;
				break;
			case 'underline':
				meta.underline = value;
				break;
			case 'strikethrough':
				meta.strikethrough = value;
				break;
			case 'fill':
				if (value) meta.fill_color = value;
				break;
			case 'stroke':
				if (value) meta.stroke_color = value;
				break;
			case 'stroke_size':
				if (!isNaN(value)) meta.stroke_size = value;
				break;
			case 'kerning':
				if (!isNaN(value)) meta.kerning = value;
				break;
			case 'leading':
				if (!isNaN(value)) meta.leading = value;
				break;
		}
		if (editor.selection.is_empty()) {
			if (!editor.document.queuedMetaChanges) {
				editor.document.queuedMetaChanges = {};
			}
			for (let metaKey in meta) {
				editor.document.queuedMetaChanges[metaKey] = meta[metaKey];
			}
		} else {
			editor.document.queuedMetaChanges = null;
			let oldData = JSON.parse(JSON.stringify(editor.document.lines));
			editor.document.set_meta_range(editor.selection.start.line, editor.selection.start.character, editor.selection.end.line, editor.selection.end.character, meta);
			editor.hasValueChanged = true;
			this.layer.data = oldData;
			app.State.do_action(
				new app.Actions.Update_layer_action(this.layer.id, { data: JSON.parse(JSON.stringify(editor.document.lines)) })
			);
			this.Base_layers.render();
		}
		return returnValue;
	}

	update_tool_attributes(layer, editor) {
		if (layer && layer.params) {
			const meta = editor.document.get_meta_range(editor.selection.start.line, editor.selection.start.character, editor.selection.end.line, editor.selection.end.character);
			const toolAttributes = this.GUI_tools.action_data().attributes;
			toolAttributes.font.value = meta.family.length === 1 ? meta.family[0] : '';
			toolAttributes.size = meta.size.length === 1 ? meta.size[0] : parseFloat(null);
			toolAttributes.bold.value = meta.bold.includes(false) ? false : true;
			toolAttributes.italic.value = meta.italic.includes(false) ? false : true;
			toolAttributes.underline.value = meta.underline.includes(false) ? false : true;
			toolAttributes.strikethrough.value = meta.strikethrough.includes(false) ? false : true;
			toolAttributes.fill = meta.fill_color.length === 1 ? meta.fill_color[0] : '#000000';
			toolAttributes.stroke = meta.stroke_color.length === 1 ? meta.stroke_color[0] : '#000000';
			toolAttributes.stroke_size.value = meta.stroke_size.length === 1 ? meta.stroke_size[0] : parseFloat(null);
			toolAttributes.kerning.value = meta.kerning.length === 1 ? meta.kerning[0] : parseFloat(null);
			toolAttributes.leading.value = meta.leading.length === 1 ? meta.leading[0] : parseFloat(null);
			this.GUI_tools.show_action_attributes();
		}
	}

	resize_to_dynamic_bounds(layer, editor) {
		if (layer && layer.params && layer.params.boundary === 'dynamic') {
			let new_width = Math.max(9, editor.textBoundaryWidth + 1);
			let new_height = Math.max(9, editor.textBoundaryHeight + 1);
			config.layer.width = new_width;
			config.layer.height = new_height;
		}
	}

	extend_fixed_bounds(layer, editor) {
		if (layer && layer.params && layer.params.boundary !== 'dynamic') {
			const isHorizontalTextDirection = ['ltr', 'rtl'].includes(layer.params.textDirection);
			let new_width = layer.width;
			let new_height = layer.height;
			if (isHorizontalTextDirection) {
				new_width = Math.max(editor.textBoundaryWidth + 1, new_width);
			} else {
				new_height = Math.max(editor.textBoundaryHeight + 1, new_height);
			}
			config.layer.width = new_width;
			config.layer.height = new_height;
		}
	}

	render(ctx, layer) {
		if (layer.width == 0 && layer.height == 0)
			return;
		var params = layer.params;

		const isActiveLayerAndTextTool = layer === config.layer && config.TOOL.name === 'text';
		const editor = this.get_editor(layer);
		editor.selection.set_visible(isActiveLayerAndTextTool);
		editor.selection.set_cursor_visible(isActiveLayerAndTextTool && (this.selecting || this.focused));
		editor.render(ctx, layer);
		if (layer === config.layer) {
			this.resize_to_dynamic_bounds(layer, editor);
		}
		if (!this.resizing && isActiveLayerAndTextTool) {
			this.selection.x = layer.x;
			this.selection.y = layer.y;
			this.selection.width = layer.width;
			this.selection.height = layer.height;
			this.selection.rotate = layer.rotate;
		} else if (config.layer.type !== 'text') {
			this.selection.x = -100000;
			this.selection.y = -100000;
			this.selection.width = 0;
			this.selection.height = 0;
		}
	}

	get_editor(layer) {
		let editor = layerEditors.get(layer);
		if (!editor) {
			editor = new Text_editor_class();

			// Convert legacy to new format
			if (layer.params && layer.params.text) {
				const params = layer.params;
				let lines = [];
				const textLines = layer.params.text.split('\n');
				const family = params.family && params.family.value? params.family.value : params.family;
				for (const textLine of textLines) {
					lines.push([
						{
							text: textLine,
							meta: {
								family,
								size: params.size,
								bold: params.bold,
								italic: params.italic,
								fill_color: params.stroke ? '#ffffff00' : layer.color,
								stroke_color: params.stroke ? layer.color : '#ffffff00',
								stroke_size: params.stroke ? params.stroke_size : 0,
								leading: 0
							}
						}
					]);
				}
				params.boundary = 'box';
				params.kerning = 'metrics';
				params.halign = params.align ? (params.align.value ? params.align.value : params.align).toLowerCase() : 'left';
				params.valign = 'top';
				params.text_direction = 'ltr';
				params.wrap_direction = 'ttb';
				params.wrap = 'word';
				delete params.text;
				delete params.family;
				delete params.size;
				delete params.bold;
				delete params.italic;
				delete params.stroke;
				delete params.stroke_size;
				delete params.align;
				layer.data = lines;
				layer.x -= 1;

				// Change leading offset so line height matches legacy line height calculation... need to load the font first to do this.
				// This is an approximate calculation, but seems to be pretty close.
				load_font_family({ family }, () => {
					const line = layer.data[0];
					if (!line) return;
					const span = line[0];
					if (!span) return;
					const fontMetrics = editor.get_span_font_metrics(span, !fontLoadMap.get(span.meta.family || metaDefaults.family));
					const topBounds = fontMetrics.calculate_letter_bounds('M', 'top');
					span.meta.leading = (span.meta.size || metaDefaults.size) - fontMetrics.height;
					layer.y += Math.abs(span.meta.leading) - (fontMetrics.baseline - topBounds.bottom);
					editor.hasValueChanged = true;
					editor.Base_layers.render();
				});
			}

			// Create initial layer data if new layer
			if (!layer.data) {
				const params = this.getParams();
				layer.data = [[{
					text: '',
					meta: {
						family: params.font.value !== metaDefaults.family && params.font.value ? params.font.value : undefined,
						size: params.size !== metaDefaults.size && !isNaN(params.size) ? params.size : undefined,
						bold: params.bold.value !== metaDefaults.bold ? params.bold.value : undefined,
						italic: params.italic.value !== metaDefaults.italic ? params.italic.value : undefined,
						underline: params.underline.value !== metaDefaults.underline ? params.underline.value : undefined,
						strikethrough: params.strikethrough.value !== metaDefaults.strikethrough ? params.strikethrough.value : undefined,
						fill_color: params.fill !== metaDefaults.fill_color ? params.fill : undefined,
						stroke_color: params.stroke !== metaDefaults.stroke_color ? params.stroke : undefined,
						stroke_size: params.stroke_size !== metaDefaults.stroke_size && !isNaN(params.stroke_size) ? params.stroke_size : undefined,
						kerning: params.kerning !== metaDefaults.kerning && !isNaN(params.kerning) ? params.kerning : undefined,
						leading: params.leading !== metaDefaults.leading && !isNaN(params.leading) ? params.leading : undefined
					}
				}]];
			}

			editor.set_lines(layer.data);
			editor.Base_layers = this.Base_layers;
			editor.layer = layer;
			layerEditors.set(layer, editor);
		}
		if (layer._needs_update_data) {
			delete layer._needs_update_data;
			editor.hasValueChanged = true;
			editor.set_lines(JSON.parse(JSON.stringify(layer.data)));
		}
		return editor;
	}

	get_text_layer_at_mouse(e) {
		const layers_sorted = this.Base_layers.get_sorted_layers();
		if (config.layer.type === 'text') {
			layers_sorted.unshift(config.layer);
		}
		const mouse = this.get_mouse_info(e);
		const clickableMargin = 5;
		for (let layer of layers_sorted) {
			if (layer.type === 'text') {
				// TODO - account for rotation
				if (mouse.x >= layer.x - clickableMargin && mouse.x <= layer.x + layer.width + clickableMargin && mouse.y >= layer.y - clickableMargin && mouse.y <= layer.y + layer.height + clickableMargin) {
					return layer;
				}
			}
		}
		return null;
	}

}

export default Text_class;
