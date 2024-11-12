import { Map, fromJS } from 'immutable';
import { TEMPLATE_NUMBER_OF_QUIZ_ATTEMPTS } from 'lib/constants/visualise';
import { LAST_2_YEARS } from 'ui/utils/constants';
import { description } from './constants';

const filter = fromJS({
            $match: {
                $and: [
                    {
			$comment: '{"criterionLabel":"A","criteriaPath":["statement","context","extensions","http://lrs.learninglocker.net/define/extensions/info.event_name"]}',
                        'statement.context.extensions.http://lrs&46;learninglocker&46;net/define/extensions/info.event_name': '\\mod_quiz\\event\\attempt_submitted'
                    },
                    {
			$comment: '{"criterionLabel":"A","criteriaPath":["statement","object","definition","type"]}',
                        'statement.object.definition.type': 'http://xapi.jisc.ac.uk/activities/quiz'
                    }
                ]
            }
        });

/**
 * @param {immutable.Map} model
 * @returns {immutable.Map}
 */
const buildModel = model =>
  model
    .set('type', TEMPLATE_NUMBER_OF_QUIZ_ATTEMPTS)
    .set('description', description)
    .set('axesoperator', 'uniqueCount')
    .set('axesvalue', new Map({ optionKey: 'statements', searchString: 'Statements' }))
    .set('previewPeriod', LAST_2_YEARS)
    .set('filters', [filter]);

export default buildModel;
