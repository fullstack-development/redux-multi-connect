import { IAddInstance, IRemoveInstance, KeyPathToState } from './namespace';

export function addInstance(instanceKey: string, initialState: any, key: KeyPathToState[]): IAddInstance {
  const keyPathToState = key.map(key => key.toString());
  return {
    type: '@@MULTI_CONNECT:ADD_INSTANCE',
    payload: { initialState, instanceKey, keyPathToState },
  };
}

export function removeInstance(instanceKey: string, key: KeyPathToState[]): IRemoveInstance {
  const keyPathToState = key.map(key => key.toString());
  return {
    type: '@@MULTI_CONNECT:REMOVE_INSTANCE',
    payload: { instanceKey, keyPathToState },
  };
}
