
export class Base_action {
	constructor(action_id, action_description) {
		this.action_id = action_id;
		this.action_description = action_description;
		this.is_done = false;
		this.memory_estimate = 0; // Estimate of how much memory will be freed when the free() method is called (in bytes)
		this.database_estimate = 0; // Estimate of how much database space will be freed when the free() method is called (in bytes)
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