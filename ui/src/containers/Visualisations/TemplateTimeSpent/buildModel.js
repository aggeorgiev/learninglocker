import { Map, fromJS } from 'immutable';
import { TEMPLATE_TIME_SPENT } from 'lib/constants/visualise';
import { LAST_2_MONTHS, LAST_2_YEARS } from 'ui/utils/constants';
import { description } from './constants';

const buildInWeekFilter = (label, week) =>  fromJS(
	{
		$match: {
			$and: [
				{
					$comment: '{"criterionLabel":"A","criteriaPath":["timestamp"]}',
					'timestamp': {
						$inWeek: week
					}
				}
			]
		},
		'label': label
	});

const filters = [
  buildInWeekFilter('2 Weeks Before', 2),
  buildInWeekFilter('1 Week Before', 1),
  buildInWeekFilter('Current Week', 0),
];

/**
 * @param {immutable.Map} model
 * @returns {immutable.Map}
 */
const buildModel = model =>
  model
    .set('type', TEMPLATE_TIME_SPENT)
    .set('description', description)
    .set('axesgroup', new Map({ optionKey: 'people', searchString: 'Person' }))
    .set('axesoperator', 'timeSpent')
    .set('axesvalue', new Map({ optionKey: 'statements', searchString: 'Statements' }))
    .set('axesxLabel', 'Time spent (in minutes)')
    .set('axesyLabel', 'Person')
    .set('previewPeriod', LAST_2_YEARS)
    .set('filters', filters);

export default buildModel;
