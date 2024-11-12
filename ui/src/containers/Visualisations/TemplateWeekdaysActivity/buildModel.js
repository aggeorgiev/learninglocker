import { Map, fromJS } from 'immutable';
import { TEMPLATE_WEEKDAYS_ACTIVITY } from 'lib/constants/visualise';
import { LAST_7_DAYS, LAST_2_YEARS } from 'ui/utils/constants';
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
  buildInWeekFilter('2 Weeks Before', 80),
  buildInWeekFilter('1 Week Before', 79),
  buildInWeekFilter('Current Week', 78),
];


/**
 * @param {immutable.Map} model
 * @returns {immutable.Map}
 */
const buildModel = model =>
  model
    .set('type', TEMPLATE_WEEKDAYS_ACTIVITY)
    .set('description', description)
    .set('axesgroup', new Map({ optionKey: 'weekday', searchString: 'Day' }))
    .set('axesoperator', 'uniqueCount')
    .set('axesvalue', new Map({ optionKey: 'statements', searchString: 'Statements' }))
    .set('axesxLabel', 'Day')
    .set('axesyLabel', 'Statements')
    .set('previewPeriod', LAST_2_YEARS)
    .set('filters', filters);

export default buildModel;
