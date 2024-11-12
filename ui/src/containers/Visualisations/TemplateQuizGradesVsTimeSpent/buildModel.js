import { Map, fromJS } from 'immutable';
import { TEMPLATE_QUIZ_GRADES_VS_TIMESPENT } from 'lib/constants/visualise';
import { LAST_2_YEARS } from 'ui/utils/constants';
import { description } from './constants';

const axesQuery = fromJS({
	$match: {
		$and: [
			{
				$comment: '{"criterionLabel":"A","criteriaPath":["statement","object","definition","type"]}',
				'statement.object.definition.type': {
					$in: [
						'http://xapi.jisc.ac.uk/activities/quiz',
					],
				},
			},
		],
	},
});

/**
 * @param {immutable.Map} model
 * @returns {immutable.Map}
 */
const buildModel = model =>
  model
    .set('type', TEMPLATE_QUIZ_GRADES_VS_TIMESPENT)
    .set('description', description)
    .set('axesgroup', new Map({ optionKey: 'people', searchString: 'Person' }))
    .set('axesxLabel', 'Time spent (in seconds)')
    .set('axesxOperator', 'average')
    .set('axesxValue', new Map({ optionKey: 'metadata.https://learninglocker&46;net/result-duration.seconds', searchString: 'metadata.https://learninglocker&46;net/result-duration.seconds' }))
    .set('axesyLabel', 'Average grade')
    .set('axesyOperator', 'average')
    .set('axesyValue', new Map({ optionKey: 'raw', searchString: 'Raw results' }))
    .set('axesxQuery', axesQuery)
    .set('axesyQuery', axesQuery)
    .set('trendLines', true)
    .set('previewPeriod', LAST_2_YEARS);

export default buildModel;
