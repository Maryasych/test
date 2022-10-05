//@ts-nocheck
import { World } from '../world/World';
import { IInputReceiver } from '../interfaces/IInputReceiver';
import { IUpdatable } from '../interfaces/IUpdatable';

export class InputManager implements IUpdatable
{
	public updateOrder: number = 3;

	public world: World;
	public domElement: any;
	
	public isLocked: boolean;
	public inputReceiver: IInputReceiver | undefined;

	public boundOnMouseMove: (evt: any) => void;

	constructor(world: World)
	{
		this.world = world;
		this.isLocked = false;

		// Bindings for later event use
		// Mouse
		
		this.boundOnMouseMove = (evt) => this.onMouseMove(evt);

		world.registerUpdatable(this);
	}

	public update(timestep: number, unscaledTimeStep: number): void
	{
		if (this.inputReceiver === undefined && this.world !== undefined && this.world.cameraOperator !== undefined)
		{
			this.setInputReceiver(this.world.cameraOperator);
		}

		this.inputReceiver?.inputReceiverUpdate(unscaledTimeStep);
	}

	public setInputReceiver(receiver: IInputReceiver): void
	{
		this.inputReceiver = receiver;
		this.inputReceiver.inputReceiverInit();
	}

	public onMouseMove(event: MouseEvent): void
	{
		if (this.inputReceiver !== undefined)
		{
			this.inputReceiver.handleMouseMove(event, event.movementX, event.movementY);
		}
	}
}
