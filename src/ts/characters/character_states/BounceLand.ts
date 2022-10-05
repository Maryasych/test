import
{
	CharacterStateBase,
	EndWalk,
	Walk,
} from './_stateLibrary';
import { ICharacterState } from '../../interfaces/ICharacterState';
import { Character } from '../Character';

export class BounceLand extends CharacterStateBase implements ICharacterState
{
	constructor(character: Character)
	{
		super(character);

		this.character.velocitySimulator.mass = 5;
		this.character.velocitySimulator.damping = 0.5;

		this.character.setArcadeVelocityTarget(-0.5);
        this.character.arcadeVelocityIsAdditive = true;
		//this.character.setArcadeVelocityInfluence(0.5, 0, 0.5);
		this.playAnimation('bounce_land', 0.2);

	}

	public update(timeStep: number): void
	{
		super.update(timeStep);

		this.character.setCameraRelativeOrientationTarget();

		if (this.animationEnded(timeStep))
		{
			if (this.anyDirection())
			{
				this.character.setState(new Walk(this.character));
			}
			else
			{
				this.character.setState(new EndWalk(this.character));
			}
		}
	}
}