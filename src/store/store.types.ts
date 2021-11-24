import { State, GetState, SetState, StateCreator } from 'zustand';

// store 相關
export type Action<T> = {
  type:string,
  payload?: T
}

export type CreateSlice<T extends State> = StateCreator<T>;
export type Dispatcher = (action:Action<unknown>) => Action<unknown>;

// 用來 createSlice 打包 function 用的 type, 省的寫一堆, 並提供 dispatch
export type SliceFuncWrapper<T extends State, F> = (set:SetState<T>, get: GetState<T & {
  dispatch?: Dispatcher
}>, ...args: any[]) => F

export type Reducer<T extends State> = (
  state: T,
  action: Action<unknown>,
  dispatch: Dispatcher) => void;

export type ReducerFunc<T extends State> = (
  state: T,
  payload:unknown,
  dispatch: Dispatcher) => void;

// 統一 slice 內的 function 回傳一致
// 第一時間 return false 等於 function 不需要執行
export type SliceFuncReturn = Promise<boolean> | boolean;

// https://stackoverflow.com/questions/55479658/how-to-create-a-type-excluding-instance-methods-from-a-class-in-typescript
type NoneTypeNames<T, B> = {
  [K in keyof T]: T[K] extends B ? never : K;
}[keyof T];

// eslint-disable-next-line @typescript-eslint/ban-types
export type NoneFunc<T> = Pick<T, NoneTypeNames<T, Function>>;
// eslint-disable-next-line @typescript-eslint/ban-types
export type NoneProps<T> = Omit<T, NoneTypeNames<T, Function>>;
//

export type ExtraReducer<T extends State> = (
  state: NoneFunc<T>,
  action: Action<unknown>,
  dispatch: Dispatcher) => void;

export type ExtraReducerFunc<T extends State> = (
    state: NoneFunc<T>,
    payload:unknown,
    dispatch: Dispatcher) => void;
