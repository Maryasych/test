import { LoadingTrackerEntry } from './LoadingTrackerEntry';
import { default as AMMONodejs } from '@enable3d/ammo-on-nodejs';
export class LoadingManager {
    firstLoad = true;
    onFinishedCallback;
    world;
    //@ts-ignore
    gltfLoader;
    loadingTracker = [];
    constructor(world) {
        this.world = world;
        this.gltfLoader = new AMMONodejs.Loaders.GLTFLoader();
        if (this.world) {
            this.world.setTimeScale(0);
        }
    }
    loadGLTF(path, onLoadingFinished) {
        let trackerEntry = this.addLoadingEntry(path);
        this.gltfLoader.load(path)
            .then((gltf) => {
            onLoadingFinished(gltf);
            this.doneLoading(trackerEntry);
        });
    }
    addLoadingEntry(path) {
        let entry = new LoadingTrackerEntry(path);
        this.loadingTracker.push(entry);
        return entry;
    }
    doneLoading(trackerEntry) {
        trackerEntry.finished = true;
        trackerEntry.progress = 1;
        if (this.isLoadingDone()) {
            if (this.onFinishedCallback !== undefined) {
                this.onFinishedCallback();
            }
        }
    }
    createWelcomeScreenCallback(scenario) {
        if (this.onFinishedCallback === undefined) {
            this.onFinishedCallback = () => {
                this.world?.update(1, 1);
            };
        }
    }
    getLoadingPercentage() {
        let done = true;
        let total = 0;
        let finished = 0;
        for (const item of this.loadingTracker) {
            total++;
            finished += item.progress;
            if (!item.finished)
                done = false;
        }
        return (finished / total) * 100;
    }
    isLoadingDone() {
        for (const entry of this.loadingTracker) {
            if (!entry.finished)
                return false;
        }
        return true;
    }
}
