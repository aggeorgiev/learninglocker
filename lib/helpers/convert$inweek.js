import _ from 'lodash';
import moment from 'moment';

const getNthWeekBefore = (n) => {
  const startOfNthWeek = moment().subtract(n, "weeks").startOf("week");
  const endOfNthWeek = moment().subtract(n, "weeks").endOf("week");

  return {
    start: startOfNthWeek,
    end: endOfNthWeek,
  };
};

const convert$inweek = (value) => {
  console.log(JSON.stringify(value));
  if (_.has(value, '$inWeek')) {
    const { start, end } = getNthWeekBefore(_.get(value, '$inWeek'));
    return {
        $gte: { $dte: start.toISOString() },
        $lte: { $dte: end.toISOString() }
    };
  } else if (_.isArray(value)) {
    return _.map(value, convert$inweek);
  } else if (_.isPlainObject(value)) {
    return _.mapValues(value, convert$inweek);
  }
  return value;
};

export default convert$inweek;
