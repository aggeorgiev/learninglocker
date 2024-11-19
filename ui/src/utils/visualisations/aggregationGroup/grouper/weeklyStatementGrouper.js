import firstValuesOf from 'ui/utils/visualisations/helpers/firstValuesOf';

// Combination: A/B J E.
export default ({ projections = {} }) => [
  {
    $group: {
      _id: {group: '$group', weekday: { $dayOfWeek: { date: '$timestamp' } } },
      count: { 
	    $sum: 1,
      },      
      ...firstValuesOf(projections),
    },
  },
];
