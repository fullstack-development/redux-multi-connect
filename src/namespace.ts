import { Dispatch } from 'redux';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface IMultiAction<T = string> {
  _instanceKey?: string;
  type: T;
}

export interface IMultiConnectProps {
  instanceKey?: string;
}

export interface IMultiInstanceState<TReduxState> {
  [instanceKey: string]: TReduxState;
}

export interface IAddInstance {
  type: '@@MULTI_CONNECT:ADD_INSTANCE';
  payload: {
    instanceKey: string,
    initialState: any,
    keyPathToState: KeyPathToState[],
  };
}

export interface IRemoveInstance {
  type: '@@MULTI_CONNECT:REMOVE_INSTANCE';
  payload: {
    instanceKey: string,
    keyPathToState: KeyPathToState[],
  };
}

export type Action = IAddInstance | IRemoveInstance;

export type KeyPathToState = string | number | symbol;

export type ReactComponent<TProps> = React.ComponentClass<TProps> | React.StatelessComponent<TProps>;

export type MapToState<TReduxState> = (state: any) => IMultiInstanceState<TReduxState>;

// tslint:disable-next-line:max-line-length
export type MapStateToProps<IAppReduxState, TReduxState, TStateProps, TOwnProps> = (state: TReduxState, appState?: IAppReduxState, ownProps?: TOwnProps) => TStateProps;

// tslint:disable-next-line:max-line-length
export type MapDispatchToProps<TDispatchProps, TOwnProps> = (dispatch: Dispatch<any>, ownProps?: TOwnProps) => TDispatchProps;
