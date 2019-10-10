import * as fs from 'fs';
import GeoCSSStyleParser from './GeoCSSStyleParser';
import { Style } from 'geostyler-style';

import polygon_transparentpolygon from '../data/styles/polygon_transparentpolygon';

it('GeoCSSStyleParser is defined', () => {
  expect(GeoCSSStyleParser).toBeDefined();
});

describe('GeoCSSStyleParser implements StyleParser', () => {
  let styleParser: GeoCSSStyleParser;

  beforeEach(() => {
    styleParser = new GeoCSSStyleParser();
  });

  describe('#readStyle', () => {
    it('is defined', () => {
      expect(styleParser.readStyle).toBeDefined();
    });

    it('can read a GeoCSS PolygonSymbolizer', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/polygon_transparentpolygon.css', 'utf8');
      return styleParser.readStyle(geocss)
        .then((geoStylerStyle: Style) => {
          expect(geoStylerStyle).toBeDefined();
          expect(geoStylerStyle).toEqual(polygon_transparentpolygon);
        });
    });
  });
});