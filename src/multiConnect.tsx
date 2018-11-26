import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as uuid from 'uuid';
import { Store, Dispatch, bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { addInstance, removeInstance } from './actions';
import { MapStateToProps, MapDispatchToProps, IMultiConnectProps, Omit, IMultiAction } from './namespace';

type MultiComponent<P> = React.ComponentClass<P & IMultiConnectProps>;

const mountedContainersForInstance: { [key: string]: number } = {};

const multiConnect = <IAppReduxState, TReduxState, TStateProps, TDispatchProps, TOwnProps>(
  keyPathToState: Array<keyof IAppReduxState>,
  initialState: TReduxState,
  mapStateToProps: MapStateToProps<IAppReduxState, TReduxState, TStateProps, TOwnProps>,
  mapDispatchToProps?: MapDispatchToProps<TDispatchProps, TOwnProps>,
) => {
  type IWrappedComponentProps = TStateProps & TDispatchProps;
  // tslint:disable-next-line:max-line-length
  return function HOC<TOwn extends TOwnProps & IWrappedComponentProps>(WrappedComponent: React.ComponentType<TOwn>): MultiComponent<Omit<TOwn, keyof IWrappedComponentProps>> {
    type Props = Omit<TOwn, keyof IWrappedComponentProps> & IMultiConnectProps;
    class MultiConnector extends React.PureComponent<Props> {
      public context!: { store: Store<IAppReduxState> };
      public displayName: string = `(MultiConnect) ${WrappedComponent.displayName}`;

      private ConnectedComponent: MultiComponent<TOwn>;
      private instanceKey: string;

      constructor(props: Props, context?: any) {
        super(props, context);

        this.instanceKey = (this.props.instanceKey as string) || uuid.v1();

        const mountedContainers = mountedContainersForInstance[this.instanceKey] || 0;
        mountedContainersForInstance[this.instanceKey] = mountedContainers + 1;

        this.context.store.dispatch(addInstance(this.instanceKey, initialState, keyPathToState));
        this.ConnectedComponent = connect<TStateProps, TDispatchProps, TOwn & IMultiConnectProps>(
          this.mapStateToProps,
          mapDispatchToProps ? this.mapDispatchToProps : null as any,
        )(WrappedComponent);

        this.mapStateToProps = this.mapStateToProps.bind(this);
        this.mapDispatchToProps = this.mapDispatchToProps.bind(this);
        this.actionDecorator = this.actionDecorator.bind(this);
      }

      public componentWillUnmount() {
        const mountedContainers = mountedContainersForInstance[this.instanceKey] || 1;
        mountedContainersForInstance[this.instanceKey] = mountedContainers - 1;

        if (mountedContainers === 1) {
          this.context.store.dispatch(removeInstance(this.instanceKey, keyPathToState));
        }
      }

      public render() {
        const ConnectedComponent = this.ConnectedComponent;
        return <ConnectedComponent instanceKey={this.instanceKey} {...this.props as any} />;
      }

      private mapStateToProps(appState: IAppReduxState, ownProps?: TOwnProps): TStateProps {
        const state = keyPathToState.reduce((prev, cur) => prev ? prev[cur] : prev, appState as any);
        const instanceState = state ? state[this.instanceKey] : {};
        return mapStateToProps(instanceState, appState, ownProps);
      }

      private mapDispatchToProps(dispatch: Dispatch<any>, ownProps?: TOwnProps): TDispatchProps {
        if (!mapDispatchToProps) { return ({} as TDispatchProps); }

        const actions = mapDispatchToProps(this.actionDecorator as any, ownProps);
        return bindActionCreators(actions as any, dispatch);
      }

      private actionDecorator(action: IMultiAction<string>): IMultiAction<string> {
        action._instanceKey = this.instanceKey;
        return action;
      }
    }

    return MultiConnector;
  };
};

export { multiConnect };
