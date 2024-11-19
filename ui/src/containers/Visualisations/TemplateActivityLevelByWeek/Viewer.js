import React from 'react';
import PropTypes from 'prop-types';
import SourceResults from 'ui/containers/VisualiseResults/SourceResults';
import HeatmapChartResults from 'ui/containers/VisualiseResults/HeatmapChartResults';

/**
 * @param {string} props.visualisationId
 * @param {boolean} props.showSourceView
 */
const Viewer = ({
  visualisationId,
  showSourceView,
}) => {
  if (showSourceView) {
    return <SourceResults id={visualisationId} />;
  }
  return <HeatmapChartResults id={visualisationId} />;
};

Viewer.propTypes = {
  visualisationId: PropTypes.string.isRequired,
  showSourceView: PropTypes.bool.isRequired,
};

export default React.memo(Viewer);
