import
{
	CharacterStateBase,
} from './_stateLibrary';
import { ICharacterState } from '../../interfaces/ICharacterState';
import { Character } from '../Character';

export class Falling extends CharacterStateBase implements ICharacterState
{
	public allreadyJumped: boolean | undefined;

	constructor(character: Character, allreadyJumped?: boolean)
	{
		super(character);
		this.allreadyJumped = allreadyJumped
		this.character.velocitySimulator.mass = 100;
		this.character.rotationSimulator.damping = 0.3;

		this.character.arcadeVelocityIsAdditive = true;
		this.character.setArcadeVelocityInfluence(0.05, 0, 0.05);

		this.playAnimation('falling', 0.3);
	}

	public update(timeStep: number): void
	{
		super.update(timeStep);

		this.character.setCameraRelativeOrientationTarget();
		this.character.setArcadeVelocityTarget(this.anyDirection() ? 0.8 : 0);

		if (this.character.rayHasHit)
		{
			this.setAppropriateDropState(this.allreadyJumped);
		}
	}
}