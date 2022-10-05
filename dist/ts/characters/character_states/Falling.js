import { CharacterStateBase, } from './_stateLibrary';
export class Falling extends CharacterStateBase {
    allreadyJumped;
    constructor(character, allreadyJumped) {
        super(character);
        this.allreadyJumped = allreadyJumped;
        this.character.velocitySimulator.mass = 100;
        this.character.rotationSimulator.damping = 0.3;
        this.character.arcadeVelocityIsAdditive = true;
        this.character.setArcadeVelocityInfluence(0.05, 0, 0.05);
        this.playAnimation('falling', 0.3);
    }
    update(timeStep) {
        super.update(timeStep);
        this.character.setCameraRelativeOrientationTarget();
        this.character.setArcadeVelocityTarget(this.anyDirection() ? 0.8 : 0);
        if (this.character.rayHasHit) {
            this.setAppropriateDropState(this.allreadyJumped);
        }
    }
}
