import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Map, Set } from 'immutable';
import moment from 'moment-timezone';
import { toTimezone } from 'lib/constants/timezones';
import DatePicker from 'ui/components/Material/DatePicker';
import {
  CriterionButton,
  CriterionOperator,
  CriterionValue,
  CriterionWrapper
} from 'ui/containers/BasicQueryBuilder/styled';
import Operator from '../Operator';
import { symbolOpToMongoOp } from './helpers';

class Criterion extends Component {
  static propTypes = {
    timezone: PropTypes.string,
    orgTimezone: PropTypes.string.isRequired,
    section: PropTypes.instanceOf(Map).isRequired,
    criterion: PropTypes.instanceOf(Map).isRequired,
    onCriterionChange: PropTypes.func.isRequired,
    onDeleteCriterion: PropTypes.func.isRequired,
  };

  shouldComponentUpdate = nextProps => !(
    this.props.timezone === nextProps.timezone &&
    this.props.orgTimezone === nextProps.orgTimezone &&
    this.props.section.equals(nextProps.section) &&
    this.props.criterion.equals(nextProps.criterion)
  );

  getQueryDisplay = query => this.props.section.get('getQueryDisplay')(query);

  getValueQuery = value => this.props.section.get('getValueQuery')(value);

  getKey = () => this.props.section.get('keyPath').join('.');

  getSubQuery = () => this.props.criterion.get(this.getKey());

  getDateValue = () => moment(this.getValue(), 'YYYY-MM-DD').toDate();

  getValue = () => {
    const operator = this.getOperator();
    const subQuery = this.getSubQuery();
    
    if (operator === 'in week') {
      return subQuery.get('$inWeek') || 0;
    }

    const mongoOp = symbolOpToMongoOp(operator);
    const queryValue = subQuery.get(mongoOp);
    return this.getQueryDisplay(queryValue);
  };

  getOperator = () => {
    const subQuery = this.getSubQuery();
    if (subQuery.has('$gt')) return '>';
    if (subQuery.has('$lte')) return '<=';
    if (subQuery.has('$gte')) return '>=';
    if (subQuery.has('$lt')) return '<';
    return 'in week';
  };

  onChangeCriterion = (operator, value) => {
    const key = this.getKey();
    
    if (operator === 'in week') {
      this.props.onCriterionChange(new Map({
        $comment: this.props.criterion.get('$comment'),
        [key]: new Map({ $inWeek: parseInt(value, 10) }),
      }));
      return;
    }

    const mongoOp = symbolOpToMongoOp(operator);
    this.props.onCriterionChange(new Map({
      $comment: this.props.criterion.get('$comment'),
      [key]: new Map({ [mongoOp]: this.getValueQuery(value) }),
    }));
  };

  onChangeOperator = operator => {
    if (operator === 'in week') {
      this.onChangeCriterion(operator, '0');
    } else {
      const currentDate = moment().format('YYYY-MM-DD');
      const timezone = toTimezone(this.props.timezone || this.props.orgTimezone);
      const z = moment(currentDate).tz(timezone).format('Z');
      this.onChangeCriterion(operator, `${currentDate}T00:00${z}`);
    }
  };

  onChangeDate = (value) => {
    const yyyymmdd = moment.parseZone(value).format('YYYY-MM-DD');
    const timezone = toTimezone(this.props.timezone || this.props.orgTimezone);
    const z = moment(yyyymmdd).tz(timezone).format('Z');
    this.onChangeCriterion(this.getOperator(), `${yyyymmdd}T00:00${z}`);
  };

  handleNumberChange = (e) => {
    const value = e.target.value;
    if (value === '' || (parseInt(value, 10) >= 0 && !isNaN(value))) {
      this.onChangeCriterion('in week', value);
    }
  };

  renderInput = () => {
    const operator = this.getOperator();
    
    if (operator === 'in week') {
      return (
        <input
          type="number"
          min="0"
          value={this.getValue()}
          onChange={this.handleNumberChange}
          className="form-control"
          style={{ width: '100px' }}
        />
      );
    }

    return (
      <DatePicker
        value={this.getDateValue()}
        onChange={this.onChangeDate}
      />
    );
  };

  render = () => (
    <CriterionWrapper>
      <CriterionOperator>
        <Operator
          operators={new Set(['>', '<', '>=', '<=', 'in week'])}
          operator={this.getOperator()}
          onOperatorChange={this.onChangeOperator}
        />
      </CriterionOperator>

      <CriterionValue isFullWidth={false}>
        {this.renderInput()}
      </CriterionValue>

      <CriterionButton
        className={'btn btn-default btn-xs'}
        onClick={this.props.onDeleteCriterion}>
        <i className="ion-minus-round" />
      </CriterionButton>
    </CriterionWrapper>
  );
}

export default Criterion;
