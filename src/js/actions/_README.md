# Managing Undo History with Actions

Most layer and image manipulation tasks are bound to the undo history, which the user can undo by using the "Ctrl + Z" shortcut on their keyboard, and redo by using the "Ctrl + Y" shortcut.

All actions that the user can do in the application are organized into separate Javascript modules inside the `src/js/actions` folder. It will be a very rare event if you ever need to add a new action, as most functionality in the application is covered by the following actions:

- insert-layer.js
- update-layer.js
- update-layer-image.js
- delete-layer.js
- update-config.js

These Javascript files contain classes that represent each action. They run by calling the `do()` method, and can be reversed by calling the `undo()` method. However, normally you will not call `do()` or `undo()` methods directly. Instead... the State object will do this for you.

The application history is managed by the `src/js/core/base-state.js` module. It has a `do_action()` method that runs an action then adds it to the history stack so the user can undo it. The following examples will show how the state and actions work together.

## Example 1 - Running a single action, and adding it to the undo history

```
// This import path will change relative to the module you import from:
import 'app' from './src/js/app.js';

app.State.do_action(
	new app.Actions.Insert_layer_action({
		name: 'Layer Name',
		type: 'image',
		data: 'SOME IMAGE DATA'
	})
);
```

This example creates an instance of the Insert_layer_action class, then passes that instance to the `do_action()` method on the State object. This results in the action running immediately then the action is added to the undo history.

The `app` object is just a module that collects references to a bunch of globally accessible classes throughout the application. It makes referencing different actions easier since you don't have to import them individually.

## Example 2 - Running multiple actions that are undone all at the same time

Actions can be grouped together by using the `Bundle_action`. You give the bundle a name and id to describe it, then a list of actions to run when the bundle runs.

```
import 'app' from './src/js/app.js';

app.State.do_action(
	new app.Actions.Bundle_action('bundle_id', 'Bundle Description', [
		new app.Actions.Update_layer_action(config.layer.id, { x: 0, y: 0 }),
		new app.Actions.Prepare_canvas_action('undo'),
		new app.Actions.Update_config_action({ WIDTH: 200, HEIGHT: 200 }),
		new app.Actions.Prepare_canvas_action('do')
	])
)
```

This action bundle sets the x and y positions of the currently selected layer to 0, then changes the width and height of the canvas.

When the actions in the bundle are executed, they run from the first declared (top) to the last (bottom). When they are undone, they run in reverse order, from last to first (bottom to top).

In this example you see the Prepare_canvas_action added to the bundle. This resizes the canvas after setting the width and height in the config, because just updating the config doesn't actually resize the canvas. It has an argument to tell it when to execute, (whether the action is being 'done' or 'undone'), because it isn't necessary to resize the canvas before setting the width and height.

So when the action bundle runs ('do' or 'redo'), the run order is Update_layer_action, Prepare_canvas_action (runs but doesn't do anything), Update_config_action, Prepare_canvas_action.

When the bundle is 'undone', the run order is Prepare_canvas_action (doesn't do anything), Update_config_action, Prepare_canvas_action, Update_layer_action.

## Example 3 - Adding actions to a bundle after the bundle was already created and ran.

Consider this scenario:

You have a tool like the rectangle tool where when the user clicks and holds their mouse down on the page, the rectangle is created, then when they drag (and eventually release) the mouse, the rectangle is resized.

These are two different actions (create layer, update layer with new width and height) that are done at separate times. However it makes the most sense if the user were to undo after running these actions, both should be undone all at once. 

During the "mousedown" or "touchstart" event, insert the new layer.

```
app.State.do_action(
	new app.Actions.Bundle_action('create_rectangle', 'Create Rectangle', [
		new app.Actions.Insert_layer_action({
			name: 'New Rectangle',
			width: 0,
			height: 0
		})
	])
);
```

During the "mousemove" or "touchmove" event, update the layer directly so the resizing changes are immediately visible to the user.

```
config.layer.width = NEW_WIDTH;
config.layer.height = NEW_HEIGHT;
```

During the "mouseup" or "touchend" event, commit the new width and height to history.

```
app.State.do_action(
	new app.Actions.Update_layer_action({
		width: NEW_WIDTH,
		height: NEW_HEIGHT
	}),
	{ merge_with_history: 'create_rectangle' }
);
```

The argument labeled `merge_with_history` will merge the current action with the previous action, if the provided id is the same id as the previous action. In this case, on mousedown an action with id 'create_rectangle' is run, and on mouseup, another action that says it wants to merge with that action runs, and they're merged together into one history action.

So when the user presses `Ctrl + Z` to undo, the layer will simultaneously be given its original width then deleted. If the `merge_with_history` option was left out, the user would need to press `Ctrl + Z` twice in order to delete the layer.

## Notes on creating custom actions

This is an example template for creating a new action:

```
import app from './../app.js';
import { Base_action } from './base.js';

export class Custom_action extends Base_action {
	constructor(/* Pass data the action needs to run */) {
		// Give the action an ID and a description
		super('custom_action', 'My Custom Action');
		// Store data on `this.` instance and create any necessary variables
	}

	async do() {
		super.do();
		// Insert code to run the action
	}

	async undo() {
		super.undo();
		// Insert code to undo everything done by the do() method
	}

	free() {
		// This method is called when the action is removed from
		// the history stack, either by reaching the undo limit or 
		// by undoing one or more actions then running a new action.
		// (the actions that were undone are freed)

		// Clean up any varible references for freeing memory or storage space here
	}
}
```

Note that the "app" object contains a lot of useful global references.
