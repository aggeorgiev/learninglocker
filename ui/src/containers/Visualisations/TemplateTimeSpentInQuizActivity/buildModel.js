import { Map, fromJS } from 'immutable';
import { TEMPLATE_TIMESPENT_QUIZ_ACTIVITY } from 'lib/constants/visualise';
import { LAST_2_YEARS } from 'ui/utils/constants';
import { description } from './constants';

/**
 * @param {immutable.Map} model
 * @returns {immutable.Map}
 */
const buildModel = model =>
  model
    .set('type', TEMPLATE_TIMESPENT_QUIZ_ACTIVITY)
    .set('description', description)
    .set('axesgroup', new Map({ optionKey: 'people', searchString: 'Person' }))
    .set('axesoperator', 'average')
    .set('axesvalue', new Map({ optionKey: 'metadata.https://learninglocker&46;net/result-duration.seconds', searchString: 'metadata.https://learninglocker&46;net/result-duration.seconds' }))
    .set('axesxLabel', 'Person')
    .set('axesyLabel', 'Time spent (in seconds)')
    .set('previewPeriod', LAST_2_YEARS);

export default buildModel;
