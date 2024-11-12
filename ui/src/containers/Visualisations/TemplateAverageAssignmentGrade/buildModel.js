import { Map, fromJS } from 'immutable';
import { TEMPLATE_AVG_ASSIGNMENT_GRADE } from 'lib/constants/visualise';
import { LAST_2_YEARS } from 'ui/utils/constants';
import { description } from './constants';

const filter = fromJS({
            $match: {
                $and: [
                    {
			$comment: '{"criterionLabel":"A","criteriaPath":["statement","object","definition","type"]}',
                        'statement.object.definition.type': 'http://adlnet.gov/expapi/activities/assessment'
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
    .set('type', TEMPLATE_AVG_ASSIGNMENT_GRADE)
    .set('description', description)
    .set('axesoperator', 'average')
    .set('axesvalue', new Map({ optionKey: 'raw', searchString: 'Raw results' }))
    .set('previewPeriod', LAST_2_YEARS)
    .set('filters', [filter]);

export default buildModel;
