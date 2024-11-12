import { Map } from 'immutable';
import { TEMPLATE_NUMBER_OF_STATEMENTS } from 'lib/constants/visualise';
import { LAST_2_YEARS } from 'ui/utils/constants';
import { description } from './constants';

/**
 * @param {immutable.Map} model
 * @returns {immutable.Map}
 */
const buildModel = model =>
  model
    .set('type', TEMPLATE_NUMBER_OF_STATEMENTS)
    .set('description', description)
    .set('axesoperator', 'uniqueCount')
    .set('axesvalue', new Map({ optionKey: 'statements', searchString: 'Statements' }))
    .set('previewPeriod', LAST_2_YEARS);

export default buildModel;
