import { Map, fromJS } from 'immutable';
import { TEMPLATE_STATEMENTS_VS_GRADES } from 'lib/constants/visualise';
import { LAST_7_DAYS, LAST_2_YEARS } from 'ui/utils/constants';
import { description } from './constants';


/**
 * @param {immutable.Map} model
 * @returns {immutable.Map}
 */
const buildModel = model =>
  model
    .set('type', TEMPLATE_STATEMENTS_VS_GRADES)
    .set('description', description)
    .set('axesgroup', new Map({ optionKey: 'people', searchString: 'Person' }))
    .set('axesxLabel', 'Statements')
    .set('axesxOperator', 'uniqueCount')
    .set('axesxValue', new Map({ optionKey: 'statements', searchString: 'Statements' }))
    .set('axesyLabel', 'Average grade')
    .set('axesyOperator', 'average')
//    .set('axesyValue', new Map({ optionKey: 'scaled', searchString: 'Scaled results' }))
    .set('axesyValue', new Map({ optionKey: 'raw', searchString: 'Raw results' }))
    .set('trendLines', true)
    .set('previewPeriod', LAST_2_YEARS);

export default buildModel;
