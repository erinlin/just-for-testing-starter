import React from 'react';
import extraTestReducer from './store/extra-reducers/extraTestReducer';
import { useDemoStore, suscribeReadonlyReducer } from './store/store';
import { subscribeStateChange } from './store/storeUtils';
import { clearAllSettimer } from './store/utils';

export default function App() {

  const ref = React.useRef<(() => void)>();

  React.useEffect(() => {
    ref.current = suscribeReadonlyReducer(extraTestReducer);
  }, []);

  const {
    count,
    increase, 
    decrease
  } = useDemoStore();

  React.useEffect(() => {
    const listeners = subscribeStateChange(useDemoStore);
    return () => {
      clearAllSettimer(window);
      listeners.forEach(fn => fn());
      useDemoStore.destroy();
    };
  }, []);

  return (
    <div className="App mt-5">
      <h1 className="text-5xl font-black text-center">Hello Zustand Store</h1>
      <h2  className="text-2xl text-indigo-800 text-center">Count: {count}</h2>
      
      <div className="flex w-50 justify-center mt-5">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full mr-5" onClick={increase}>increase</button>
          <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full mr-5"  onClick={decrease}>decrease</button>
          <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"  onClick={() => ref.current && ref.current()}>不要鬧了</button>
      </div>
    </div>
  );
}
