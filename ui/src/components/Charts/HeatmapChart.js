import React from 'react';
import { AutoSizer } from 'react-virtualized';
import { compose } from 'recompose';
import NoData from 'ui/components/Graphs/NoData';
import { wrapLabel } from 'ui/utils/defaultTitles';
import {
  getResultsData,
  getShortModel,
  hasData,
  hiddenSeriesState
} from './Chart';
import {
  Chart as StyledChart,
  BarContainer,
  XAxis as StyledXAxis,
  YAxis as StyledYAxis,
  XAxisLabel,
  ChartWrapper
} from './styled';

// Utility functions
export const getColorIntensity = (value, minValue, maxValue) => {
  const normalized = (value - minValue) / (maxValue - minValue);
  return Math.floor(normalized * 255);
};

export const getHeatmapColor = (value, minValue, maxValue, baseColor = [0, 0, 255]) => {
  const intensity = getColorIntensity(value, minValue, maxValue);
  return `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
};

export const findMinMax = data => {
  let min = Infinity;
  let max = -Infinity;

  // Handle Immutable.js data
  if (data && typeof data.toJS === 'function') {
    data = data.toJS();
  }

  // Handle object format
  if (data && !Array.isArray(data) && typeof data === 'object') {
    data = Object.values(data);
  }

  // Ensure we have an array to work with
  if (!Array.isArray(data)) {
    return [0, 0]; // Return default values if data is invalid
  }

  data.forEach(row => {
    if (typeof row === 'object' && row !== null) {
      Object.entries(row).forEach(([key, value]) => {
        // Handle numeric strings by converting them
        const numValue = Number(value);
        
        // Only process if it's a Series key or value property
        if ((key.startsWith('Series') || key === 'value') && 
            !isNaN(numValue) && 
            value !== null && 
            value !== undefined && 
            value !== '') {
          min = Math.min(min, numValue);
          max = Math.max(max, numValue);
        }
      });
    }
  });

  // Handle case where no valid numbers were found
  if (min === Infinity || max === -Infinity) {
    return [0, 0];
  }

  return [min, max];
};

const DEFAULT_AXES_LABELS = {
  xLabel: 'X-Axis',
  yLabel: 'Y-Axis'
};

const renderHeatmap = (data, labels, model) => ({ width, height }) => {
  const cellWidth = width / (labels.size + 1);
  const cellHeight = height / data.size;
  const [minValue, maxValue] = findMinMax(data.toJS());

  return (
    <div className="w-full h-full relative">
      {/* Y-Axis Labels */}
      <div className="absolute left-0 top-0 w-24">
        {data.map((row, i) => (
          <div
            key={`y-${i}`}
            className="text-sm truncate"
            style={{
              height: `${cellHeight}px`,
              lineHeight: `${cellHeight}px`
            }}
          >
            {getShortModel(data)(row.get('cellId'))}
          </div>
        ))}
      </div>

      {/* Heatmap Grid */}
      <div className="ml-24">
        <div className="flex mb-2">
          {labels.map((label, i) => (
            <div
              key={`x-${i}`}
              className="text-sm text-center truncate"
              style={{ width: `${cellWidth}px` }}
            >
              {label}
            </div>
          ))}
        </div>

        {data.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex">
            {labels.map((_, colIndex) => {
              const value = row.get(`Series ${colIndex + 1}`, 0);
              return (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="border border-gray-200"
                  style={{
                    width: `${cellWidth}px`,
                    height: `${cellHeight}px`,
                    backgroundColor: getHeatmapColor(value, minValue, maxValue),
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center text-xs">
                    {value}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const getAxisLabel = (axesLabels, key, model, defaultKey, fallback) => {
  if (axesLabels && axesLabels[key]) {
    return axesLabels[key];
  }
  if (model && model.getIn) {
    return model.getIn([defaultKey, 'searchString']) || fallback;
  }
  return fallback;
};

const renderChart = (component, axesLabels = {}, chartWrapperFn, model) => (
  <StyledChart>
    <BarContainer>
      <StyledYAxis>
      {wrapLabel(getAxisLabel(axesLabels, 'yLabel', model, 'axesvalue', DEFAULT_AXES_LABELS.yLabel))}
      </StyledYAxis>
      <ChartWrapper>
        {chartWrapperFn(component)}
      </ChartWrapper>
    </BarContainer>
    <XAxisLabel>
      <StyledXAxis>
       {wrapLabel(getAxisLabel(axesLabels, 'xLabel', model, 'axesgroup', DEFAULT_AXES_LABELS.xLabel))}
      </StyledXAxis>
    </XAxisLabel>
  </StyledChart>
);

const sortData = data => data.sortBy(e => e.get('id'));

const getSortedData = results => labels =>
  sortData(getResultsData(results)(labels));

const renderChartResults = (labels, data) => 
  renderHeatmap(data, labels);

const renderResults = results => labels => axesLabels => chartWrapperFn => model =>
  renderChart(
    renderChartResults(labels, getSortedData(results)(labels)),
    axesLabels,
    chartWrapperFn,
    model
  );

const HeatmapChart = compose(hiddenSeriesState)((
  {
    results,
    labels,
    axesLabels = DEFAULT_AXES_LABELS,
    chartWrapperFn = component => (<AutoSizer>{component}</AutoSizer>),
    model
  }) => (
    hasData(results)
      ? renderResults(results)(labels)(axesLabels)(chartWrapperFn)(model)
      : <NoData />
  )
);

// Export both the component and testing utilities
export default HeatmapChart;

// Export testing utilities
export const testing = {
  getColorIntensity,
  getHeatmapColor,
  findMinMax
};
