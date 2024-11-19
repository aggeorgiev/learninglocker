import { Map } from 'immutable';
import { TEMPLATE_ACTIVITY_LEVEL_BY_WEEK } from 'lib/constants/visualise';
import { LAST_2_YEARS } from 'ui/utils/constants';
import { description } from './constants';

/**
 * @param {immutable.Map} model
 * @returns {immutable.Map}
 */
const buildModel = model =>
  model
    .set('type', TEMPLATE_ACTIVITY_LEVEL_BY_WEEK)
    .set('description', description)
    .set('axesgroup', new Map({ optionKey: 'people', searchString: 'Person' }))
    .set('axesoperator', 'weeklyCount')
    .set('axesvalue', new Map({ optionKey: 'statements', searchString: 'Statements' }))
    .set('axesxLabel', 'Weekday')
    .set('axesyLabel', 'Person')
    .set('previewPeriod', LAST_2_YEARS);

export default buildModel;
