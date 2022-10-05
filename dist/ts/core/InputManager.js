export class InputManager {
    updateOrder = 3;
    world;
    domElement;
    isLocked;
    inputReceiver;
    boundOnMouseMove;
    constructor(world) {
        this.world = world;
        this.isLocked = false;
        // Bindings for later event use
        // Mouse
        this.boundOnMouseMove = (evt) => this.onMouseMove(evt);
        world.registerUpdatable(this);
    }
    update(timestep, unscaledTimeStep) {
        if (this.inputReceiver === undefined && this.world !== undefined && this.world.cameraOperator !== undefined) {
            this.setInputReceiver(this.world.cameraOperator);
        }
        this.inputReceiver?.inputReceiverUpdate(unscaledTimeStep);
    }
    setInputReceiver(receiver) {
        this.inputReceiver = receiver;
        this.inputReceiver.inputReceiverInit();
    }
    onMouseMove(event) {
        if (this.inputReceiver !== undefined) {
            this.inputReceiver.handleMouseMove(event, event.movementX, event.movementY);
        }
    }
}
