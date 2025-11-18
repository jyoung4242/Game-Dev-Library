export class Random {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Linear Congruential Generator
  getRandom(): number {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }

  getRandomFloat(min: number, max: number): number {
    return this.getRandom() * max + min;
  }

  getRandomInteger(min: number, max: number): number {
    return Math.floor(this.getRandom() * max + min);
  }

  pickOne(set: Array<any>): any {
    let rnd = this.getRandom();
    let choice = Math.floor(rnd * set.length);
    return set[choice];
  }

  getSeed() {
    return this.seed;
  }

  pickOneWeighted(set: Array<any>, weights: Array<number>): any {
    if (set.length !== weights.length) throw new Error("set and weights must be the same length");
    let newSet: any[] = [];

    set.forEach((item, index) => {
      const wieghting = weights[index];
      for (let i = 0; i < wieghting; i++) {
        newSet.push(item);
      }
    });
    let rnd = this.getRandom();
    let choice = Math.floor(rnd * newSet.length);
    return newSet[choice];
  }
}
