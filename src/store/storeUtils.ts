/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  State,
  StoreApi,
  SetState,
  GetState,
  StateCreator,
  UseBoundStore } from 'zustand';

import produce, { Draft } from 'immer';
import { Action, Dispatcher } from './store.types';
import { storeActions } from './actions';
import shallow from 'zustand/shallow';

const log = (...args:any[]): void => {
  if (process.env.APP_ENV !== 'production') console.log(...args);
};

// https://codesandbox.io/s/7w1pu?file=/src/store.ts
export const immer = <T extends State>(
  config: StateCreator<T, (fn: (draft: Draft<T>) => void) => void>
): StateCreator<T> => (set, get, api) =>
    config((fn) => set(produce<T>(fn)), get, api);


const isPromise = (v:unknown) => v && Object.prototype.toString.call(v) === '[object Promise]';

const createRecordAction = (key:string, payload: 'executed' | 'done' | 'faild') => {
  return {
    type: 'record/' + key,
    payload
  };
};

type AnyFn = (...args: any[]) => any;
const turboWrapper = <Fn extends AnyFn>(
  key:string,
  fn: Fn, dispatch: Dispatcher
): ((...args: Parameters<Fn>) => ReturnType<Fn>) => {
  const wrappedFn = (...args: Parameters<Fn>): ReturnType<Fn> => {
    const result = fn(...args);
    // 基本上 slice action 都會 return boolean, false === 沒有執行
    if (result) dispatch(createRecordAction(key, 'executed'));
    if (isPromise(result)) {
      let status: 'executed' | 'done' | 'faild' = 'faild';
      return result
        .then((res: any) => {
          if (res !== undefined && res !== false) status = 'done'; // 基本上成功都有回傳 true
          return res;
        })
        .catch((e:any) => {
          log(e);
          const { body, message, type, name, payload } = e;
          dispatch({
            type: `error${type ? '/' + type : ''}`,
            payload: {
              message,
              title: body?.title || name || '',
              payload
            } });
          return Promise.resolve(false);
        })
        .finally(() => {
          dispatch(createRecordAction(key, status));
        });
    }
    return result;
  };
  return wrappedFn;
};

export const createError = (message:string, { name = '', payload, type = 'request' }:{
  type?:string,
  name?:string
  payload?:State,
}): Error => {
  const error = new Error(message);
  Object.assign(error, {
    name, payload, type
  });
  return error;
};

const logColor:Record<string, string> = {
  error: 'background: #FF4769; color: #fff',
  record: 'background: #304ffe; color: #fff',
  service: 'background: #bcaaa4; color: #000',
  default: 'background: #FFDE03; color: #000',
  store: 'background: #00c853; color: #000'
};

// 加強版 redux middleware
export const reduxEX =
  <S extends State>(
    reducer: (state: S, action: Action<unknown>, dispatch: Dispatcher) => void,
    initial: S
  ) =>
    (
      set: SetState<S>,
      get: GetState<S>,
      api: StoreApi<S> & {
        dispatch: Dispatcher,
        devtools?: any
      }
    ): S & { dispatch: Dispatcher } => {
      api.dispatch = (action: Action<unknown>) => {
        const { type, payload } = action;
        //@ts-ignore
        const prop: any = get()[type];
        if (prop && typeof prop === 'function') {
        // payload is an array as function args
          log(`%c call store action ${type}`, 'background: #bada55; color: #000', payload);
          const args = payload || [];
          if (!Array.isArray(args)) {
            console.error('The payload type for store action must be an array as function arguments');
          } else {
            prop(...(args as Array<unknown>));
          }
        } else {
          const [name] = type.split('/');
          const color = logColor[name];
          if (color) {
            log(`%c ${type}`, color, payload);
          } else {
            log(`%c ${type}`, logColor.default, payload);
          }
          // 裝 immer 不用 return
          set(state => {
            reducer(state, action, api.dispatch);
          });
        }

        const isProd = process.env.APP_ENV === 'production';
        const debug = isProd && !!(new URL(window.location.href || '').searchParams.get('__xray__'));
        if (api.devtools && (!isProd || debug)) {
          api.devtools.send(api.devtools.prefix + action.type, { payload: action.payload, state: get() });
        }

        return action;
      };
      const state:S = Object.entries(initial).reduce((obj, [k, v]) => {
        if (typeof v === 'function') return { ...obj, [k]: turboWrapper(k, v, api.dispatch) };
        return { ...obj, [k]: v };
      }, {}) as S;

      return { dispatch: api.dispatch, ...state };
    };

export function subscribeStateChange<T>(store:UseBoundStore<T & { dispatch: Dispatcher}>):(() => void)[] {
  const states = store.getState();
  const names = (Object.keys(states) as Array<keyof typeof states>).filter(k => typeof (states[k]) !== 'function');
  const dispatch = states.dispatch;
  return names.map(name => {
    return store.subscribe(() => {
      dispatch({
        type: storeActions.stateChanged,
        payload: name
      });
      //@ts-ignore
    }, (s) => s[name], shallow);
  });
}

export const storeActionToPromise = (func: () => Promise<boolean> | boolean):Promise<boolean> => {
  const result = func();
  if (isPromise(result)) return result as Promise<boolean>;
  else return Promise.resolve(false);
}
;