import { Map, OrderedMap } from 'immutable';
import {
  XVSY,
  STATEMENTS,
  LEADERBOARD,
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

const createOptionModel = (searchString, optionKey) => new Map({ optionKey, searchString });

const createOptionModels = options => (new OrderedMap(options)).map(createOptionModel);

export const UNIQUENESS_OPS = [
  'uniqueCount', 'uniqueAverage', 'uniqueMax', 'uniqueMin'
];

export const TIME_OPS = ['timeSpent'];

export const WEEKLY_OPS = ['weeklyCount'];

const TIME_OPERATOR_OPTS = new OrderedMap({
  timeSpent: 'Total time spent',
});

const WEEKLY_OPERATOR_OPTS = new OrderedMap({
  weeklyCount: 'Total weekly number of',
});

const LINE_OPERATOR_OPTS = new OrderedMap({
  uniqueCount: 'Total unique number of',
  count: 'Sum of',
  average: 'Average of',
  max: 'Max from',
  min: 'Min from',
});

export const OPERATOR_OPTS = LINE_OPERATOR_OPTS.concat(new OrderedMap({
  uniqueAverage: 'Average unique number of',
  uniqueMax: 'Max unique number of',
  uniqueMin: 'Min unique number of',
})).concat(TIME_OPERATOR_OPTS).concat(WEEKLY_OPERATOR_OPTS);

export const VALUE_OPTS = createOptionModels({
  scaled: 'Scaled results',
  raw: 'Raw results',
  steps: 'Steps',
});

export const TIME_VALUE_OPTS = createOptionModels({ statements: "Statements" });

export const WEEKLY_VALUE_OPTS = createOptionModels({ statements: "Statements" });

export const UNIQUENESS_VALUE_OPTS = createOptionModels({
  statements: 'Statements',
  people: 'People',
  activities: 'Activities',
  verb: 'Verbs',
  type: 'Activity types',
}).concat(VALUE_OPTS).concat(TIME_VALUE_OPTS).concat(WEEKLY_VALUE_OPTS);

export const GROUP_OPTS = createOptionModels({
  date: 'Date',
  hour: 'Hour',
  weekday: 'Day',
  month: 'Month',
  year: 'Year',
  people: 'Person',
  activities: 'Activity',
  verb: 'Verb',
  type: 'Activity Type',
  raw: 'Raw Result',
  response: 'Result Response',
});

export const getTypeOpts = (type) => {
  switch (type) {
    case FREQUENCY:
    case TEMPLATE_ACTIVITY_OVER_TIME:
      return LINE_OPERATOR_OPTS;
    case XVSY:
    case STATEMENTS:
    case LEADERBOARD:
    case COUNTER:
    case PIE:
    case TEMPLATE_LAST_7_DAYS_STATEMENTS:
    case TEMPLATE_MOST_ACTIVE_PEOPLE:
    case TEMPLATE_MOST_POPULAR_ACTIVITIES:
    case TEMPLATE_MOST_POPULAR_VERBS:
    case TEMPLATE_WEEKDAYS_ACTIVITY:
    case TEMPLATE_DAYHOURS_ACTIVITY:
    case TEMPLATE_TIMESPENT_QUIZ_ACTIVITY:
    case TEMPLATE_STREAM_INTERACTIONS_VS_ENGAGEMENT:
    case TEMPLATE_STATEMENTS_VS_GRADES:
    case TEMPLATE_GRADES_VS_TIMESPENT:
    case TEMPLATE_QUIZ_GRADES_VS_TIMESPENT:
    case TEMPLATE_STREAM_COMMENT_COUNT:
    case TEMPLATE_STREAM_LEARNER_INTERACTIONS_BY_DATE_AND_VERB:
    case TEMPLATE_STREAM_USER_ENGAGEMENT_LEADERBOARD:
    case TEMPLATE_STREAM_PROPORTION_OF_SOCIAL_INTERACTIONS:
    case TEMPLATE_STREAM_ACTIVITIES_WITH_MOST_COMMENTS:
    case TEMPLATE_LEARNING_EXPERIENCE_TYPE:
    case TEMPLATE_NUMBER_OF_PEOPLE:
    case TEMPLATE_NUMBER_OF_QUIZ_ATTEMPTS:
    case TEMPLATE_NUMBER_OF_ASSIGNMENT_SUBMISSIONS:
    case TEMPLATE_NUMBER_OF_STATEMENTS:
    case TEMPLATE_AVG_QUIZ_GRADE:
    case TEMPLATE_AVG_ASSIGNMENT_GRADE:
    case TEMPLATE_QUIZ_COMPLETION_PROGRESS:
    case TEMPLATE_ASSIGNMENT_COMPLETION_PROGRESS:
      return OPERATOR_OPTS;
    case TEMPLATE_TIME_SPENT:
      return TIME_OPERATOR_OPTS;
    case HEATMAP:
    case TEMPLATE_ACTIVITY_LEVEL_BY_WEEK:
      return WEEKLY_OPERATOR_OPTS;
    default:
      return new OrderedMap();
  }
};
