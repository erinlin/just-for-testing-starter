/**
 * 主要是模擬無聊的
 * - 按了 5 次出現亂數重置 count 數字的外掛功能
 */
import { IDemoStore } from '../store';
import { ExtraReducer, ExtraReducerFunc } from '../store.types';
import { counterActions, storeActions } from '../actions';

type OuterFunc = ExtraReducerFunc<IDemoStore>
let times = 0;

const justForFun:OuterFunc = (_state, _payload, dispatch) => {
  times += 1;
    if(times > 4) {
      dispatch({
        type: counterActions.reset,
        payload: Math.floor(Math.random() * 100) - 50
      })
      alert('來擾亂了～～亂數重置count~~')
    }
}

const extraTestReducer:ExtraReducer<IDemoStore> = (
  state, { type, payload }, dispatch
):void => {
  if( type === counterActions.reset ){
    times = -1;
  }else if(type === storeActions.stateChanged && payload === 'count' ) {
    justForFun(state, payload, dispatch)
  }
};
export default extraTestReducer;
