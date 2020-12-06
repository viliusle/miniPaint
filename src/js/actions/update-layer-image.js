import app from './../app.js';
import config from './../config.js';
import Helper_class from './../libs/helpers.js';
import alertify from './../../../node_modules/alertifyjs/build/alertify.min.js';
import image_store from './store/image-store.js';
import { Base_action } from './base.js';

const Helper = new Helper_class();

export class Update_layer_image_action extends Base_action {
	/**
	 * updates layer image data
	 *
	 * @param {canvas} canvas
	 * @param {int} layer_id (optional)
	 */
	constructor(canvas, layer_id) {
        super('update_layer_image', 'Update Layer Image');
        this.canvas = canvas;
        this.canvas_data_url = null;
        if (layer_id == null)
			layer_id = config.layer.id;
        this.layer_id = parseInt(layer_id);
        this.reference_layer = null;
        this.old_image_id = null;
	}

    async do() {
        super.do();
        this.reference_layer = app.Layers.get_layer(this.layer_id);
        if (!this.reference_layer) {
            throw new Error('Aborted - layer with specified id doesn\'t exist');
        }
		if (this.reference_layer.type != 'image'){
			alertify.error('Error: layer must be image.');
			throw new Error('Aborted - layer is not an image');
		}

        if (!this.canvas_data_url) {
            if (Helper.is_edge_or_ie() == false) {
                // Update image using blob (faster)
                await new Promise((resolve) => {
                    this.canvas.toBlob((blob) => {
                        this.canvas_data_url = window.URL.createObjectURL(blob);
                        resolve();
                    }, 'image/png');
                });
            }
            else {
                // Slow way for IE, Edge
                this.canvas_data_url = this.canvas.toDataURL();
            }
            this.canvas = null;
        }

        try {
            this.old_image_id = await image_store.add(this.reference_layer.link.src);
        } catch (error) {
            console.log(error);
            // TODO - need to delete undo history, how to handle this?
        }
        this.reference_layer.link.src = this.canvas_data_url;

		config.need_render = true;
    }

    async undo() {
        super.undo();
        if (this.old_image_id != null) {
            try {
                this.reference_layer.link.src = await image_store.get(this.old_image_id);
            } catch (error) {
                throw new Error('Failed to retrieve image from store');
            }
            try {
                await image_store.delete(this.old_image_id);
            } catch (error) {
                // TODO - Reduce assumed total memory storage by image size
            }
            this.old_image_id = null;
        }
        this.reference_layer = null;
        config.need_render = true;
    }

    async free() {
        if (this.old_image_id != null) {
            try {
                await image_store.delete(this.old_image_id);
            } catch (error) {
                // TODO - Reduce assumed total memory storage by image size
            }
            this.old_image_id = null;
        }
        this.reference_layer = null;
        this.canvas_data_url = null;
    }
}