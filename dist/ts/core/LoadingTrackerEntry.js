export class LoadingTrackerEntry {
    path;
    progress = 0;
    finished = false;
    constructor(path) {
        this.path = path;
    }
}
