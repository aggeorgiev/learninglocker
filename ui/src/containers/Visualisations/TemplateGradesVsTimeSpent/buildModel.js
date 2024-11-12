import { Map, fromJS } from 'immutable';
import { TEMPLATE_GRADES_VS_TIMESPENT } from 'lib/constants/visualise';
import { LAST_7_DAYS, LAST_2_YEARS } from 'ui/utils/constants';
import { description } from './constants';


/**
 * @param {immutable.Map} model
 * @returns {immutable.Map}
 */
const buildModel = model =>
  model
    .set('type', TEMPLATE_GRADES_VS_TIMESPENT)
    .set('description', description)
    .set('axesgroup', new Map({ optionKey: 'people', searchString: 'Person' }))
    .set('axesxLabel', 'Time spent (in minutes)')
    .set('axesxOperator', 'timeSpent')
    .set('axesxValue', new Map({ optionKey: 'statements', searchString: 'Statements' }))
    .set('axesyLabel', 'Average grade')
    .set('axesyOperator', 'average')
//    .set('axesyValue', new Map({ optionKey: 'scaled', searchString: 'Scaled results' }))
    .set('axesyValue', new Map({ optionKey: 'raw', searchString: 'Raw results' }))
    .set('trendLines', true)
    .set('previewPeriod', LAST_2_YEARS);

export default buildModel;
