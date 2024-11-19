import React from 'react';
import PropTypes from 'prop-types';
import { Map } from 'immutable';
import { connect } from 'react-redux';
import { updateModel } from 'ui/redux/modules/models';
import DebounceInput from 'react-debounce-input';
import CountEditor from './CountEditor';
import GroupEditor from './GroupEditor';
import BaseAxesEditor from './BaseAxesEditor';

export class HeatmapAxesEditor extends BaseAxesEditor {
  static propTypes = {
    model: PropTypes.instanceOf(Map),
    updateModel: PropTypes.func
  };

  render = () => (
    <div>
      {/* Row Configuration (Y-Axis) */}
      <div className="form-group">
        <label htmlFor="axesgroup" className="clearfix">Row Groups (Y-Axis)</label>
        <div className="form-group">
          <DebounceInput
            id="yAxisLabel"
            className="form-control"
            placeholder="Row Label"
            debounceTimeout={377}
            style={{ fontWeight: 'bold' }}
            value={this.getAxesValue('yLabel', 'Y-Axis')}
            onChange={this.handleAxesChange.bind(this, 'yLabel')} />
        </div>
        <div className="form-group">
          <GroupEditor
            group={this.getAxesValue('group')}
            changeGroup={this.changeAxes.bind(this, 'group')} />
        </div>
      </div>

      {/* Column Configuration (X-Axis) */}
      <div className="form-group">
        <label htmlFor="axesvalue" className="clearfix">Column Values (X-Axis)</label>
        <div className="form-group">
          <DebounceInput
            id="xAxisLabel"
            className="form-control"
            placeholder="Column Label"
            debounceTimeout={377}
            style={{ fontWeight: 'bold' }}
            value={this.getAxesValue('xLabel', 'X-Axis')}
            onChange={this.handleAxesChange.bind(this, 'xLabel')} />
        </div>
        <div className="form-group">
          <CountEditor
            type={this.props.model.get('type')}
            value={this.getAxesValue('value')}
            operator={this.getAxesValue('operator')}
            changeValue={this.changeAxes.bind(this, 'value')}
            changeOperator={this.changeAxes.bind(this, 'operator')} />
        </div>
      </div>
    </div>
  );
}

export default connect(() => ({}), { updateModel })(HeatmapAxesEditor);
