import React from 'react';
import PropTypes from 'prop-types';
import { Map } from 'immutable';
import { compose, withProps } from 'recompose';
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
  TEMPLATE_QUIZ_GRADES_VS_TIMESPENT,
  TEMPLATE_STREAM_COMMENT_COUNT,
  TEMPLATE_STREAM_LEARNER_INTERACTIONS_BY_DATE_AND_VERB,
  TEMPLATE_STREAM_USER_ENGAGEMENT_LEADERBOARD,
  TEMPLATE_STREAM_PROPORTION_OF_SOCIAL_INTERACTIONS,
  TEMPLATE_STREAM_ACTIVITIES_WITH_MOST_COMMENTS,
  TEMPLATE_LEARNING_EXPERIENCE_TYPE,
  TEMPLATE_TIME_SPENT,
  TEMPLATE_DAYHOURS_ACTIVITY,
  TEMPLATE_TIMESPENT_QUIZ_ACTIVITY,
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
import { withModel } from 'ui/utils/hocs';
import CustomBarChartViewer from './CustomBarChart/Viewer';
import CustomColumnChartViewer from './CustomColumnChart/Viewer';
import CustomCounterViewer from './CustomCounter/Viewer';
import CustomLineChartViewer from './CustomLineChart/Viewer';
import CustomPieChartViewer from './CustomPieChart/Viewer';
import CustomXvsYChartViewer from './CustomXvsYChart/Viewer';
import CustomHeatmapChartViewer from './CustomHeatmapChart/Viewer';
import TemplateActivityOverTime from './TemplateActivityOverTime/Viewer';
import TemplateLast7DaysStatements from './TemplateLast7DaysStatements/Viewer';
import TemplateMostActivePeople from './TemplateMostActivePeople/Viewer';
import TemplateMostPopularActivities from './TemplateMostPopularActivities/Viewer';
import TemplateMostPopularVerbs from './TemplateMostPopularVerbs/Viewer';
import TemplateWeekdaysActivity from './TemplateWeekdaysActivity/Viewer';
import TemplateStreamInteractionsVsEngagement from './TemplateStreamInteractionsVsEngagement/Viewer';
import TemplateStreamCommentCount from './TemplateStreamCommentCount/Viewer';
import TemplateStreamLearnerInteractionsByDateAndVerb from './TemplateStreamLearnerInteractionsByDateAndVerb/Viewer';
import TemplateStreamUserEngagementLeaderboard from './TemplateStreamUserEngagementLeaderboard/Viewer';
import TemplateStreamProportionOfSocialInteractions from './TemplateStreamProportionOfSocialInteractions/Viewer';
import TemplateStreamActivitiesWithMostComments from './TemplateStreamActivitiesWithMostComments/Viewer';
import TemplateLearningExperienceType from './TemplateLearningExperienceType/Viewer';
import TemplateTimeSpent from './TemplateTimeSpent/Viewer';
import TemplateDayhoursActivity from './TemplateDayhoursActivity/Viewer';
import TemplateStatementsVsGrades from './TemplateStatementsVsGrades/Viewer';
import TemplateGradesVsTimeSpent from './TemplateGradesVsTimeSpent/Viewer';
import TemplateTimeSpentInQuizActivity from './TemplateTimeSpentInQuizActivity/Viewer';
import TemplateQuizGradesVsTimeSpent from './TemplateQuizGradesVsTimeSpent/Viewer';
import TemplateNumberOfPeople from './TemplateNumberOfPeople/Viewer';
import TemplateNumberOfQuizAttempts from './TemplateNumberOfQuizAttempts/Viewer';
import TemplateNumberOfAssignmentSubmissions from './TemplateNumberOfAssignmentSubmissions/Viewer';
import TemplateNumberOfStatements from './TemplateNumberOfStatements/Viewer';
import TemplateAverageQuizGrade from './TemplateAverageQuizGrade/Viewer';
import TemplateAverageAssignmentGrade from './TemplateAverageAssignmentGrade/Viewer';
import TemplateQuizCompletionProgress from './TemplateQuizCompletionProgress/Viewer';
import TemplateAssignmentCompletionProgress from './TemplateAssignmentCompletionProgress/Viewer';
import TemplateActivityLevelByWeek from './TemplateActivityLevelByWeek/Viewer';

/**
 * @param {immutable.Map} model - visualisation model
 */
