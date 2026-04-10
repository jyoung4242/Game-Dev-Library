import { Future, Loadable, Scene, Sound, WebAudio, Util } from "excalibur";

export class DefaultSceneLoader extends Scene {
  _resources: Loadable<any>[] = [];
  _isLoading = false;
  _loaded = false;
  public isLoaded() {
    return this._loaded || this._resources.length === 0;
  }

  _percent = 0;
  _progress = 0;
  _index = 0;
  _promises: Promise<void>[] = [];
  _numLoaded = 0;

  _loaderCompleteFuture!: Future<Loadable<any>[]>;
  _resourcesLoadedFuture = new Future<void>();
  data!: Loadable<any>[];

  constructor(resources: any) {
    super();
    this._resources = Object.values(resources);
    this.load();
  }

  public async load(): Promise<Loadable<any>[]> {
    if (this._isLoading) {
      return this._loaderCompleteFuture.promise;
    }
    if (this.isLoaded()) {
      // Already loaded quick exit
      return (this.data = this._resources);
    }
    this._isLoading = true;
    this._loaderCompleteFuture = new Future();
    await this.onBeforeLoad();
    this.events.emit("beforeload");
    // this.canvas.flagDirty();

    await Promise.all(
      this._resources
        .filter(r => {
          return !r.isLoaded();
        })
        .map(async r => {
          this.events.emit("loadresourcestart", r);
          await r.load().finally(() => {
            // capture progress
            this._numLoaded++;
            // this.canvas.flagDirty();
            this.events.emit("loadresourceend", r);
          });
        }),
    );

    // Wire all sound to the engine
    for (const resource of this._resources) {
      if (resource instanceof Sound) {
        resource.wireEngine(this.engine);
      }
    }

    this._resourcesLoadedFuture.resolve();
    // this.canvas.flagDirty();
    // Unlock browser AudioContext in after user gesture
    // See: https://github.com/excaliburjs/Excalibur/issues/262
    // See: https://github.com/excaliburjs/Excalibur/issues/1031
    await this.onUserAction();
    this.events.emit("useraction");
    await WebAudio.unlock();

    await this.onAfterLoad();
    this.events.emit("afterload");
    this._isLoading = false;
    this._loaded = true;
    this._loaderCompleteFuture.resolve(this._resources);
    return (this.data = this._resources);
  }

  public async onUserAction(): Promise<void> {
    // short delay in showing the button for aesthetics
    await Util.delay(200, this.engine?.clock);
    await this.showPlayButton();
  }

  public async onBeforeLoad(): Promise<void> {}

  // eslint-disable-next-line require-await
  public async onAfterLoad(): Promise<void> {
    this.dispose();
  }

  showPlayButton(): Promise<void> {
    return new Promise(resolve => {});
  }

  public dispose() {}

  public addResource(loadable: Loadable<any>) {
    this._resources.push(loadable);
    this._loaded = false;
  }
}
