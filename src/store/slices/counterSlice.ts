/* eslint-disable import/no-anonymous-default-export */
import {
  CreateSlice,
  ReducerFunc,
  SliceFuncWrapper,
  SliceFuncReturn,
  Reducer
} from '../store.types';

type DefaultFunc = () => SliceFuncReturn

export interface ICounterSlice {
  increase: DefaultFunc,
  decrease: DefaultFunc,
  count: number
}

const increase: SliceFuncWrapper<ICounterSlice, DefaultFunc> = (
  set, _get,
) => () => {
  set(state => {
    state.count += 1;
  })
  return true;
};
const decrease: SliceFuncWrapper<ICounterSlice, DefaultFunc> = (
  set, _get,
) => () => {
  set(state => {
    state.count -= 1;
  })
  return true;
};


const reset:ReducerFunc<ICounterSlice> = (state, payload) => {
  state.count = payload as number;
};

const createSlice: CreateSlice<ICounterSlice> = (
  set,
  get,
) => ({
  count: 0,
  increase: increase(set, get),
  decrease: decrease(set, get),
});

const _reducers: Record<string, ReducerFunc<ICounterSlice>> = {
  'counter/reset': reset,
};

const reducer:Reducer<ICounterSlice> = (state, { type, payload }, dispatch):void => {
  return _reducers[type] && _reducers[type](state, payload, dispatch);
};

export default {
  createSlice,
  reducer
};
