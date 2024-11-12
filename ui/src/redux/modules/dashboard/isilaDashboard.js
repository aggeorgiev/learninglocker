import { Map } from 'immutable';
import { actions as routerActions } from 'redux-router5';
import { put, call, takeEvery } from 'redux-saga/effects';

import buildTemplateTimeSpent from 'ui/containers/Visualisations/TemplateTimeSpent/buildModel';
import buildTemplateWeekdaysActivity from 'ui/containers/Visualisations/TemplateWeekdaysActivity/buildModel';
import buildTemplateDayhoursActivity from 'ui/containers/Visualisations/TemplateDayhoursActivity/buildModel';
import buildTemplateActivityOverTime from 'ui/containers/Visualisations/TemplateActivityOverTime/buildModel';
import buildTemplateStatementsVsGrades from 'ui/containers/Visualisations/TemplateStatementsVsGrades/buildModel';
import buildTemplateGradesVsTimeSpent from 'ui/containers/Visualisations/TemplateGradesVsTimeSpent/buildModel';
import buildTemplateTimeSpentInQuizActivity from 'ui/containers/Visualisations/TemplateTimeSpentInQuizActivity/buildModel';
import buildTemplateQuizGradesVsTimeSpent from 'ui/containers/Visualisations/TemplateQuizGradesVsTimeSpent/buildModel';
import buildTemplateNumberOfPeople from 'ui/containers/Visualisations/TemplateNumberOfPeople/buildModel';
import buildTemplateNumberOfQuizAttempts from 'ui/containers/Visualisations/TemplateNumberOfQuizAttempts/buildModel';
import buildTemplateNumberOfAssignmentSubmissions from 'ui/containers/Visualisations/TemplateNumberOfAssignmentSubmissions/buildModel';
import buildTemplateNumberOfStatements from 'ui/containers/Visualisations/TemplateNumberOfStatements/buildModel';
import buildTemplateAverageQuizGrade from 'ui/containers/Visualisations/TemplateAverageQuizGrade/buildModel';
import buildTemplateAverageAssignmentGrade from 'ui/containers/Visualisations/TemplateAverageAssignmentGrade/buildModel';
import buildTemplateQuizCompletionProgress from 'ui/containers/Visualisations/TemplateQuizCompletionProgress/buildModel';
import buildTemplateAssignmentCompletionProgress from 'ui/containers/Visualisations/TemplateAssignmentCompletionProgress/buildModel';

import { addModel } from '../models';

export const CREATE_ISILA_DASHBOARD = 'learninglocker/dashboard/CREATE_ISILA_DASHBOARD';

/**
 * @param {(action: object) => null} _.dispatch - react-redux dispatch
 * @param {string} _.userId
 * @returns {Promise<string[]>} - visualisationId list
 */
const createVisualisations = async ({ dispatch, userId }) => {
  const results = await Promise.all([
  
	 dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateNumberOfPeople(new Map({ owner: userId })),
	  isExpanded: false,
	 })),
  
	dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateNumberOfStatements(new Map({ owner: userId })),
	  isExpanded: false,
	})),

	dispatch(addModel({
		schema: 'visualisation',
		props: buildTemplateNumberOfQuizAttempts(new Map({ owner: userId })),
		isExpanded: false,
	})),

	dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateNumberOfAssignmentSubmissions(new Map({ owner: userId })),
	  isExpanded: false,
	})),
	  
	 dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateAverageQuizGrade(new Map({ owner: userId })),
	  isExpanded: false,
	 })),

	 dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateAverageAssignmentGrade(new Map({ owner: userId })),
	  isExpanded: false,
	 })),

	dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateQuizCompletionProgress(new Map({ owner: userId })),
	  isExpanded: false,
	})),

	dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateAssignmentCompletionProgress(new Map({ owner: userId })),
	  isExpanded: false,
	})),  

	dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateActivityOverTime(new Map({ owner: userId })),
	  isExpanded: false,
	})),
  
  	dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateWeekdaysActivity(new Map({ owner: userId })),
	  isExpanded: false,
	})),
 
	dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateDayhoursActivity(new Map({ owner: userId })),
	  isExpanded: false,
	})),

	dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateTimeSpent(new Map({ owner: userId })),
	  isExpanded: false,
	})),

	dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateStatementsVsGrades(new Map({ owner: userId })),
	  isExpanded: false,
	})),

	dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateGradesVsTimeSpent(new Map({ owner: userId })),
	  isExpanded: false,
	})),

	dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateTimeSpentInQuizActivity(new Map({ owner: userId })),
	  isExpanded: false,
	})),

	dispatch(addModel({
	  schema: 'visualisation',
	  props: buildTemplateQuizGradesVsTimeSpent(new Map({ owner: userId })),
	  isExpanded: false,
	})),


  ]);

  return results.map(r => r.model.get('_id'));
};

function* createIsilaDashboard({ userId, organisationId, dispatch }) {
  const visualisationIds = yield call(createVisualisations, { dispatch, userId });

  const { model } = yield call(dispatch, addModel({
    schema: 'dashboard',
    props: {
      owner: userId,
      title: 'ISILA Starter',
      type: 'isilaDashboard',
      isExpanded: true,
      widgets: [
        { x: 0, y: 0, w: 4, h: 4, visualisation: visualisationIds[0] },
        { x: 4, y: 0, w: 4, h: 4, visualisation: visualisationIds[1] },
        { x: 8, y: 0, w: 4, h: 4, visualisation: visualisationIds[2] },
		
        { x: 0, y: 4, w: 4, h: 4, visualisation: visualisationIds[3] },
        { x: 4, y: 4, w: 4, h: 4, visualisation: visualisationIds[4] },
        { x: 8, y: 4, w: 4, h: 4, visualisation: visualisationIds[5] },
		
		{ x: 0, y: 8, w: 6, h: 6, visualisation: visualisationIds[6] },
        { x: 6, y: 8, w: 6, h: 6, visualisation: visualisationIds[7] },
		
        { x: 0, y: 14, w: 6, h: 9, visualisation: visualisationIds[8] },
        { x: 6, y: 14, w: 6, h: 9, visualisation: visualisationIds[9] },
		
        { x: 0, y: 23, w: 6, h: 9, visualisation: visualisationIds[10] },
        { x: 6, y: 23, w: 6, h: 9, visualisation: visualisationIds[11] },
		
        { x: 0, y: 32, w: 6, h: 9, visualisation: visualisationIds[12] },
        { x: 6, y: 32, w: 6, h: 9, visualisation: visualisationIds[13] },
		
        { x: 0, y: 41, w: 6, h: 9, visualisation: visualisationIds[14] },
        { x: 6, y: 41, w: 6, h: 9, visualisation: visualisationIds[15] },

		

      ],
    },
  }));

  yield put(routerActions.navigateTo(
    'organisation.data.dashboards.id',
    {
      organisationId,
      dashboardId: model.get('_id'),
    }
  ));
}

function* watchIsilaDashboardSaga() {
  if (__CLIENT__) yield takeEvery(CREATE_ISILA_DASHBOARD, createIsilaDashboard);
}

export const sagas = [watchIsilaDashboardSaga];
