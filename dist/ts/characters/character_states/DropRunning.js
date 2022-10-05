import { CharacterStateBase, EndWalk, JumpRunning, Sprint, Walk, } from './_stateLibrary';
export class DropRunning extends CharacterStateBase {
    constructor(character) {
        super(character);
        this.character.setArcadeVelocityTarget(0.8);
        this.playAnimation('drop_running', 0.1);
    }
    update(timeStep) {
        super.update(timeStep);
        this.character.setCameraRelativeOrientationTarget();
        if (this.animationEnded(timeStep)) {
            this.character.setState(new Walk(this.character));
        }
    }
    onInputChange() {
        if (this.noDirection()) {
            this.character.setState(new EndWalk(this.character));
        }
        if (this.anyDirection() && this.character.actions.run.justPressed) {
            this.character.setState(new Sprint(this.character));
        }
        if (this.character.actions.jump.justPressed) {
            this.character.setState(new JumpRunning(this.character));
        }
    }
}