const VisualisationViewer = ({
  model,
}) => {
  const visualisationId = model.get('_id');
  const type = model.get('type');
  const showSourceView = model.get('sourceView');

  if (type === null || type === undefined) {
    return null;
  }

  switch (type) {
    case LEADERBOARD:
      return <CustomBarChartViewer visualisationId={visualisationId} showSourceView={showSourceView} />;
    case STATEMENTS:
      return <CustomColumnChartViewer visualisationId={visualisationId} showSourceView={showSourceView} />;
    case COUNTER:
      return <CustomCounterViewer visualisationId={visualisationId} showSourceView={showSourceView} />;
    case XVSY:
      return <CustomXvsYChartViewer visualisationId={visualisationId} showSourceView={showSourceView} />;
    case FREQUENCY:
      return <CustomLineChartViewer visualisationId={visualisationId} showSourceView={showSourceView} />;
    case PIE:
      return <CustomPieChartViewer visualisationId={visualisationId} showSourceView={showSourceView} />;
    case HEATMAP:
      return <CustomHeatmapChartViewer visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_ACTIVITY_OVER_TIME:
      return <TemplateActivityOverTime visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_LAST_7_DAYS_STATEMENTS:
      return <TemplateLast7DaysStatements visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_MOST_ACTIVE_PEOPLE:
      return <TemplateMostActivePeople visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_MOST_POPULAR_ACTIVITIES:
      return <TemplateMostPopularActivities visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_MOST_POPULAR_VERBS:
      return <TemplateMostPopularVerbs visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_WEEKDAYS_ACTIVITY:
      return <TemplateWeekdaysActivity visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_STREAM_INTERACTIONS_VS_ENGAGEMENT:
      return <TemplateStreamInteractionsVsEngagement visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_STATEMENTS_VS_GRADES:
      return <TemplateStatementsVsGrades visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_GRADES_VS_TIMESPENT:
      return <TemplateGradesVsTimeSpent visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_STREAM_COMMENT_COUNT:
      return <TemplateStreamCommentCount visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_STREAM_LEARNER_INTERACTIONS_BY_DATE_AND_VERB:
      return <TemplateStreamLearnerInteractionsByDateAndVerb visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_STREAM_USER_ENGAGEMENT_LEADERBOARD:
      return <TemplateStreamUserEngagementLeaderboard visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_STREAM_PROPORTION_OF_SOCIAL_INTERACTIONS:
      return <TemplateStreamProportionOfSocialInteractions visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_STREAM_ACTIVITIES_WITH_MOST_COMMENTS:
      return <TemplateStreamActivitiesWithMostComments visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_LEARNING_EXPERIENCE_TYPE:
      return <TemplateLearningExperienceType visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_TIME_SPENT:
      return <TemplateTimeSpent visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_DAYHOURS_ACTIVITY:
      return <TemplateDayhoursActivity visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_TIMESPENT_QUIZ_ACTIVITY:
     return <TemplateTimeSpentInQuizActivity visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_QUIZ_GRADES_VS_TIMESPENT:
     return <TemplateQuizGradesVsTimeSpent visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_NUMBER_OF_PEOPLE:
     return <TemplateNumberOfPeople visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_NUMBER_OF_QUIZ_ATTEMPTS:
     return <TemplateNumberOfQuizAttempts visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_NUMBER_OF_ASSIGNMENT_SUBMISSIONS:
     return <TemplateNumberOfAssignmentSubmissions visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_NUMBER_OF_STATEMENTS:
     return <TemplateNumberOfStatements visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_AVG_QUIZ_GRADE:
     return <TemplateAverageQuizGrade visualisationId={visualisationId} showSourceVIew={showSourceView} />;
    case TEMPLATE_AVG_ASSIGNMENT_GRADE:
     return <TemplateAverageAssignmentGrade visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_QUIZ_COMPLETION_PROGRESS:
     return <TemplateQuizCompletionProgress visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_ASSIGNMENT_COMPLETION_PROGRESS:
     return <TemplateAssignmentCompletionProgress visualisationId={visualisationId} showSourceView={showSourceView} />;
    case TEMPLATE_ACTIVITY_LEVEL_BY_WEEK:
     return <TemplateActivityLevelByWeek visualisationId={visualisationId} showSourceView={showSourceView} />;
    default:
      console.error(`VisualisationViewer.js does not support type "${type}"`);
      return `Type "${type}" is not supported`;
  }
};

VisualisationViewer.propTypes = {
  model: PropTypes.instanceOf(Map).isRequired,
};

// This withModel is for fetching visualisation in Dashboard
/**
 * @param {string} id - visualisation._id
 */
export default compose(
  withProps({ schema: 'visualisation' }),
  withModel,
)(VisualisationViewer);
