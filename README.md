# redux-multi-connect
Allows each feature when connecting to the redux-store to receive its own branch in the state.

## Motivation
When connected to the redux-store, each feature receives its own personal branch in the state. Sometimes we want to use the same feature several times on the same page, and the task of paralleling a state comes up.

A striking example is the feature geo-selector. Through this feature, the user enters into the form geo-data and there can be several geo-selectors on the form at the same time. Each instance should store the data entered by the user, validate them, make asynchronous requests for the lists of countries/cities/streets and monitor the status of these requests.
### Possible solutions to this problem:
* rejection of redux and transfer of redux logic to the react-container and its local state. As a result, we get a jumble of state, logic for updating state and views. The question of processing asynchronous requests will remain open;
* use redux, but the state features split into indices / instances of the react-containers, so each drawn container will work with its own branch of the state. In order to ensure the correct operation of several instances of a feature, we need to mark all actions with keys, respectively, we will have to rewrite all action-creators, reduction gears, selectors and sagas so that they take into account the key and understand which key of the state needs to work. Perhaps the first time to solve this problem will be interesting, but after the second time it will become a routine;
* use the already written multiConnect helper;
## Installation
```sh
npm install @fsd/redux-multi-connect --save
```
```sh
yarn add @fsd/redux-multi-connect
```
## API
This helper takes on the responsibility of parallelizing the state features and allows you to quickly make a multi-instance feature out of a regular feature and vice versa.
`reducer(state: any, action: Action)` - an auxiliary reducer to be connected to the redux-store. Creates and deletes feature instance branches.

`multiReducer(reducer: Reducer<IReduxState>)` - decorator, in which you need to wrap the reducer features. Controls the operation of the feature reducer on the state branches for specific instances.

`<IAppReduxState, TReduxState, TStateProps, TDispatchProps, TOwnProps>multiConnect` - HOC, which is used instead of `connect`, accepts the same parameters:
```typescript
keyPathToState: Array<keyof IAppReduxState>,
initialState: TReduxState,
mapStateToProps: MapStateToProps<IAppReduxState, TReduxState, TStateProps, TOwnProps>,
mapDispatchToProps?: MapDispatchToProps<TDispatchProps, TOwnProps>,
```

`IMultiConnectProps` - used to typify the container's `props` in case an instance key is needed inside the container.

`IMultiInstanceState<T>` - used to typify the state of the entire application, adding multi instances of features to it.
## Usage
1. We connect the reducer to the redux-store in any convenient way.
2. Wrap the state features inside `IAppReduxState` in the `IMultiInstanceState` interface.
```typescript
export interface IAppReduxState {
  selectGeo?: IMultiInstanceState<selectGeoNamespace.IReduxState>;
  ...
}
```
3. Wrap a reducer features in `multiReducer`.
```typescript
export default (
  multiReducer(
    combineReducers({
      data: dataReducer,
      edit: editReducer,
      communication: communicationReducer,
    }),
  )
);
```
4. Replace connect with `multiConnect`, to which we pass the path to the state feature, the initial state feature, `mapStateToProps` relatively to the state feature and `mapDispatchToProps`.
```typescript
// here unchanged
function mapDispatchToProps(dispatch: Dispatch<any>): IActionProps {
  return bindActionCreators({
    loadCountries: actions.loadCountries,
    loadCities: actions.loadCities,
    ...
  }, dispatch);
}

// the first argument takes the state features, the remaining arguments are moved
function mapStateToProps(state: IReduxState, appState: IAppReduxState, ownProps: IOwnProps): IStateProps {
  const cities = selectors.selectCities(state, locale);
  ...

  return { cities, ... };
}

type IProps = IActionProps & IStateProps & IOwnProps & IMultiConnectProps;

class GeoSelector extends React.PureComponent<IProps, {}> {
  ...
}

export default (
  multiConnect(['selectGeo'], initialState, mapStateToProps, mapDispatchToProps)(
    GeoSelector,
  )
);
```
5. Rewriting selectors with respect to state features, since `mapStateToProps` now accepts a feature instance instance.
6. If there are sagas in the feature and action games are displayed in them, then these actions must be supplemented with the `_instanceKey` field, the value of which can be obtained from the action intercepted by the saga.
```typescript
// the action interface is inherited from IMultiAction in one of the ways
interface ILoadCities extends IMultiAction {
  type: 'SELECT_GEO:LOAD_CITIES';
  payload: IGeoCountry;
}

type ILoadCities<T = 'SELECT_GEO:LOAD_CITIES'> = IAction<T, IGeoCountry> & IMultiAction<T>

// we take from the caught action _instanceKey
function* loadCities({ api }: IDependencies, { payload: country, _instanceKey }: ILoadCities) {
  try {
    const cities: IGeoCity[] = yield call(api.geo.loadCities, country);
    yield put({ ...actions.loadCitiesSuccess(cities), _instanceKey }); // supplement the action with the _instanceKey
  } catch (error) {
    const msg = getMessage(error);
    yield put({ ...actions.loadCitiesFail(msg), _instanceKey }); // supplement the action with the _instanceKey
  }
}
```
At the time the container is drawn, the instance is created in the redux stack. The key by which the instance state will be available is automatically generated at the time of drawing, but it is possible to set this key from the outside, passing the `instanceKey`.
### Is it possible to make two containers work with one branch of state?
Yes. It is necessary to generate the key in the common ancestor of the containers of the features, and transfer it to the instanceKey to the containers of interest to us. This will prevent automatic key generation, on the first mount an instance branch will be created in redux stete, on the last unmount this branch will be deleted.
```typescript
import { SearchPanel, SearchPaginator } from 'features/search';

const SEARCH_KEY: string = 'search-in-main-page';

class MainPage extends React.PureComponent<Props, {}> {
  public render() {
    return (
      <div>
        <SearchPanel instanceKey={SEARCH_KEY} />
        ...
        <SearchPaginator instanceKey={SEARCH_KEY} />
      </div>
    );
  }
}
```
