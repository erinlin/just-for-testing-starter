
/* eslint-disable @typescript-eslint/ban-types */

export const hasKey = (key: string|number|symbol, target:object): key is keyof typeof target => {
  return key in target;
};

/**
 * 比對 object value 有沒有被改變
 * @param origin
 * @param compaireFunc - default is json ===
 * @returns boolean
 */
 export function compaire<T, O>(a:T, b:O):boolean {
  if (typeof a === 'object' || typeof b === 'object') return JSON.stringify(a) === JSON.stringify(b);
  return a === (b as unknown as T);
}

export function compaireStates<T, O extends T>(
  origin: T | O, compaireFunc?:(prev:T | O, next:T | O) => boolean):((compaire: T | O) => boolean) & { getValue: () => T|O } {
  let cacheOrigin: T | O = origin;
  const func = compaireFunc || compaire;

  const result = (input: T | O) => {
    const result = func(cacheOrigin, input);
    cacheOrigin = input;
    return result;
  };
  result.getValue = ():T|O => cacheOrigin;
  return result;
}

export const delayPromise = (ms: number): () => Promise<void> => {
  return () => new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

// 不同於 loash debounce 打包方式
// ex. const callLater = debounce(10)
// callLater(callback) 就是 10 ms 以內最後只有一個 callback be called
// 所以 callback 可以一直更新
export const debounce = (wait: number):(callback: () => void) => void => {
  let timeId: ReturnType<typeof setTimeout> | null = null;
  const result = (callback: () => void) => {
    if (timeId) clearTimeout(timeId);
    timeId = null;
    timeId = setTimeout(callback, wait);
  };

  result.cancel = () => (timeId) && clearTimeout(timeId);
  return result;
};

//  callback 可以一直更新
export const throttle = (wait: number):(callback: () => void) => void => {
  let timeId: ReturnType<typeof setTimeout> | null = null;
  let cb:(() => void) | null = null;
  const callCb = () => cb && cb();
  const result = (callback: () => void) => {
    cb = callback;
    if (timeId) return;
    timeId = setTimeout(() => {
      callCb();
      timeId = null;
      cb = null;
    }, wait);
  };

  result.cancel = () => (timeId) && clearTimeout(timeId);
  return result;
};

// https://stackoverflow.com/questions/45444601/promise-retries-until-success-failure-with-typescript
export async function retryPromise<T>(fn: () => Promise<T>, retries = 5, interval = 100, err?: any): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, (5 - retries) * interval));
  return !retries ? Promise.reject(err) : fn().catch(error => retryPromise(fn, (retries - 1), error));
}

export const executable = (wait: number):() => boolean => {
  let timeId: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timeId) return false;
    timeId = setTimeout(() => {
      timeId = null;
    }, wait);
    return true;
  };
};

// https://stackoverflow.com/questions/8860188/javascript-clear-all-timeouts
export function clearAllSettimer(windowObject:any) {
  let id:number = windowObject.setTimeout(noop, 1000) as number;

  while (id--) {
    windowObject.clearTimeout(id);
    windowObject.clearInterval(id);
  }

  function noop() {
    return false;
  }
}

