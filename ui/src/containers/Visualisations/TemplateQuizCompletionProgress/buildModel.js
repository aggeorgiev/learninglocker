import { Map, fromJS } from 'immutable';
import { TEMPLATE_QUIZ_COMPLETION_PROGRESS } from 'lib/constants/visualise';
import { LAST_2_YEARS } from 'ui/utils/constants';
import { description } from './constants';

/**
 * @param {string} label
 * @param {string[]} verbIds
 * @returns {immutable.Map} filter
 */
const filters = [fromJS({
  $match: {
    $and: [
      {
        $comment: '{"criterionLabel":"A","criteriaPath":["statement","object","definition","type"]}',
        'statement.object.definition.type': {
          $in: [
            'http://xapi.jisc.ac.uk/activities/quiz'
          ],
        },
      },
      {
        $comment: '{"criterionLabel":"B","criteriaPath":["statement","verb"]}',
        'statement.verb.id': {
          $in: [
            'http://adlnet.gov/expapi/verbs/completed'
          ],
        },
      },
    ],
  },
})];

/**
 * @param {immutable.Map} model
 * @returns {immutable.Map}
 */
const buildModel = model =>
  model
    .set('type', TEMPLATE_QUIZ_COMPLETION_PROGRESS)
    .set('description', description)
    .set('axesgroup', new Map({ optionKey: 'activities', searchString: 'Activity' }))
    .set('axesoperator', 'uniqueCount')
    .set('axesvalue', new Map({ optionKey: 'people', searchString: 'People' }))
    .set('isDonut', true)
    .set('filters', filters)
    .set('previewPeriod', LAST_2_YEARS);

export default buildModel;
