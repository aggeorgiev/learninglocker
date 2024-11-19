import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getMetadataSelector, setInMetadata } from 'ui/redux/modules/metadata';
import { AutoSizer } from 'react-virtualized';
import { compose } from 'recompose';
import { Button } from 'react-toolbox/lib/button';
import NoData from 'ui/components/Graphs/NoData';
import { wrapLabel } from 'ui/utils/defaultTitles';
import {
  ScatterChart,
  XAxis,
  YAxis,
  Tooltip,
  Scatter,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  getResultsData,
  getShortModel,
  hasData,
  hiddenSeriesState
} from './Chart';
import {
  Buttons,
  Chart as StyledChart,
  BarContainer,
  XAxis as StyledXAxis,
  YAxis as StyledYAxis,
  XAxisLabel,
  ChartWrapper
} from './styled';

const enhance = compose(
  hiddenSeriesState,
  connect((state, { model }) =>
    ({
      activePage: getMetadataSelector({
        schema: 'visualisation',
        id: model.get('_id')
      })(state).get('activePage', 0)
    }), { setInMetadata })
);

class HeatmapChart extends Component {
  static DEFAULT_AXES_LABELS = {
    xLabel: 'Day of Week',
    yLabel: 'Person'
  };

  constructor(props) {
    super(props);
    this.transformData = this.transformData.bind(this);
    this.formatWeekday = this.formatWeekday.bind(this);
    this.CustomShape = this.CustomShape.bind(this);
    this.CustomTooltip = this.CustomTooltip.bind(this);
    this.renderHeatmap = this.renderHeatmap.bind(this);
    this.findMinMax = this.findMinMax.bind(this);
    this.getAxisLabel = this.getAxisLabel.bind(this);
    this.renderChart = this.renderChart.bind(this);
    this.displayPrevPage = this.displayPrevPage.bind(this);
    this.displayNextPage = this.displayNextPage.bind(this);
  }

  getColorIntensity(value, minValue, maxValue) {
    if (maxValue === minValue) return 0.5;
    const normalized = (value - minValue) / (maxValue - minValue);
    return Math.max(0, Math.min(1, normalized));
  }
  
  getHeatmapColor(value, minValue, maxValue) {
    const intensity = this.getColorIntensity(value, minValue, maxValue);
    
    // Define your two colors
    const lowColor = { r: 253, g: 238, b: 215 };   // Blue
    const highColor = { r: 245, g: 171, b: 54 };  // Orange
    
    // Interpolate between the two colors
    return `rgb(
      ${Math.round(lowColor.r + (highColor.r - lowColor.r) * intensity)},
      ${Math.round(lowColor.g + (highColor.g - lowColor.g) * intensity)},
      ${Math.round(lowColor.b + (highColor.b - lowColor.b) * intensity)}
    )`;
  }

  transformData(rawData) {
    const normalizeWeekday = (weekday) => {
      return ((weekday - 1) % 7);
    };

    const groupedData = Object.entries(rawData).reduce((acc, [key, value]) => {
      const { _id, model, count } = value;
      const { group, weekday } = _id;
      
      const normalizedWeekday = normalizeWeekday(weekday);
      
      if (!acc[group]) {
        acc[group] = {
          group,
          model,
          weekdays: Array(7).fill(null).map((_, index) => ({
            weekday: index,
            count: 0
          }))
        };
      }
      
      acc[group].weekdays[normalizedWeekday] = {
        weekday: normalizedWeekday,
        count
      };
      
      return acc;
    }, {});

    Object.values(groupedData).forEach(group => {
      group.weekdays.sort((a, b) => a.weekday - b.weekday);
    });

    return Object.values(groupedData);
  }

