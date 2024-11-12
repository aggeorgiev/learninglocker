import React from 'react';
import { CardList } from 'ui/containers/VisualiseForm/NewVisualisation/styled';
import TemplateActivityOverTimeCard from 'ui/containers/Visualisations/TemplateActivityOverTime/Card';
import TemplateLast7DaysStatementsCard from 'ui/containers/Visualisations/TemplateLast7DaysStatements/Card';
import TemplateMostPopularVerbsCard from 'ui/containers/Visualisations/TemplateMostPopularVerbs/Card';
import TemplateMostPopularActivitiesCard from 'ui/containers/Visualisations/TemplateMostPopularActivities/Card';
import TemplateMostActivePeopleCard from 'ui/containers/Visualisations/TemplateMostActivePeople/Card';
import TemplateWeekdaysActivityCard from 'ui/containers/Visualisations/TemplateWeekdaysActivity/Card';
import TemplateStreamInteractionsVsEngagementCard from 'ui/containers/Visualisations/TemplateStreamInteractionsVsEngagement/Card';
import TemplateStatementsVsGradesCard from 'ui/containers/Visualisations/TemplateStatementsVsGrades/Card';
import TemplateGradesVsTimeSpentCard from 'ui/containers/Visualisations/TemplateGradesVsTimeSpent/Card';
import TemplateStreamCommentCountCard from 'ui/containers/Visualisations/TemplateStreamCommentCount/Card';
import TemplateStreamLearnerInteractionsByDateAndVerbCard from 'ui/containers/Visualisations/TemplateStreamLearnerInteractionsByDateAndVerb/Card';
import TemplateStreamUserEngagementLeaderboardCard from 'ui/containers/Visualisations/TemplateStreamUserEngagementLeaderboard/Card';
import TemplateStreamProportionOfSocialInteractionsCard from 'ui/containers/Visualisations/TemplateStreamProportionOfSocialInteractions/Card';
import TemplateStreamActivitiesWithMostCommentsCard from 'ui/containers/Visualisations/TemplateStreamActivitiesWithMostComments/Card';
import TemplateLearningExperienceType from 'ui/containers/Visualisations/TemplateLearningExperienceType/Card';
import TemplateTimeSpentCard from 'ui/containers/Visualisations/TemplateTimeSpent/Card';
import TemplateDayhoursActivityCard from 'ui/containers/Visualisations/TemplateDayhoursActivity/Card';
import TemplateTimeSpentInQuizActivityCard from 'ui/containers/Visualisations/TemplateTimeSpentInQuizActivity/Card';
import TemplateQuizGradesVsTimeSpentCard from 'ui/containers/Visualisations/TemplateQuizGradesVsTimeSpent/Card';
import TemplateNumberOfPeopleCard from 'ui/containers/Visualisations/TemplateNumberOfPeople/Card';
import TemplateNumberOfQuizAttemptsCard from 'ui/containers/Visualisations/TemplateNumberOfQuizAttempts/Card';
import TemplateNumberOfAssignmentSubmissionsCard from 'ui/containers/Visualisations/TemplateNumberOfAssignmentSubmissions/Card';
import TemplateNumberOfStatementsCard from 'ui/containers/Visualisations/TemplateNumberOfStatements/Card';
import TemplateAverageQuizGradeCard from 'ui/containers/Visualisations/TemplateAverageQuizGrade/Card';
import TemplateAverageAssignmentGradeCard from 'ui/containers/Visualisations/TemplateAverageAssignmentGrade/Card';
import TemplateQuizCompletionProgressCard from 'ui/containers/Visualisations/TemplateQuizCompletionProgress/Card';
import TemplateAssignmentCompletionProgressCard from 'ui/containers/Visualisations/TemplateAssignmentCompletionProgress/Card';

const TemplateCardList = ({ model, saveModel }) => (
  <CardList id="new-visualisation-templates">
    <TemplateLearningExperienceType
      model={model}
      saveModel={saveModel} />

    <TemplateLast7DaysStatementsCard
      model={model}
      saveModel={saveModel} />

    <TemplateActivityOverTimeCard
      model={model}
      saveModel={saveModel} />

    <TemplateMostPopularVerbsCard
      model={model}
      saveModel={saveModel} />

    <TemplateMostPopularActivitiesCard
      model={model}
      saveModel={saveModel} />

    <TemplateMostActivePeopleCard
      model={model}
      saveModel={saveModel} />

    <TemplateWeekdaysActivityCard
      model={model}
      saveModel={saveModel} />

    <TemplateStreamInteractionsVsEngagementCard
      model={model}
      saveModel={saveModel} />

    <TemplateStreamCommentCountCard
      model={model}
      saveModel={saveModel} />

    <TemplateStreamLearnerInteractionsByDateAndVerbCard
      model={model}
      saveModel={saveModel} />

    <TemplateStreamUserEngagementLeaderboardCard
      model={model}
      saveModel={saveModel} />

    <TemplateStreamProportionOfSocialInteractionsCard
      model={model}
      saveModel={saveModel} />

    <TemplateStreamActivitiesWithMostCommentsCard
      model={model}
      saveModel={saveModel} />
    
    <TemplateTimeSpentCard
      model={model}
      saveModel={saveModel} />

    <TemplateDayhoursActivityCard
      model={model}
      saveModel={saveModel} />

    <TemplateStatementsVsGradesCard
	model={model}
	saveModel={saveModel} />

    <TemplateGradesVsTimeSpentCard
	model={model}
	saveModel={saveModel} />

    <TemplateTimeSpentInQuizActivityCard
	model={model}
	saveModel={saveModel} />
    
    <TemplateQuizGradesVsTimeSpentCard
	model={model}
	saveModel={saveModel} />

    <TemplateNumberOfPeopleCard
	model={model}
	saveModel={saveModel} />

    <TemplateNumberOfQuizAttemptsCard
	model={model}
	saveModel={saveModel} />

    <TemplateNumberOfAssignmentSubmissionsCard
	model={model}
	saveModel={saveModel} />

    <TemplateNumberOfStatementsCard
	model={model}
	saveModel={saveModel} />

    <TemplateAverageQuizGradeCard
	model={model}
	saveModel={saveModel} />

    <TemplateAverageAssignmentGradeCard
	model={model}
	saveModel={saveModel} />

     <TemplateQuizCompletionProgressCard
	model={model}
	saveModel={saveModel} />

     <TemplateAssignmentCompletionProgressCard
	model={model}
	saveModel={saveModel} />

  </CardList>
);

export default TemplateCardList;
