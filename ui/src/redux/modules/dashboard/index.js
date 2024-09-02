import * as blankDashboard from './blankDashboard';
import * as copyDashboard from './copyDashboard';
import * as streamStarter from './streamStarter';
import * as gettingStarted from './gettingStarted';
import * as IsilaDashboard from './islaDashboard';

/*
 * Sagas
 */
/* eslint-disable import/prefer-default-export */
export const sagas = [
  ...blankDashboard.sagas,
  ...copyDashboard.sagas,
  ...streamStarter.sagas,
  ...gettingStarted.sagas,
  ...IsilaDashboard.sagas,
];
