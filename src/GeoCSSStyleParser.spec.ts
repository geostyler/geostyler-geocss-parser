import * as fs from 'fs';
import GeoCSSStyleParser from './GeoCSSStyleParser';
import { Style } from 'geostyler-style';

import line_graphicStroke from '../data/styles/line_graphicStroke';
import line_graphicStroke_externalGraphic from '../data/styles/line_graphicStroke_externalGraphic';
import line_perpendicularOffset from '../data/styles/line_perpendicularOffset';
import line_simpleline from '../data/styles/line_simpleline';
import multi_simplelineLabel from '../data/styles/multi_simplelineLabel';
import point_simplepoint_filter from '../data/styles/point_simplepoint_filter';
import point_externalgraphic from '../data/styles/point_externalgraphic';
import polygon_graphicFill from '../data/styles/polygon_graphicFill';
import polygon_transparentpolygon from '../data/styles/polygon_transparentpolygon';
import raster_autoChannel from '../data/styles/raster_autoChannel';
import raster_grayChannel from '../data/styles/raster_grayChannel';
import raster_rgbChannels from '../data/styles/raster_rgbChannels';

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

    it('can read a line with symbol', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/line_graphicStroke.css', 'utf8');
      return styleParser.readStyle(geocss)
        .then((geoStylerStyle: Style) => {
          expect(geoStylerStyle).toBeDefined();
          expect(geoStylerStyle).toEqual(line_graphicStroke);
        });
    });

    it('can read a line with external graphic', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/line_graphicStroke_externalGraphic.css', 'utf8');
      return styleParser.readStyle(geocss)
        .then((geoStylerStyle: Style) => {
          expect(geoStylerStyle).toBeDefined();
          expect(geoStylerStyle).toEqual(line_graphicStroke_externalGraphic);
        });
    });

    it('can read a line with perpendicular offset', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/line_perpendicularOffset.css', 'utf8');
      return styleParser.readStyle(geocss)
        .then((geoStylerStyle: Style) => {
          expect(geoStylerStyle).toBeDefined();
          expect(geoStylerStyle).toEqual(line_perpendicularOffset);
        });
    });

    it('can read a simple line', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/line_simpleline.css', 'utf8');
      return styleParser.readStyle(geocss)
        .then((geoStylerStyle: Style) => {
          expect(geoStylerStyle).toBeDefined();
          expect(geoStylerStyle).toEqual(line_simpleline);
        });
    });

    it('can read a line with label', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/multi_simplelineLabel.css', 'utf8');
      return styleParser.readStyle(geocss)
        .then((geoStylerStyle: Style) => {
          expect(geoStylerStyle).toBeDefined();
          expect(geoStylerStyle).toEqual(multi_simplelineLabel);
        });
    });

    it('can read a point with filter', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/point_simplepoint_filter.css', 'utf8');
      return styleParser.readStyle(geocss)
        .then((geoStylerStyle: Style) => {
          expect(geoStylerStyle).toBeDefined();
          expect(geoStylerStyle).toEqual(point_simplepoint_filter);
        });
    });

    it('can read point with external graphic', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/point_externalgraphic.css', 'utf8');
      return styleParser.readStyle(geocss)
        .then((geoStylerStyle: Style) => {
          expect(geoStylerStyle).toBeDefined();
          expect(geoStylerStyle).toEqual(point_externalgraphic);
        });
    });

    it('can read a polygon with graphic', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/polygon_graphicFill.css', 'utf8');
      return styleParser.readStyle(geocss)
        .then((geoStylerStyle: Style) => {
          expect(geoStylerStyle).toBeDefined();
          expect(geoStylerStyle).toEqual(polygon_graphicFill);
        });
    });

    it('can read a transparent polygon', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/polygon_transparentpolygon.css', 'utf8');
      return styleParser.readStyle(geocss)
        .then((geoStylerStyle: Style) => {
          expect(geoStylerStyle).toBeDefined();
          expect(geoStylerStyle).toEqual(polygon_transparentpolygon);
        });
    });

    it('can read a raster with auto channel', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/raster_autoChannel.css', 'utf8');
      return styleParser.readStyle(geocss)
        .then((geoStylerStyle: Style) => {
          expect(geoStylerStyle).toBeDefined();
          expect(geoStylerStyle).toEqual(raster_autoChannel);
        });
    });

    it('can read a raster with gray channel', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/raster_grayChannel.css', 'utf8');
      return styleParser.readStyle(geocss)
        .then((geoStylerStyle: Style) => {
          expect(geoStylerStyle).toBeDefined();
          expect(geoStylerStyle).toEqual(raster_grayChannel);
        });
    });

    it('can read a raster with rgb channels', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/raster_rgbChannels.css', 'utf8');
      return styleParser.readStyle(geocss)
        .then((geoStylerStyle: Style) => {
          expect(geoStylerStyle).toBeDefined();
          expect(geoStylerStyle).toEqual(raster_rgbChannels);
        });
    });
  });
  describe('#writeStyle', () => {
    it('is defined', () => {
      expect(styleParser.writeStyle).toBeDefined();
    });

    it('can write a polygon with graphic', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/polygon_graphicFill.css', 'utf8');
      return styleParser.writeStyle(polygon_graphicFill)
        .then((geocssString: string) => {
          expect(geocssString).toBeDefined();
          expect(geocssString.replace(/\s/g, '')).toEqual(geocss.replace(/\s/g, ''));
        });
    });

    it('can write a point with filter', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/point_simplepoint_filter.css', 'utf8');
      return styleParser.writeStyle(point_simplepoint_filter)
        .then((geocssString: string) => {
          expect(geocssString).toBeDefined();
          expect(geocssString.replace(/\s/g, '')).toEqual(geocss.replace(/\s/g, ''));
        });
    });

    it('can write a raster with auto channels', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/raster_autoChannel.css', 'utf8');
      return styleParser.writeStyle(raster_autoChannel)
        .then((geocssString: string) => {
          expect(geocssString).toBeDefined();
          expect(geocssString.replace(/\s/g, '')).toEqual(geocss.replace(/\s/g, ''));
        });
    });

    it('can write a raster with gray channels', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/raster_grayChannel.css', 'utf8');
      return styleParser.writeStyle(raster_grayChannel)
        .then((geocssString: string) => {
          expect(geocssString).toBeDefined();
          expect(geocssString.replace(/\s/g, '')).toEqual(geocss.replace(/\s/g, ''));
        });
    });

    it('can write a raster with rgb channels', () => {
      expect.assertions(2);
      const geocss = fs.readFileSync('./data/geocsss/raster_rgbChannels.css', 'utf8');
      return styleParser.writeStyle(raster_rgbChannels)
        .then((geocssString: string) => {
          expect(geocssString).toBeDefined();
          expect(geocssString.replace(/\s/g, '')).toEqual(geocss.replace(/\s/g, ''));
        });
    });
  });
});