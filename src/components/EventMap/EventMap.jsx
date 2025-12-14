import React, { Suspense, lazy } from 'react';
import PropTypes from 'prop-types';

const EventMapInner = lazy(() => import('./EventMapInner'));

function EventMap(props) {
  return (
    <Suspense fallback={<div aria-busy="true">Loading map…</div>}>
      <EventMapInner {...props} />
    </Suspense>
  );
}

EventMap.propTypes = {
  isAdminView: PropTypes.bool,
  previewUseVisitorSizing: PropTypes.bool,
  markersState: PropTypes.array,
  updateMarker: PropTypes.func.isRequired,
  selectedYear: PropTypes.number,
  selectedMarkerId: PropTypes.number,
  onMarkerSelect: PropTypes.func,
  editMode: PropTypes.bool,
  onMarkerDrag: PropTypes.func,
};

EventMap.defaultProps = {
  isAdminView: false,
  markersState: [],
  selectedYear: new Date().getFullYear(),
  selectedMarkerId: null,
  onMarkerSelect: null,
  previewUseVisitorSizing: false,
  editMode: false,
  onMarkerDrag: null,
};

export default EventMap;
