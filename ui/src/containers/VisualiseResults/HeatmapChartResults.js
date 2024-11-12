import React from 'react';
import { withStatementsVisualisation } from 'ui/utils/hocs';
import HeatmapChart from 'ui/components/Charts/HeatmapChart';
import { shorten } from 'ui/utils/defaultTitles';

export default withStatementsVisualisation(({
  getFormattedResults, results, labels, colors, previewPeriod, axes, model
}) => (
  <HeatmapChart
    results={getFormattedResults(results)}
    labels={labels}
    model={model}
    axesLabels={{
      xLabel: axes.get('xLabel', shorten(model.getIn(['axesxValue', 'searchString'], 'X-Axis'))),
      yLabel: axes.get('yLabel', axes.getIn(['value', 'searchString'], 'Y-Axis'))
    }} />
));

