import config from './../config.js';
import zoomView from './../libs/zoomView.js';
import Base_tools_class from './../core/base-tools.js';
import Base_selection_class from './../core/base-selection.js';
import Base_layers_class from './../core/base-layers.js';
import Helper_class from './../libs/helpers.js';
import Dialog_class from './../libs/popup.js';
import { timers } from 'jquery';

// Global map of font name to font metrics information.
const fontMetricsMap = new Map();
const layerEditors = new WeakMap();

/**
 * The canvas's native font metrics implementation doesn't really give us enough information...
 */
class Font_metrics_class {
    constructor(family, size) {
        this.family = family || (family = "Arial");
        this.size = parseInt(size) || (size = 12);

        // Preparing container
        const line = document.createElement('div');
        const body = document.body;
        line.style.position = 'absolute';
        line.style.whiteSpace = 'nowrap';
        line.style.font = size + 'px ' + family;
        body.appendChild(line);

        // Now we can measure width and height of the letter
        const text = 'wwwwwwwwww'; // 10 symbols to be more accurate with width
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
}

/**
 * This class's job is to store and modify the internal JSON format of a text layer.
 */
class Text_document_class {
	constructor() {
		/*
		Text is stored as an array of lines. Each line is an array that contains text span objects (represents a substring of text that has the same format as surrounding text)
		Example of a document with a single line and single text span (meta that is default value would be omitted, just showing possible options):
		[
			[
				{
					text: 'Hello World!',
					meta: {
						bold: false,
						italic: false,
						underline: false,
						strikethrough: false,
						align: 'left',
						size: 12,
						font: 'Arial',
						fillColor: {
							type: 'solid',
							hex: '000000ff'
						},
						strokeColor: {
							type: 'solid',
							hex: '000000ff'
						},
						strokeWidth: 0,
						shadow: null,
						kerning: 0,
						baseline: 0
					}
				}
			]
		]
		*/
        this.lines = [];
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
	 * Inserts a text string in the document at the specified line and character position
	 * @param {string} text - The text string to insert
	 * @param {number} line - The line number to insert at (0 indexed) 
	 * @param {number} character - The character position to insert at (0 indexed)
	 */
	insert_text(text, line, character) {
        const insertLine = this.lines[line];
        const textHasNewline = text.includes('\n');
        let characterCount = 0;
        let previousSpans = [];
        let nextSpans = [];
        let modifyingSpan = null;
        let newLine = line;
        let newCharacter = character;

        // Insert text into span at specified line/character
        for (let i = 0; i < insertLine.length; i++) {
            const span = insertLine[i];
            const spanLength = span.text.length;
            if (!modifyingSpan && (character > characterCount || character === 0)  && character <= characterCount + spanLength) {
                modifyingSpan = span;
                const textIdx = character - characterCount;
                span.text = span.text.slice(0, textIdx) + text + span.text.slice(textIdx);
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

}


/**
 * This class represents a single selection range in a text editor's document.
 */
class Text_selection_class {
	constructor(/* Text_editor_class */ editor) {
        this.editor = editor;
        this.isVisible = false;
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
	 * Sets the visibility of the selection in the editor.
	 * @param {boolean} isVisible 
	 */
	set_visible(isVisible) {
        if (this.isVisible != isVisible) {
            this.isVisible = isVisible;
            if (isVisible) {
                this.isBlinkVisible = true;
                this.start_blinking();
            } else {
                this.stop_blinking();
            }
            // this.editor.render();
        }
	}
	
	/**
	 * Starts the selection cursor blinking.
	 */
	start_blinking() {
        clearInterval(this.blinkIntervalHandle);
        this.blinkIntervalHandle = setInterval(this.blink.bind(this), this.blinkInterval);
        // this.editor.render();
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
        this.mouseSelectionMoveX = null;
        this.mouseSelectionMoveY = null;
        this.mouseSelectionEdgeScrollInterval = null;
        this.focused = false;
        
        this.metaDefaults = {
            size: 16,
            font: 'Arial',
            kerning: 0,
            fillColor: {
                type: 'solid',
                hex: '000000FF'
            },
            strokeWidth: 0,
            strokeColor: {
                type: 'solid',
                hex: '000000FF'
            }
		};
		
		// Text document for this editor
		this.document = new Text_document_class();
		this.document.lines = [[{ text: 'Hello World!', meta: {} }]];
		this.wrappedLines = [[]];

		// Text selection for this editor
		this.selection = new Text_selection_class(this);

		/*
        this.textareaElement.addEventListener('focus', this.onFocus.bind(this), false);
        this.textareaElement.addEventListener('blur', this.onBlur.bind(this), false);
        this.textareaElement.addEventListener('input', this.onInput.bind(this), false);
        this.textareaElement.addEventListener('keydown', this.onKeydown.bind(this), false);
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this), false);
        this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this), false);
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), false);
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), false);
        this.canvas.addEventListener('wheel', this.onWheel.bind(this), false);

        this.globalEventListeners = {
            onMouseUp: (e) => this.onMouseUp(e),
            onMouseMove: (e) => this.onMouseMove(e),
            onTouchEnd: (e) => this.onTouchEnd(e),
            addKeyModifier: (e) => this.addKeyModifier(e),
            removeKeyModfier: (e) => this.removeKeyModfier(e)
        };
        window.addEventListener('mouseup', this.globalEventListeners.onMouseUp, true);
        window.addEventListener('mousemove', this.globalEventListeners.onMouseMove, true);
        window.addEventListener('touchend', this.globalEventListeners.onTouchEnd, true);
        document.addEventListener('keydown', this.globalEventListeners.addKeyModifier, true);
		document.addEventListener('keyup', this.globalEventListeners.removeKeyModfier, true);
		*/
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

	get_span_font_metrics(span) {
		const fontSize = (span.meta.size || this.metaDefaults.size);
		const fontName = (span.meta.font || this.metaDefaults.font);
		let fontMetrics = fontMetricsMap.get(fontName + '_' + fontSize);
		if (!fontMetrics) {
			fontMetrics = new Font_metrics_class(fontName, fontSize);
			fontMetricsMap.set(fontName + '_' + fontSize, fontMetrics);
		}
		return fontMetrics;
	}

	insert_text_at_current_position(text) {
        if (!this.selection.is_empty()) {
            this.delete_character_at_current_position();
        }
        const position = this.selection.get_position();
        const newPosition = this.document.insert_text(text, position.line, position.character);
		this.selection.set_position(newPosition.line, newPosition.character);
		this.hasValueChanged = true;
        // this.render();
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
        // this.render();
	}

	trigger_cursor_start(layer, layerX, layerY) {
        this.isMouseSelectionActive = true;
        this.mouseSelectionStartX = layerX;
        this.mouseSelectionStartY = layerY;
	
		const cursorStart = this.get_cursor_position_from_absolute_position(layer, layerX, layerY);
		this.selection.set_position(cursorStart.line, cursorStart.character, false);
	}
	
	trigger_cursor_move(layer, layerX, layerY) {
        const isInsideCanvas = true; // layerX > 0 && layerY > 0 && layerX < this.lastCalculatedLayerWidth && layerY < this.lastCalculatedLayerHeight;
        if (this.isMouseSelectionActive && isInsideCanvas) {
			this.mouseSelectionMoveX = layerX;
			this.mouseSelectionMoveY = layerY;
			const cursorEnd = this.get_cursor_position_from_absolute_position(layer, layerX, layerY);
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
			for (s = 0; s < currentWrapSpans.length; s++) {
				const span = currentWrapSpans[s];
				const kerning = (span.meta.kerning || this.metaDefaults.kerning);
				let fontMetrics;
				if (isHorizontalTextDirection) {
					ctx.font =
						' ' + (span.meta.italic ? 'italic' : '') +
						' ' + (span.meta.bold ? 'bold' : '') +
						' ' + (span.meta.size || this.metaDefaults.size) + 'px' +
						' ' + (span.meta.font || this.metaDefaults.font);
				}
				else {
					fontMetrics = this.get_span_font_metrics(span);
				}
				for (let c = 0; c < span.text.length; c++) {
					const character = span.text[c];
					const characterSize = isHorizontalTextDirection ? ctx.measureText(character).width : fontMetrics.height;
					wrapAccumulativeSize += characterSize + kerning;
					if (boundary !== 'dynamic' && wrapAccumulativeSize > textDirectionMaxSize && character != ' ') {
						// Find last span with space
						let spacePosition = -1;
						let bs = s;
						for (; bs >= 0; bs--) {
							const backwardsSpan = currentWrapSpans[bs];
							const backwardsSpanText = (bs === s) ? backwardsSpan.text.substring(0, c) : backwardsSpan.text;
							spacePosition = backwardsSpanText.lastIndexOf(' ');
							if (spacePosition > -1) {
								break;
							}
						}
						let beforeSpans = [];
						let afterSpans = [];
						// Found a previous span on the current line wrap that contains a space, split the line
						if (spacePosition > -1) {
							beforeSpans = currentWrapSpans.slice(0, bs);
							afterSpans = currentWrapSpans.slice(bs + 1);
							const beforeText = currentWrapSpans[bs].text.substring(0, spacePosition + 1);
							const afterText = currentWrapSpans[bs].text.substring(spacePosition + 1);
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
						lineWraps.push({
							characterOffsets: wrapCharacterOffsets,
							spans: beforeSpans
						});
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

		// Determine the size of each line (e.g. line height if horizontal typing direction)
		let wrapSizeAccumulator = 0;
		let wrapCounter = 0;
		for (let line of lineRenderInfo.lines) {
			line.firstWrapIndex = wrapCounter;
			for (let wrap of line.wraps) {
				let wrapSize = 0;
				let wrapBaseline = 0;
				for (let span of wrap.spans) {
					let fontMetrics;
					if (isHorizontalTextDirection) {
						fontMetrics = this.get_span_font_metrics(span);
					} else {
						ctx.font =
							' ' + (span.meta.italic ? 'italic' : '') +
							' ' + (span.meta.bold ? 'bold' : '') +
							' ' + (span.meta.size || this.metaDefaults.size) + 'px' +
							' ' + (span.meta.font || this.metaDefaults.font);
					}
					let spanWrapSize = isHorizontalTextDirection ? fontMetrics.height : ctx.measureText(character).width;
					let spanWrapBaseline = isHorizontalTextDirection ? fontMetrics.baseline : 0;
					if (spanWrapSize > wrapSize) {
						wrapSize = spanWrapSize;
						wrapBaseline = spanWrapBaseline;
					}
				}
				lineRenderInfo.wrapSizes.push({ size: wrapSize, offset: wrapSizeAccumulator, baseline: wrapBaseline });
				wrapSizeAccumulator += wrapSize;
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
		if (this.hasValueChanged || layer.width != this.lastCalculatedLayerWidth || layer.height != this.lastCalculatedLayerHeight || !this.textBoundaryWidth || !this.textBoundaryHeight) {
			this.calculate_text_placement(ctx, layer);
		}

		if (!this.lineRenderInfo) return;

		try {

			let options = options || {};
			let isSelectionEmpty = this.selection.is_empty();

			ctx.textAlign = 'left';
			ctx.textBaseline = 'alphabetic';

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
			for (let line of this.lineRenderInfo.lines) {
				let lineLetterCount = 0;
				for (let [localWrapIndex, wrap] of line.wraps.entries()) {
					let cursorStartX = null;
					let cursorStartY = null;
					let cursorSize = null;
					let characterIndex = 0;
					const characterOffsets = wrap.characterOffsets;
					for (let [spanIndex, span] of wrap.spans.entries()) {
						// Set styles for drawing
						ctx.font =
							' ' + (span.meta.italic ? 'italic' : '') +
							' ' + (span.meta.bold ? 'bold' : '') +
							' ' + Math.round(span.meta.size || this.metaDefaults.size) + 'px' +
							' ' + (span.meta.font || this.metaDefaults.font);
						const fillColor = span.meta.fillColor || this.metaDefaults.fillColor;
						let fillStyle;
						if (fillColor.type === 'solid') {
							fillStyle = '#' + fillColor.hex;
						}
						const strokeWidth = ((span.meta.strokeWidth != null) ? span.meta.strokeWidth : this.metaDefaults.strokeWidth);
						let strokeStyle;
						if (strokeWidth) {
							const strokeColor = span.meta.strokeColor || this.metaDefaults.strokeColor;
							if (strokeColor.type === 'solid') {
								strokeStyle = '#' + strokeColor.hex;
							}
							ctx.lineWidth = strokeWidth;
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
							const letterDrawX = isHorizontalTextDirection ? textDirectionOffset : wrapDirectionOffset;
							const letterDrawY = isHorizontalTextDirection ? wrapDirectionOffset : textDirectionOffset;
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
								ctx.strokeStyle = 'white';
								ctx.lineWidth = 1;
								ctx.strokeRect(letterStartX + .25, letterStartY + 0.5, letterSizeX - 0.5, letterSizeY - 0.5);
								ctx.strokeStyle = this.selectionBackgroundColor;
								ctx.lineWidth = 0.75;
								ctx.strokeRect(letterStartX, letterStartY, letterSizeX, letterSizeY);
								ctx.lineWidth = strokeWidth;
							}
							ctx.fillStyle = fillStyle;
							ctx.strokeStyle = strokeStyle;
							ctx.fillText(letter, letterDrawX, letterDrawY);
							if (strokeWidth) {
								ctx.strokeText(letter, letterDrawX, letterDrawY);
							}
							characterIndex++;
							lineLetterCount++;
						}
						if (span.text.length === 0) {
							if (cursorLine === lineIndex && cursorCharacter === lineLetterCount) {
								const lineStart = Math.round(drawOffsetTop + wrapSizes[wrapIndex].offset);
								const textDirectionOffset = drawOffsetLeft + characterOffsets[0];
								const letterWidth = 3;
								const letterHeight = Math.round(wrapSizes[wrapIndex].size);
								cursorStartX = (isHorizontalTextDirection ? textDirectionOffset : lineStart) - 0.5;
								cursorStartY = (isHorizontalTextDirection ? lineStart : textDirectionOffset) - 0.5;
								cursorSize = isHorizontalTextDirection ? letterHeight : letterWidth;
							}
						}
					}

					// Draw cursor
					if (this.selection.isVisible /*&& this.selection.isBlinkVisible*/ && cursorStartX && this.editingCtx == ctx) {
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
		} catch (error) {
			console.warn(error);
		}

		this.hasValueChanged = false;
	}
}


class Text_class extends Base_tools_class {

	constructor(ctx) {
		super();
		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.POP = new Dialog_class();
		this.ctx = ctx;
		this.name = 'text';
		this.layer = {};
		this.creating = false;
		this.selecting = false;
		this.resizing = false;
		this.focused = false;
		this.mousedownX = 0;
		this.mousedownY = 0;
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
				data_function: () => {
					return this.selection;
				},
			};
			this.Base_selection = new Base_selection_class(ctx, sel_config, this.name);

			// Need a textarea in order to listen for keyboard inputs in an accessible, multi-platform independent way
			this.textarea = document.createElement('textarea');
			this.textarea.setAttribute('autocorrect', 'off');
			this.textarea.setAttribute('autocapitalize', 'off');
			this.textarea.setAttribute('autocomplete', 'off');
			this.textarea.setAttribute('spellcheck', 'false');
			this.textarea.style = `position: absolute; top: 0; left: 0; padding: 0; width: 1px; height: 1px; background: transparent; border: none; outline: none; color: transparent; opacity: 0.01; pointer-events: none;`;
			document.body.appendChild(this.textarea);

			this.textarea.addEventListener('focus', () => {
				this.focused = true;
			}, true);
			this.textarea.addEventListener('blur', () => {
				this.focused = false;
				this.Base_layers.render();
			}, true);
			this.textarea.addEventListener('input', (e) => {
				if (this.layer) {
					const editor = this.get_editor(this.layer);
					editor.insert_text_at_current_position(e.target.value);
					e.target.value = '';
					this.Base_layers.render();
					this.extend_fixed_bounds(this.layer, editor);
				}
			}, true);
			this.textarea.addEventListener('keydown', (e) => {
				if (this.layer) {
					let handled = true;
					const editor = this.get_editor(this.layer);
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
							} else {
								editor.selection.move_character_previous(1, e.shiftKey);
							}
							break;
						case 'Right': case 'ArrowRight':
							if (!e.shiftKey && !editor.selection.is_empty()) {
								editor.selection.isActiveSideEnd = true;
								editor.selection.move_character_next(0, false);
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
						default:
							handled = false;
					}
					if (handled) {
						this.Base_layers.render();
					}
					this.extend_fixed_bounds(this.layer, editor);
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
		if (mouse.valid == false || mouse.click_valid == false)
			return;

		this.creating = false;
		this.selecting = false;
		this.resizing = false;

		this.mousedownX = mouse.x;
		this.mousedownY = mouse.y;

		if (this.Base_selection.mouse_lock !== null) {
			this.resizing = true;
			return;
		}

		const existingLayer = this.get_text_layer_at_mouse(e);
		if (existingLayer) {
			this.selecting = true;
			this.layer = existingLayer;
			const editor = this.get_editor(this.layer);
			this.Base_layers.select(existingLayer.id);
			editor.trigger_cursor_start(this.layer, -1 + mouse.x - this.layer.x, mouse.y - this.layer.y);
			this.Base_selection.set_selection(this.layer.x, this.layer.y, this.layer.width, this.layer.height);
		}
		else {
			// Create a new text layer
			this.creating = true;
			window.State.save();
			const layer = {
				type: this.name,
				params: {
					boundary: 'dynamic',
					text_direction: 'ltr',
					wrap_direction: 'ttb'
				},
				render_function: [this.name, 'render'],
				x: mouse.x,
				y: mouse.y,
				rotate: null,
				is_vector: true,
			};
			this.Base_layers.insert(layer);
			this.layer = config.layer;
			this.Base_selection.set_selection(mouse.x, mouse.y, 0, 0);
		}
	}

	mousemove(e) {
		var mouse = this.get_mouse_info(e);
		if (mouse.is_drag == false)
			return;
		if (mouse.valid == false || mouse.click_valid == false) {
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
		if (mouse.valid == false || mouse.click_valid == false) {
			return;
		}
		const editor = this.get_editor(this.layer);

		if (this.resizing) {
			this.resizing = false;
		}
		else if (this.creating) {
			let width = Math.abs(mouse.x - this.mousedownX);
			let height = Math.abs(mouse.y - this.mousedownY);

			if (width == 0 && height == 0) {
				//same coordinates - cancel
				width = config.WIDTH - this.layer.x - Math.round(config.WIDTH / 50);
				height = 100;
			}
			//more data
			config.layer.x = Math.min(mouse.x, this.mousedownX);
			config.layer.y = Math.min(mouse.y, this.mousedownY);
			config.layer.width = width;
			config.layer.height = height;
			this.textarea.focus();
			this.creating = false;
		}
		else {
			editor.trigger_cursor_end();
			this.textarea.focus();
			this.selecting = false;
		}

		// Resize layer based on text boundaries.
		this.extend_fixed_bounds(this.layer, editor);
		this.Base_layers.render();
	}

		/*
		//ask for text
		var settings = {
			title: 'Edit text',
			params: [
				{name: "text", title: "Text:", value: "Text example", type: "textarea"},
				{name: "size", title: "Size:", value: 40},
				{name: "family", title: "Custom font", value: "Verdana", values: this.get_fonts()},
				{name: "bold", title: "Bold:", value: false},
				{name: "italic", title: "Italic:", value: false},
				{name: "align", title: "Align:", value: 'Left', values: ["Left", "Center", "Right"], type: 'select' },
				{name: "stroke", title: "Stroke:", value: false},
				{name: "stroke_size", title: "Stroke size:", value: 1},
			],
			on_load: function (params) {
				config.layer.params = params;
				config.need_render = true;
				//add preview
				var button = document.createElement('button');
				button.innerHTML = 'Preview';
				button.className = 'button trns';
				document.querySelector('#popup .buttons').appendChild(button);
				button.addEventListener('click', function (e) {
					config.need_render = true;
				});
			},
			on_change: function (params) {
				config.layer.params = params;
				config.need_render = true;
			},
			on_finish: function (params) {
				config.layer.params = params;
				config.need_render = true;
			},
		};
		this.POP.show(settings);
		*/
	
	/*
	getLines(ctx, text, maxWidth) {
		var words = text.split(" ");
		var lines = [];
		var currentLine = words[0];

		for (var i = 1; i < words.length; i++) {
			var word = words[i];
			var width = ctx.measureText(currentLine + " " + word).width;
			if (width < maxWidth) {
				currentLine += " " + word;
			} else {
				lines.push(currentLine);
				currentLine = word;
			}
		}
		lines.push(currentLine);
		
		return lines;
	}
	*/

	resize_to_dynamic_bounds(layer, editor) {
		if (layer && layer.params && layer.params.boundary === 'dynamic') {
			layer.width = editor.textBoundaryWidth + 1;
			layer.height = editor.textBoundaryHeight + 1;
		}
	}

	extend_fixed_bounds(layer, editor) {
		if (layer && layer.params && layer.params.boundary !== 'dynamic') {
			const params = this.getParams();
			const isHorizontalTextDirection = ['ltr', 'rtl'].includes(params.textDirection);
			if (isHorizontalTextDirection) {
				layer.width = Math.max(editor.textBoundaryWidth + 1, layer.width);
			} else {
				layer.height = Math.max(editor.textBoundaryHeight + 1, layer.height);
			}
			layer.width = Math.max(4, layer.width);
			layer.height = Math.max(4, layer.height);
		}
	}

	render(ctx, layer) {
		if (layer.width == 0 && layer.height == 0)
			return;
		var params = layer.params;

		const isActiveLayerAndTextTool = layer === config.layer && config.TOOL.name === 'text';
		const editor = this.get_editor(layer);
		editor.selection.set_visible(isActiveLayerAndTextTool && (this.selecting || this.focused));
		editor.render(ctx, layer);
		this.resize_to_dynamic_bounds(layer, editor);
		if (!this.resizing && isActiveLayerAndTextTool) {
			this.selection.x = layer.x;
			this.selection.y = layer.y;
			this.selection.width = layer.width;
			this.selection.height = layer.height;
		}

		/*
		var font = params.family;
		if(typeof font == 'object'){
			font = font.value; //legacy
		}
		var text = params.text;
		var size = params.size;
		var line_height = size;
		
		if(text == undefined){
			//not defined yet
			return;
		}
		
		this.load_fonts();
		
		//set styles
		if (params.bold && params.italic)
			ctx.font = "Bold Italic " + size + "px " + font;
		else if (params.bold)
			ctx.font = "Bold " + size + "px " + font;
		else if (params.italic)
			ctx.font = "Italic " + size + "px " + font;
		else
			ctx.font = "Normal " + size + "px " + font;
		ctx.fillStyle = layer.color;
		ctx.strokeStyle = layer.color;
		ctx.lineWidth = params.stroke_size;
		ctx.textBaseline = 'top';
		
		var paragraphs = text.split("\n");
		var offset_y = -line_height;
		for(var i in paragraphs){
			var block_test = paragraphs[i];
			var lines = this.getLines(ctx, block_test, layer.width);
			for (var j in lines) {
				offset_y += line_height;
				this.render_text_line(ctx, layer, lines[j], offset_y);
			}
		}
		*/
	}
	
	/*
	render_text_line(ctx, layer, text, offset_y) {
		var params = layer.params;
		var stroke = params.stroke;
		var align = params.align;
		if(typeof align == 'object'){
			align = align.value; //legacy
		}
		align = align.toLowerCase();
		var text_width = ctx.measureText(text).width;
		
		//tabs
		text = text.replace(/\t/g, '      ');
		
		var start_x = layer.x;
		if (align == 'right') {
			start_x = layer.x + layer.width - text_width;
		}
		else if (align == 'center') {
			start_x = layer.x + Math.round(layer.width / 2) - Math.round(text_width / 2);
		}

		if (stroke == false)
			ctx.fillText(text, start_x, layer.y + offset_y);
		else
			ctx.strokeText(text, start_x, layer.y + offset_y);
	}
	*/

	get_editor(layer) {
		let editor = layerEditors.get(layer);
		if (!editor) {
			editor = new Text_editor_class();
			// TODO - set value 
			layerEditors.set(layer, editor);
		}
		return editor;
	}
	
	load_fonts(){
		if(this.is_fonts_loaded == true){
			return;
		}
		
		var fonts = this.get_external_fonts();
		var head = document.getElementsByTagName('head')[0];
		for(var i in fonts) {
			var font_family = fonts[i].replace(/[^a-zA-Z0-9 ]/g, '').replace(/ +/g, '+');
			var font_url = 'https://fonts.googleapis.com/css?family=' + font_family;

			var link  = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = font_url;
			head.appendChild(link);
		}
		
		this.is_fonts_loaded = true;
	}

	get_fonts(){
		var default_fonts = [
			"Arial",
			"Courier",
			"Impact", 
			"Helvetica",
			"Monospace", 
			"Tahoma", 
			"Times New Roman",
			"Verdana",
		];
		
		var external_fonts = this.get_external_fonts();
		
		//merge and sort
		var merged = default_fonts.concat(external_fonts);
		merged = merged.sort();
		
		return merged;
	}
	
	get_external_fonts(){		
		var google_fonts = [
			"Amatic SC",
			"Arimo",
			"Codystar",
			"Creepster",
			"Indie Flower",
			"Lato",
			"Lora",
			"Merriweather",
			"Monoton",
			"Montserrat",
			"Mukta",
			"Muli",
			"Nosifer",
			"Nunito",
			"Oswald",
			"Orbitron",
			"Pacifico",
			"PT Sans",
			"PT Serif",
			"Playfair Display",
			"Poppins",
			"Raleway",
			"Roboto",
			"Rubik",
			"Special Elite",
			"Tangerine",
			"Titillium Web",
			"Ubuntu",
		];
		
		return google_fonts;
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
