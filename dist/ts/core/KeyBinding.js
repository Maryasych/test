export class KeyBinding {
    eventCodes;
    isPressed = false;
    justPressed = false;
    justReleased = false;
    constructor(...code) {
        this.eventCodes = code;
    }
}
