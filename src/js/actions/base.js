
export class Base_action {
    constructor(action_id, action_description) {
        this.action_id = action_id;
        this.action_description = action_description;
        this.is_done = false;
    }
    do() {
        this.is_done = true;
    }
    undo() {
        this.is_done = false;
    }
    free() {
        // Override if need to run tasks to free memory when action is discarded from history
    }
}