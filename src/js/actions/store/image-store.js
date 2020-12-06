import { get } from "jquery";

let idCounter = 0;
let database = null;
let databaseInitPromise = null;

export default {
    /**
     * Initializes the database
     */
    async init() {
        if (!databaseInitPromise) {
            databaseInitPromise = new Promise(async (resolveInit) => {
                try {
                    if (window.indexedDB) {
                        // Delete database from a previous page load
                        await new Promise((resolve, reject) => {
                            let deleteRequest = window.indexedDB.deleteDatabase('undoHistoryImageStore');
                            deleteRequest.onerror = () => {
                                reject(deleteRequest.error);
                            };
                            deleteRequest.onsuccess = () => {
                                resolve();
                            };
                        });
                        // Initialize database
                        await new Promise((resolve, reject) => {
                            let openRequest = window.indexedDB.open('undoHistoryImageStore', 1);
                            openRequest.onupgradeneeded = function(event) {
                                database = openRequest.result;
                                switch (event.oldVersion) {
                                    case 0:
                                        database.createObjectStore('images', { keyPath: 'id' });
                                        break;
                                }
                            };
                            openRequest.onerror = () => {
                                reject(openRequest.error);
                            }
                            openRequest.onsuccess = () => {
                                resolve();
                                database = openRequest.result;
                            }
                        });
                        if (!database) {
                            throw new Error('indexedDB not initialized');
                        }
                    }
                } catch (error) {
                    database = {
                        isMemory: true,
                        images: {}
                    };
                }
                resolveInit();
            });
            await databaseInitPromise;
        } else if (!database) {
            await databaseInitPromise;
        }
    },

    /**
     * Adds the specified image to the database. Returns a promise that is resolved with an id that can be used to retrieve it again.
     * 
     * @param {string | canvas | ImageData} imageData the image data to store
     * @returns {Promise<string>} resolves with retrieval id
     */
    async add(imageData) {
        await this.init();
        let imageId = (idCounter++) + '';
        if (database.isMemory) {
            database.images[imageId] = imageData;
        } else {
            await new Promise((resolve, reject) => {
                const transaction = database.transaction('images', 'readwrite');
                const images = transaction.objectStore('images');
                const image = {
                    id: imageId,
                    data: imageData
                }
                const request = images.add(image);
                request.onsuccess = function() {
                    resolve();
                };
                request.onerror = function() {
                    reject(request.error);
                };
            });
        }
        return imageId;
    },

    /**
     * Gets the specified image from the database, by imageId retrieved from "add()" method.
     * 
     * @param {string} imageId the id of the image to get
     * @returns {Promise<string | canvas | ImageData>} resolves with the image
     */
    async get(imageId) {
        await this.init();
        if (database.isMemory) {
            return database.images[imageId];
        } else {
            return new Promise((resolve, reject) => {
                const transaction = database.transaction('images', 'readonly');
                const images = transaction.objectStore('images');
                const request = images.get(imageId);
                request.onsuccess = function() {
                    resolve(request.result.data);
                };
                request.onerror = function() {
                    reject(request.error);
                };
            });
        }
    },

    /**
     * Deletes the specified image from the database, by imageId retrieved from "add()" method.
     * 
     * @param {string} imageId the id of the image to delete
     * @returns {Promise<string | canvas | ImageData>} resolves with the image
     */
    async delete(imageId) {
        await this.init();
        if (database.isMemory) {
            delete database.images[imageId];
        } else {
            return new Promise((resolve, reject) => {
                const transaction = database.transaction('images', 'readwrite');
                const images = transaction.objectStore('images');
                const request = images.delete(imageId);
                request.onsuccess = function() {
                    resolve();
                };
                request.onerror = function() {
                    reject(request.error);
                };
            });
        }
    }
};