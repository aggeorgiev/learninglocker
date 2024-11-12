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

  // Custom color handlers
  handleBaseColorChange = (event) => {
    const value = event.target.value;
    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      this.changeAxes('baseColor', value);
    }
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

      {/* Color Configuration */}
      <div className="form-group">
        <label htmlFor="colorConfig" className="clearfix">Heat Color</label>
        <div className="form-group">
          <DebounceInput
            id="baseColor"
            className="form-control"
            type="color"
            value={this.getAxesValue('baseColor', '#0000FF')} // Default blue as per HeatmapChart
            onChange={this.handleBaseColorChange}
            title="Choose base color for heatmap intensity" />
          <small className="form-text text-muted">
            The intensity will automatically scale between white and this color based on values
          </small>
        </div>
      </div>

      {/* Display Configuration */}
      <div className="form-group">
        <label htmlFor="displayConfig" className="clearfix">Display Options</label>
        <div className="checkbox">
          <label>
            <input
              type="checkbox"
              checked={this.getAxesValue('showValues', true)}
              onChange={(e) => this.changeAxes('showValues', e.target.checked)} />
            Show cell values
          </label>
        </div>
      </div>
    </div>
  );
}

export default connect(() => ({}), { updateModel })(HeatmapAxesEditor);
