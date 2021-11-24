/**
 * 目前 slice action is promise 會統一 catch, 沒必要特別處理的都不需要接 catch
 */

import { cloneDeep } from 'lodash';

import create, {
  GetState,
  SetState,
  State,
  StoreApi,
} from 'zustand';

import { devtools } from 'zustand/middleware';

import { immer, reduxEX } from './storeUtils';

import {
  counter,
} from './slices';

import {
  Action,
  Dispatcher,
  Reducer,
  NoneFunc,
  CreateSlice,
  NoneProps
} from './store.types';
import { delayPromise } from './utils';

const delayCall = delayPromise(0);

export interface IDemoStore extends
  ReturnType<typeof counter.createSlice> {
  dispatch: Dispatcher
}

const allReducers = [
  counter,
].filter(slice => slice.reducer)
  .map(slice => slice.reducer);

let extraReducer:Reducer<NoneFunc<IDemoStore>>[] = [];

// 可額外註冊, 不需要加入 Slice, 但是只能用 dispatch 作通知
export const suscribeReadonlyReducer = (reducer:Reducer<NoneFunc<IDemoStore>>):()=>void => {
  extraReducer = extraReducer.filter(f => f !== reducer);
  extraReducer.push(reducer);

  return () => {
    extraReducer = extraReducer.filter(f => f !== reducer);
  };
};

// 串接 checkout sdk
// 用來模擬 extraReducer 功能
const reducer = (state:IDemoStore, action:Action<unknown>, dispatch:Dispatcher) => {
  // zustand get set 會再下一次才會更新，所以需要 delay call
  // 沒有 delay 的話如果 function 使用 set or get 就會失效
  const delayDispatch = (action:Action<unknown>) => {
    delayCall()
      .then(() => dispatch(action));
    return action;
  };
  // 這邊的 state 是 Proxy
  // 不需要 pass record to slices
  if (action.type.indexOf('record/') < 0) {
    allReducers.forEach(reducer => reducer(state, action, delayDispatch));
  }
  //@ts-ignore
  if (state[action.type]) return; // slice action 不往下 pass
  // 差別是額外註冊的只能透過 slice 提供的 action 來更新 state
  // 這邊的 filterState 是 clone object, 狀態是最新的
  // extraReducer 會發生在當下 action 所有 state 都更新過才會呼叫
  const pickState = cloneDeep(state) as Record<string, any>;
  const filterState = Object.keys(pickState)
    .filter(k => typeof (pickState[k]) !== 'function')
    .reduce((obj, k) => ({ ...obj, [k]: pickState[k] }), {}) as NoneFunc<IDemoStore>;

  // console.log('%c state:', 'background: #000; color: #bada55', filterState);
  extraReducer.forEach(reducer => reducer(filterState, action, delayDispatch));
};

function splitSlice<T extends State>(
  sliceCreator: CreateSlice<T>,
  set:unknown,
  get:unknown,
  api:unknown): T {
  return sliceCreator(set as SetState<T>, get as GetState<T>, api as StoreApi<T>) as T;
}

const createStore = () => {
  return create<IDemoStore>(
    devtools(
      immer((set, get, api) => {
        const initState = {
          // ...splitSlice(staticRes.createSlice, set, get, api),
          ...splitSlice(counter.createSlice, set, get, api),
        } as IDemoStore;
        // @ts-ignore
        return reduxEX(reducer, initState)(set, get, api);
      })
    )
  );
};

export const useDemoStore = createStore();

type StoreActionName = keyof Omit<NoneProps<IDemoStore>, 'dispatch'>;

// store action creator
export const createStoreAction = (
  type: StoreActionName,
  payload: Array<unknown> | undefined = []
) :Action<unknown> => {
  return {
    type,
    payload
  };
};
