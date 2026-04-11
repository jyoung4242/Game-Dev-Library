import { Future, Loadable, Scene, Sound, WebAudio, Util, SceneActivationContext } from "excalibur";

export interface DefaultSceneLoaderOptions {
  suppressPlayButton?: boolean;
  nextScene?: string;
}

export class DefaultSceneLoader extends Scene {
  private _resourceReferences: Record<string, Loadable<any>> | Loadable<any>[] = {};
  private _resources: Loadable<any>[] = [];
  private _loadedResources = new Set<Loadable<any>>();
  private _isLoading = false;
  private _audioContextUnlocked = false;
  private _loaderCompleteFuture: Future<Loadable<any>[]> | null = null;
  private _options: DefaultSceneLoaderOptions;

  constructor(resources: Record<string, Loadable<any>> | Loadable<any>[] = {}, options: DefaultSceneLoaderOptions = {}) {
    super();
    this._options = options;
    const resourceList = Array.isArray(resources) ? resources : Object.values(resources);
    this._resources = resourceList;
    this._resourceReferences = resources;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  public isLoaded(): boolean {
    return this._resources.every(r => this._loadedResources.has(r));
  }

  public get progress(): number {
    if (this._resources.length === 0) return 1;
    return this._loadedResources.size / this._resources.length;
  }

  /**
   * Load all resources not yet loaded. Safe to call multiple times —
   * concurrent calls coalesce onto the in-flight promise, and once that
   * batch completes a subsequent call will only load newly added resources.
   */
  public async load(): Promise<Loadable<any>[]> {
    // Coalesce concurrent calls onto the in-flight batch
    if (this._isLoading && this._loaderCompleteFuture) {
      return this._loaderCompleteFuture.promise;
    }
    const pending = this._resources.filter(r => !this._loadedResources.has(r) && !r.isLoaded());

    if (pending.length === 0) {
      return this._resources;
    }

    this._isLoading = true;
    this._loaderCompleteFuture = new Future();

    const isInitialLoad = this._loadedResources.size === 0;
    console.log(isInitialLoad);

    await this.onBeforeLoad(pending, isInitialLoad);
    this.events.emit("beforeload", { resources: pending, isInitialLoad });

    await Promise.all(
      pending.map(async r => {
        this.events.emit("loadresourcestart", r);
        try {
          await r.load();
        } finally {
          this._loadedResources.add(r);
          this.events.emit("loadresourceend", r);
        }
      }),
    );

    // Wire sounds to the engine
    for (const resource of pending) {
      if (resource instanceof Sound) {
        resource.wireEngine(this.engine);
      }
    }

    // Only prompt for user action / unlock audio on the initial load
    if (isInitialLoad) {
      await this.onUserAction();
      this.events.emit("useraction");
      await WebAudio.unlock();
      this._audioContextUnlocked = true;
    }

    await this.onAfterLoad(pending, isInitialLoad);
    this.events.emit("afterload", { resources: pending, isInitialLoad });

    if (isInitialLoad) {
      this.onInitialLoadComplete();
    }

    this._isLoading = false;
    this._loaderCompleteFuture.resolve(this._resources);
    this._loaderCompleteFuture = null;

    return this._resources;
  }

  override async onActivate(ctx: SceneActivationContext) {
    //renew this._resources from the references in case they were added to after construction
    if (!Array.isArray(this._resourceReferences)) {
      this._resources = Object.values(this._resourceReferences);
    } else {
      this._resources = this._resourceReferences;
    }
    await this.load();
  }

  // -------------------------------------------------------------------------
  // Overridable hooks
  // -------------------------------------------------------------------------

  public async onBeforeLoad(_pending: Loadable<any>[], _isInitialLoad: boolean): Promise<void> {}

  public async onAfterLoad(_loaded: Loadable<any>[], isInitialLoad: boolean): Promise<void> {
    if (isInitialLoad) {
      this.dispose();
    }
  }

  public async onUserAction(): Promise<void> {
    await Util.delay(200, this.engine?.clock);
    await this.showPlayButton();
  }

  /** Called once after the very first load batch completes. Override to trigger scene transition etc. */
  public onInitialLoadComplete(): void {}

  public showPlayButton(): Promise<void> {
    return new Promise(resolve => {});
  }

  public dispose(): void {}
}
