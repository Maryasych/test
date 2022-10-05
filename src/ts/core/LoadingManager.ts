import { LoadingTrackerEntry } from './LoadingTrackerEntry';
import { Scenario } from '../world/Scenario';
import { World } from '../world/World';
import {default as AMMONodejs} from '@enable3d/ammo-on-nodejs';

export class LoadingManager
{
	public firstLoad: boolean = true;
	public onFinishedCallback: (() => void) | undefined;

	private world: World;
	private gltfLoader: AMMONodejs.Loaders.GLTFLoader;
	private loadingTracker: LoadingTrackerEntry[] = [];

	constructor(world?: World)
	{
		this.world = world as World;
		this.gltfLoader = new AMMONodejs.Loaders.GLTFLoader();

		if (this.world) {
			this.world.setTimeScale(0);
		}
	}

	public loadGLTF(path: string, onLoadingFinished: (gltf: any) => void): void {
		let trackerEntry = this.addLoadingEntry(path);

		this.gltfLoader.load(path)
			.then((gltf: any) => {
				onLoadingFinished(gltf);
				this.doneLoading(trackerEntry);
			});
	}

	public addLoadingEntry(path: string): LoadingTrackerEntry {
		let entry = new LoadingTrackerEntry(path);
		this.loadingTracker.push(entry);

		return entry;
	}

	public doneLoading(trackerEntry: LoadingTrackerEntry): void {
		trackerEntry.finished = true;
		trackerEntry.progress = 1;

		if (this.isLoadingDone()) {
			if (this.onFinishedCallback !== undefined) {
				this.onFinishedCallback();
			}
		}
	}

	public createWelcomeScreenCallback(scenario: Scenario): void {
		if (this.onFinishedCallback === undefined) {
			this.onFinishedCallback = () => {
				this.world?.update(1, 1);
			};
		}
	}

	private getLoadingPercentage(): number
	{
		let done = true;
		let total = 0;
		let finished = 0;

		for (const item of this.loadingTracker)
		{
			total++;
			finished += item.progress;
			if (!item.finished) done = false;
		}

		return (finished / total) * 100;
	}

	private isLoadingDone(): boolean
	{
		for (const entry of this.loadingTracker) {
			if (!entry.finished) return false;
		}
		return true;
	}
}
