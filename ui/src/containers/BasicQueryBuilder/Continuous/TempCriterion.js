import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Map, Set } from 'immutable';
import moment from 'moment-timezone';
import { toTimezone } from 'lib/constants/timezones';
import DatePicker from 'ui/components/Material/DatePicker';
import { CriterionOperator, CriterionValue, CriterionWrapper } from 'ui/containers/BasicQueryBuilder/styled';
import Operator from '../Operator';
import { symbolOpToMongoOp } from './helpers';

const DEFAULT_SYMBOL_OP = '<';

class TempCriterion extends Component {
  static propTypes = {
    timezone: PropTypes.string,
    orgTimezone: PropTypes.string.isRequired,
    section: PropTypes.instanceOf(Map).isRequired,
    onCriterionChange: PropTypes.func.isRequired,
  }

  state = {
    operator: DEFAULT_SYMBOL_OP,
    weekValue: '0'  // Add state for week input
  }

  shouldComponentUpdate = (nextProps, nextState) => !(
    this.props.timezone === nextProps.timezone &&
    this.props.orgTimezone === nextProps.orgTimezone &&
    this.props.section.equals(nextProps.section) &&
    this.state.operator === nextState.operator &&
    this.state.weekValue === nextState.weekValue
  );

  getValueQuery = value =>
    this.props.section.get('getValueQuery')(value);

  getKey = () =>
    this.props.section.get('keyPath').join('.');

  onChangeOperator = operator => {
    this.setState({ operator });
    
    // If switching to 'in week', trigger the criterion change with default value
    if (operator === 'in week') {
      const key = this.getKey();
      this.props.onCriterionChange(new Map({
        [key]: new Map({
          $inWeek: 0
        })
      }));
    }
  };

  onChangeDate = (value) => {
    const yyyymmdd = moment(value).format('YYYY-MM-DD');
    const timezone = toTimezone(this.props.timezone || this.props.orgTimezone);
    const z = moment(yyyymmdd).tz(timezone).format('Z');
    const datetimeString = `${yyyymmdd}T00:00${z}`;

    const key = this.getKey();
    const mongoOp = symbolOpToMongoOp(this.state.operator);

    this.props.onCriterionChange(new Map({
      [key]: new Map({
        [mongoOp]: this.getValueQuery(datetimeString)
      })
    }));
  }

  handleWeekValueChange = (e) => {
    const value = e.target.value;
    
    // Only allow non-negative numbers
    if (value === '' || (parseInt(value, 10) >= 0 && !isNaN(value))) {
      this.setState({ weekValue: value });
      
      const key = this.getKey();
      this.props.onCriterionChange(new Map({
        [key]: new Map({
          $inWeek: parseInt(value, 10) || 0
        })
      }));
    }
  }

  renderInput = () => {
    if (this.state.operator === 'in week') {
      return (
        <input
          type="number"
          min="0"
          value={this.state.weekValue}
          onChange={this.handleWeekValueChange}
          className="form-control"
          style={{ width: '100px' }}
        />
      );
    }

    return <DatePicker onChange={this.onChangeDate} />;
  }

  render = () => (
    <CriterionWrapper>
      <CriterionOperator>
        <Operator
          operators={new Set(['>', '<', '>=', '<=', 'in week'])}
          operator={this.state.operator}
          onOperatorChange={this.onChangeOperator} />
      </CriterionOperator>
      <CriterionValue isFullWidth={this.state.operator !== 'in week'}>
        {this.renderInput()}
      </CriterionValue>
    </CriterionWrapper>
  )
}

export default TempCriterion;