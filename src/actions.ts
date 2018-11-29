import { IAddInstance, IRemoveInstance, KeyPathToState } from './namespace';

export function addInstance(instanceKey: string, initialState: any, keyPathToState: KeyPathToState[]): IAddInstance {
  return {
    type: '@@MULTI_CONNECT:ADD_INSTANCE',
    payload: { initialState, instanceKey, keyPathToState },
  };
}

export function removeInstance(instanceKey: string, keyPathToState: KeyPathToState[]): IRemoveInstance {
  return {
    type: '@@MULTI_CONNECT:REMOVE_INSTANCE',
    payload: { instanceKey, keyPathToState },
  };
}
