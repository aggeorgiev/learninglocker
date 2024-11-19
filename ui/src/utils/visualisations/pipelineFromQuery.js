import { Map, fromJS } from 'immutable';
import { memoize } from 'lodash';
import {
  LEADERBOARD,
  XVSY,
  STATEMENTS,
  FREQUENCY,
  COUNTER,
  PIE,
  HEATMAP,
  TEMPLATE_ACTIVITY_OVER_TIME,
  TEMPLATE_LAST_7_DAYS_STATEMENTS,
  TEMPLATE_MOST_ACTIVE_PEOPLE,
  TEMPLATE_MOST_POPULAR_ACTIVITIES,
  TEMPLATE_MOST_POPULAR_VERBS,
  TEMPLATE_WEEKDAYS_ACTIVITY,
  TEMPLATE_STREAM_INTERACTIONS_VS_ENGAGEMENT,
  TEMPLATE_STATEMENTS_VS_GRADES,
  TEMPLATE_GRADES_VS_TIMESPENT,
  TEMPLATE_STREAM_COMMENT_COUNT,
  TEMPLATE_STREAM_LEARNER_INTERACTIONS_BY_DATE_AND_VERB,
  TEMPLATE_STREAM_USER_ENGAGEMENT_LEADERBOARD,
  TEMPLATE_STREAM_PROPORTION_OF_SOCIAL_INTERACTIONS,
  TEMPLATE_STREAM_ACTIVITIES_WITH_MOST_COMMENTS,
  TEMPLATE_LEARNING_EXPERIENCE_TYPE,
  TEMPLATE_TIME_SPENT,
  TEMPLATE_DAYHOURS_ACTIVITY,
  TEMPLATE_TIMESPENT_QUIZ_ACTIVITY,
  TEMPLATE_QUIZ_GRADES_VS_TIMESPENT,
  TEMPLATE_NUMBER_OF_PEOPLE,
  TEMPLATE_NUMBER_OF_QUIZ_ATTEMPTS,
  TEMPLATE_NUMBER_OF_ASSIGNMENT_SUBMISSIONS,
  TEMPLATE_NUMBER_OF_STATEMENTS,
  TEMPLATE_AVG_QUIZ_GRADE,
  TEMPLATE_AVG_ASSIGNMENT_GRADE,
  TEMPLATE_QUIZ_COMPLETION_PROGRESS,
  TEMPLATE_ASSIGNMENT_COMPLETION_PROGRESS,
  TEMPLATE_ACTIVITY_LEVEL_BY_WEEK
} from 'lib/constants/visualise';
import { update$dteTimezone } from 'lib/helpers/update$dteTimezone';
import { periodToDate } from 'ui/utils/dates';
import aggregateChart from 'ui/utils/visualisations/aggregateChart';
import aggregateCounter from 'ui/utils/visualisations/aggregateCounter';
import aggregateXvsY from 'ui/utils/visualisations/aggregateXvsY';

/**
 * build pipeline from query
 *
 * @param {immutable.Map} args - optional (default is empty Map)
 */
export default memoize((args = new Map()) => {
  const previewPeriod = args.get('previewPeriod');
  const timezone = args.get('timezone');
  const currentMoment = args.get('currentMoment');

  let previewPeriodMatch = [{ $match: {
    timestamp: { $gte: { $dte: periodToDate(previewPeriod, timezone, currentMoment).toISOString() } }
  } }];

  if (args.get('benchmarkingEnabled')) {
    const previousStartDate = periodToDate(previewPeriod, timezone, currentMoment, 2).toISOString();
    previewPeriodMatch = [{ $match: {
      timestamp: { $gte: { $dte: previousStartDate }, $lte: { $dte: periodToDate(previewPeriod, timezone, currentMoment).toISOString() } }
    } }];
  }

  const query = args.getIn(['query', '$match'], new Map());
  // Set timezone of When filters (timestamp and stored)
  const offsetFixedQuery = update$dteTimezone(query, timezone);
  const queryMatch = offsetFixedQuery.size === 0 ? [] : [{ $match: offsetFixedQuery }];

  const preReqs = fromJS(previewPeriodMatch.concat(queryMatch));

  const type = args.get('type');
  const axes = args.get('axes');

  switch (type) {
    case LEADERBOARD:
    case PIE:
    case HEATMAP:
    case STATEMENTS:
    case FREQUENCY:
    case TEMPLATE_ACTIVITY_OVER_TIME:
    case TEMPLATE_MOST_ACTIVE_PEOPLE:
    case TEMPLATE_MOST_POPULAR_ACTIVITIES:
    case TEMPLATE_MOST_POPULAR_VERBS:
    case TEMPLATE_WEEKDAYS_ACTIVITY:
    case TEMPLATE_STREAM_LEARNER_INTERACTIONS_BY_DATE_AND_VERB:
    case TEMPLATE_STREAM_USER_ENGAGEMENT_LEADERBOARD:
    case TEMPLATE_STREAM_PROPORTION_OF_SOCIAL_INTERACTIONS:
    case TEMPLATE_STREAM_ACTIVITIES_WITH_MOST_COMMENTS:
    case TEMPLATE_LEARNING_EXPERIENCE_TYPE:
    case TEMPLATE_TIME_SPENT:
    case TEMPLATE_DAYHOURS_ACTIVITY:
    case TEMPLATE_TIMESPENT_QUIZ_ACTIVITY:
    case TEMPLATE_QUIZ_COMPLETION_PROGRESS:
    case TEMPLATE_ASSIGNMENT_COMPLETION_PROGRESS:
    case TEMPLATE_ACTIVITY_LEVEL_BY_WEEK:
      return aggregateChart(preReqs, axes, timezone);
    case XVSY:
    case TEMPLATE_STREAM_INTERACTIONS_VS_ENGAGEMENT:
    case TEMPLATE_STATEMENTS_VS_GRADES:
    case TEMPLATE_GRADES_VS_TIMESPENT:
    case TEMPLATE_QUIZ_GRADES_VS_TIMESPENT:
      return aggregateXvsY(preReqs, axes, timezone);
    case COUNTER:
    case TEMPLATE_LAST_7_DAYS_STATEMENTS:
    case TEMPLATE_STREAM_COMMENT_COUNT:
    case TEMPLATE_NUMBER_OF_PEOPLE:
    case TEMPLATE_NUMBER_OF_QUIZ_ATTEMPTS:
    case TEMPLATE_NUMBER_OF_ASSIGNMENT_SUBMISSIONS:
    case TEMPLATE_NUMBER_OF_STATEMENTS:
    case TEMPLATE_AVG_QUIZ_GRADE:
    case TEMPLATE_AVG_ASSIGNMENT_GRADE:
      return aggregateCounter(preReqs, axes, timezone);
    default:
      return query;
  }
}, iterable => iterable.toJS());
