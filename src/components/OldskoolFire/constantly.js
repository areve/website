/* eslint-disable */

class Constantly {
  constructor(callsPerSecond = 0) {
    this.callsPerSecond = callsPerSecond;
    this.interval = this.callsPerSecond <= 50 && this.callsPerSecond !== 0 ? 20 : 0;
    this._isDestroyed = false;
  }
  
  destroy() {
    this._isDestroyed = true;
    clearTimeout(self.timer);    
  }

  each(callback) {
    const batchYieldTime = 20;
    const startTime = new Date().getTime();
    
    this.callCount = 0;
    const batch = () => {
      const batchStartTime = new Date().getTime();
      while (!this._isDestroyed) {
        const now = new Date().getTime();
        if (this.callsPerSecond !== 0) {
          const maxRuns = (now - startTime) * this.callsPerSecond / 1000; 
          if (this.callCount >= maxRuns) break;
        }
        
        if (now - batchStartTime > batchYieldTime) break;
        callback();
        this.callCount++;
      }

      const preventCatchUp = () => {
        const now = new Date().getTime();
        const maxRuns = (now - startTime) * this.callsPerSecond / 1000;
        if (this.callCount < maxRuns) {
          this.callCount = maxRuns;
        }  
      }

      preventCatchUp();
  
      if (!this._isDestroyed)
        this.timer = setTimeout(batch, this.interval);        
    }

    batch();
  }
}

function constantly(callback, callsPerSecond) {
  const constantly = new Constantly(callsPerSecond);
  constantly.each(callback);
  return constantly;
}

export { constantly, Constantly };
