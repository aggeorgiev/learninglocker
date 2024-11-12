import React from 'react';
import 'jest-styled-components';
import renderer from 'react-test-renderer';
import { List, fromJS } from 'immutable';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import HeatmapChart, { getColorIntensity, getHeatmapColor, findMinMax } from './HeatmapChart';

// ... previous tests remain the same ...

describe('Heatmap utility functions', () => {
  test('getColorIntensity should return correct intensity values', () => {
    expect(getColorIntensity(0, 0, 100)).toBe(0);
    expect(getColorIntensity(50, 0, 100)).toBe(127);
    expect(getColorIntensity(100, 0, 100)).toBe(255);
  });

  test('getHeatmapColor should return correct RGB values', () => {
    expect(getHeatmapColor(0, 0, 100)).toBe('rgb(255, 255, 255)');
    expect(getHeatmapColor(50, 0, 100)).toBe('rgb(128, 128, 255)');
    expect(getHeatmapColor(100, 0, 100)).toBe('rgb(0, 0, 255)');
  });

  describe('findMinMax', () => {
    test('should handle Series format data', () => {
      const data = [
        { Series1: 10, Series2: 20 },
        { Series1: 5, Series2: 30 }
      ];
      const [min, max] = findMinMax(data);
      expect(min).toBe(5);
      expect(max).toBe(30);
    });

    test('should handle Immutable.js data', () => {
      const data = fromJS([
        { Series1: 10, Series2: 20 },
        { Series1: 5, Series2: 30 }
      ]);
      const [min, max] = findMinMax(data);
      expect(min).toBe(5);
      expect(max).toBe(30);
    });

    test('should handle object format data', () => {
      const data = {
        row1: { value: 10, other: 'text' },
        row2: { value: 5, other: 'text' },
        row3: { value: 30, other: 'text' }
      };
      const [min, max] = findMinMax(data);
      expect(min).toBe(5);
      expect(max).toBe(30);
    });

    test('should ignore non-numeric values', () => {
      const data = [
        { Series1: '10', Series2: 'invalid', Series3: 20 },
        { Series1: 5, Series2: null, Series3: undefined }
      ];
      const [min, max] = findMinMax(data);
      expect(min).toBe(5);
      expect(max).toBe(20);
    });
  });
});
