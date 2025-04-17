import React from 'react';
import 'jest-styled-components';
import renderer from 'react-test-renderer';
import { shallow } from 'enzyme';
import { List, fromJS } from 'immutable';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import HeatmapChart from './HeatmapChart';

describe('Heatmap utility functions', () => {
  // Mock props for component instance
  const mockProps = {
    model: fromJS({
      _id: 'test-model-id',
      axesgroup: { searchString: 'Custom Day of Week' },
      axesvalue: { searchString: 'Custom Person' },
      barChartGroupingLimit: 5
    }),
    results: fromJS([
      [
        {
          'person1': {
            _id: { group: 'person1', weekday: 1 },
            model: 'Person 1',
            count: 10
          },
          'person2': {
            _id: { group: 'person2', weekday: 3 },
            model: 'Person 2',
            count: 5
          }
        }
      ]
    ]),
    activePage: 0,
    setInMetadata: jest.fn(),
    hiddenSeries: fromJS([])
  };

  describe('findMinMax', () => {
    it('finds min and max values from data', () => {
      const instance = shallow(<HeatmapChart {...mockProps} />).instance();
      const data = {
        'key1': { count: 5 },
        'key2': { count: 15 },
        'key3': { count: 10 }
      };
      
      const [min, max] = instance.findMinMax(data);
      expect(min).toBe(5);
      expect(max).toBe(15);
    });

    it('returns [0, 0] when data is empty', () => {
      const instance = shallow(<HeatmapChart {...mockProps} />).instance();
      const data = {};
      
      const [min, max] = instance.findMinMax(data);
      expect(min).toBe(0);
      expect(max).toBe(0);
    });
  });

  describe('getColorIntensity', () => {
    it('returns normalized value between 0 and 1', () => {
      const instance = shallow(<HeatmapChart {...mockProps} />).instance();
      
      expect(instance.getColorIntensity(5, 0, 10)).toBe(0.5);
      expect(instance.getColorIntensity(0, 0, 10)).toBe(0);
      expect(instance.getColorIntensity(10, 0, 10)).toBe(1);
    });

    it('handles equal min and max values', () => {
      const instance = shallow(<HeatmapChart {...mockProps} />).instance();
      expect(instance.getColorIntensity(5, 5, 5)).toBe(0.5);
    });
  });

  describe('getHeatmapColor', () => {
    it('returns correct color string for minimum value', () => {
      const instance = shallow(<HeatmapChart {...mockProps} />).instance();
      const color = instance.getHeatmapColor(0, 0, 10);
      
      // Should return the low color (253, 238, 215)
      expect(color).toContain('rgb(');
      expect(color).toContain('253');
      expect(color).toContain('238');
      expect(color).toContain('215');
    });

    it('returns correct color string for maximum value', () => {
      const instance = shallow(<HeatmapChart {...mockProps} />).instance();
      const color = instance.getHeatmapColor(10, 0, 10);
      
      // Should return the high color (245, 171, 54)
      expect(color).toContain('rgb(');
      expect(color).toContain('245');
      expect(color).toContain('171');
      expect(color).toContain('54');
    });

    it('interpolates colors correctly for middle value', () => {
      const instance = shallow(<HeatmapChart {...mockProps} />).instance();
      const color = instance.getHeatmapColor(5, 0, 10);
      
      // Should return an interpolated color halfway between low and high
      expect(color).toContain('rgb(');
      
      // Check approximate interpolated values
      // Low: (253, 238, 215), High: (245, 171, 54)
      // Middle should be around: (249, 204, 134)
      const colorString = color.replace(/\s+/g, '');
      const matches = colorString.match(/rgb\((\d+),(\d+),(\d+)\)/);
      if (matches) {
        const [, r, g, b] = matches;
        
        // Allow some rounding differences
        expect(parseInt(r, 10)).toBeCloseTo(249, 0);
        expect(parseInt(g, 10)).toBeCloseTo(204, 0);
        expect(parseInt(b, 10)).toBeCloseTo(134, 0);
      }
    });
  });
});