  formatWeekday(value) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[value];
  }

  CustomShape(props) {
    const { 
      x, 
      y, 
      payload, 
      minValue, 
      maxValue,
      chartHeight,
      chartWidth,
      totalRows,
      totalColumns 
    } = props;
    
    const value = payload.count;
    const backgroundColor = this.getHeatmapColor(value, minValue, maxValue);
    
    const availableHeight = chartHeight - 60;
    const availableWidth = chartWidth - 150;

	
    
    const rowHeight = availableHeight / totalRows;
    const height = rowHeight;
    const width = (availableWidth / totalColumns);
    
    const minSize = 10;
    const finalHeight = Math.max(height, minSize);
    const finalWidth = Math.max(width, minSize);
	
    const adjustedY = (totalRows - payload.rowIndex) * rowHeight - (rowHeight / 2);

    return (
      <g>
        <rect
          x={x - finalWidth/2}
          y={adjustedY - finalHeight/2}
          width={finalWidth}
          height={finalHeight}
          fill={backgroundColor}
        />
      </g>
    );
  }

  findMinMax(data) {
    let min = Infinity;
    let max = -Infinity;

    Object.values(data).forEach(item => {
      const count = item.count;
      if (typeof count === 'number') {
        min = Math.min(min, count);
        max = Math.max(max, count);
      }
    });

    return min === Infinity || max === -Infinity ? [0, 0] : [min, max];
  }

  CustomTooltip({ active, payload }) {
    if (active && payload && payload.length) {
      const { model, count, weekday } = payload[0].payload;
      const weekdayLabel = this.formatWeekday(weekday);

      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
          <p>{`Person: ${model}`}</p>
          <p>{`Weekday: ${weekdayLabel}`}</p>
          <p>{`Count: ${count}`}</p>
        </div>
      );
    }
    return null;
  }

  displayPrevPage() {
    this.props.setInMetadata({
      schema: 'visualisation',
      id: this.props.model.get('_id'),
      path: ['activePage'],
      value: this.props.activePage - 1
    });
  }

  displayNextPage() {
    this.props.setInMetadata({
      schema: 'visualisation',
      id: this.props.model.get('_id'),
      path: ['activePage'],
      value: this.props.activePage + 1
    });
  }

  getRowsPerPage(model) {
    return model.get('barChartGroupingLimit') || 10;
  }

  getDataChunk(transformedData, model, page) {
    const rowsPerPage = this.getRowsPerPage(model);
    const startIndex = rowsPerPage * page;
    return transformedData.slice(startIndex, startIndex + rowsPerPage);
  }

  getPages(transformedData, model) {
    const rowsPerPage = this.getRowsPerPage(model);
    return Math.ceil(transformedData.length / rowsPerPage);
  }

  hasPrevPage(pages, page) {
    return pages > 0 && page > 0;
  }

  hasNextPage(pages, page) {
    return pages > 0 && page < pages - 1;
  }

  renderPrevButton() {
    return (
      <span style={{ alignSelf: 'flex-start', marginLeft: 10 }}>
        <Button
          raised
          label="Previous"
          onMouseUp={this.displayPrevPage}
          icon={<i className="icon ion-chevron-left" />} />
      </span>
    );
  }

  renderNextButton() {
    return (
      <span style={{ marginRight: 10, marginLeft: 'auto' }}>
        <Button
          raised
          label="Next"
          onMouseUp={this.displayNextPage}
          icon={<i className="icon ion-chevron-right" />} />
      </span>
    );
  }

  renderLegend() {
    const { results } = this.props;
    const list = results.toJS();
    const [minValue, maxValue] = this.findMinMax(list[0][0]);

    const legendPayload = [
      { value: 'Low', color: this.getHeatmapColor(minValue, minValue, maxValue) },
      { value: 'High', color: this.getHeatmapColor(maxValue, minValue, maxValue) }
    ];

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: '20px'
      }}>
        {legendPayload.map((item, index) => (
          <div 
            key={index} 
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <div 
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: item.color,
                border: '1px solid #ddd'
              }}
            />
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    );
  }

  renderHeatmap(data) {
    return ({ width, height }) => {
      const list = data.toJS();
      const transformedData = this.transformData(list[0][0]);
      const [minValue, maxValue] = this.findMinMax(list[0][0]);

      // Get paged data
      const pagedData = this.getDataChunk(transformedData, this.props.model, this.props.activePage);
      const uniqueModels = [...new Set(pagedData.map(item => item.model))];
      const totalColumns = 7;

      const chartData = uniqueModels.flatMap((model, rowIndex) => {
        const modelData = pagedData.find(group => group.model === model);
        return modelData ? modelData.weekdays.map(day => ({
          group: modelData.group,
          model: model,
          weekday: day.weekday,
          count: day.count,
          rowIndex: rowIndex
        })) : [];
      });

      const totalRows = uniqueModels.length;

      return (
        <ScatterChart 
          width={width} 
          height={height}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid horizontal={false} vertical={false} />
          <XAxis
            type="number"
            dataKey="weekday"
            domain={[0, 6]}
            tickCount={7}
            tickFormatter={this.formatWeekday}
            interval={0}
            padding={{ left: 40, right: 40 }}
            tick={{ fontSize: 12 }}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="model"
            ticks={uniqueModels}
            domain={uniqueModels}
            axisLine={false}
            width={150}
          />
          <Tooltip content={this.CustomTooltip} />
          <Scatter
            data={chartData}
            shape={(props) => (
              <this.CustomShape
                {...props}
                minValue={minValue}
                maxValue={maxValue}
                chartHeight={height}
                chartWidth={width}
                totalRows={totalRows}
                totalColumns={totalColumns}
              />
            )}
          />
        </ScatterChart>
      );
    };
  }

  getAxisLabel(axesLabels, key, model, defaultKey, fallback) {
    if (axesLabels && axesLabels[key]) {
      return axesLabels[key];
    }
    if (model && model.getIn) {
      return model.getIn([defaultKey, 'searchString']) || fallback;
    }
    return fallback;
  }

  renderChart(component, axesLabels = {}, chartWrapperFn, model) {
    const { activePage, results } = this.props;
    const list = results.toJS();
    const transformedData = this.transformData(list[0][0]);
    const pages = this.getPages(transformedData, model);

    return (
      <StyledChart>
        <Buttons>
          {this.hasPrevPage(pages, activePage) && this.renderPrevButton()}
          {this.hasNextPage(pages, activePage) && this.renderNextButton()}
        </Buttons>
        <div 
          className={'clearfix'} 
          style={{ 
            marginTop: '10px', 
            marginBottom: '10px', 
            textAlign: 'center' 
          }}
        >
          {this.renderLegend()}
        </div>
        <BarContainer>
          <StyledYAxis>
            {wrapLabel(this.getAxisLabel(axesLabels, 'yLabel', model, 'axesvalue', HeatmapChart.DEFAULT_AXES_LABELS.yLabel))}
          </StyledYAxis>
          <ChartWrapper>
            {chartWrapperFn(component)}
          </ChartWrapper>
        </BarContainer>
        <XAxisLabel>
          <StyledXAxis>
            {wrapLabel(this.getAxisLabel(axesLabels, 'xLabel', model, 'axesgroup', HeatmapChart.DEFAULT_AXES_LABELS.xLabel))}
          </StyledXAxis>
        </XAxisLabel>
      </StyledChart>
    );
  }

  render() {
    const {
      results,
      axesLabels = HeatmapChart.DEFAULT_AXES_LABELS,
      chartWrapperFn = component => (<AutoSizer>{component}</AutoSizer>),
      model
    } = this.props;

    if (!hasData(results)) {
      return <NoData />;
    }

    return this.renderChart(
      this.renderHeatmap(results),
      axesLabels,
      chartWrapperFn,
      model
    );
  }
}

export default enhance(HeatmapChart);
