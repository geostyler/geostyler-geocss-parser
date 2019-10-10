import {
  Filter,
  StyleParser,
  Style,
  Rule,
  // FunctionFilter,
  // ComparisonOperator,
  // CombinationOperator,
  ScaleDenominator,
  // PointSymbolizer,
  Symbolizer,
  // IconSymbolizer,
  LineSymbolizer,
  FillSymbolizer,
  // TextSymbolizer,
  // RasterSymbolizer,
  // ColorMap,
  // ChannelSelection,
  // ComparisonFilter,
  // MarkSymbolizer,
  // WellKnownName,
  // ColorMapEntry,
  // Channel,
  // ContrastEnhancement,
  // StrMatchesFunctionFilter
} from 'geostyler-style';
import geoCSS2JSON from './utils/geoCSS2JSON';
import GeoStylerCQLParser from 'geostyler-cql-parser';

const _trim = require('lodash/trim');
const _find = require('lodash/find');
const _join = require('lodash/join');

const geoStylerCQLParser = new GeoStylerCQLParser();

export class GeoCSSStyleParser implements StyleParser {
  /**
   * The name of the GeoCSS Style Parser.
   */
  public static title = 'GeoCSS Style Parser';

  title = 'GeoCSS Style Parser';

  private warn(text: string): any {
    if (console) { console.warn(text); }
  }

  getFilterFromSelectors(selectors: any): Filter | undefined {
    const allSelector = _find(selectors, (selector: string) => selector === '*');
    if (allSelector) {
      return undefined;
    }
    const filters = selectors
      .map((selector: string) =>
        _trim(selector
          .replace(/\*|\[|\]/g, '')
          .replace(' and ', ' AND ')
          .replace(' or ', ' OR '))
      );
    return geoStylerCQLParser.read(_join(filters, ' OR '));
  }

  getScaleDenominatorFromSelectors(): ScaleDenominator | undefined {
    return undefined;
  }

  getLineSymbolizerFromGeoCSSRule(geoCSSRule: any): LineSymbolizer {
    const { rule } = geoCSSRule;
    const kind = 'Line';
    const color = rule.stroke;
    const width = parseFloat(rule['stroke-width']);
    const opacity = parseFloat(rule['stroke-opacity']);
    const join = rule['stroke-linejoin'];
    const cap = rule['stroke-linecap'];
    const dasharray = rule['stroke-dasharray'];
    const dashOffset = rule['stroke-dashoffset'];
    // graphicStroke
    // perpendicularOffset
    // graphicFill

    const colorParam = color && { color };
    const widthParam = width && { width };
    const opacityParam = opacity && { opacity };
    const joinParam = join && { join };
    const capParam = cap && { cap };
    const dasharrayParam = dasharray && { dasharray };
    const dashOffsetParam = dashOffset && { dashOffset };

    return {
      kind,
      ...colorParam,
      ...widthParam,
      ...opacityParam,
      ...joinParam,
      ...capParam,
      ...dasharrayParam,
      ...dashOffsetParam
    };
  }

  getFillSymbolizerFromGeoCSSRule(geoCSSRule: any): FillSymbolizer {
    const { rule } = geoCSSRule;
    const kind = 'Fill';
    const color = rule.fill;
    const fillOpacity = rule['fill-opacity'] && parseFloat(rule['fill-opacity']);
    const outlineColor = rule.stroke;
    const outlineWidth = rule['stroke-width'] && parseFloat(rule['stroke-width']);
    const outlineOpacity = rule['stroke-opacity'] && parseFloat(rule['stroke-opacity']);
    const outlineDasharray = rule['stroke-dasharray'] && rule['stroke-dasharray']
      .split(' ')
      .map((value: string) => parseFloat(value));
    // graphicFill

    const colorParam = color && { color };
    const opacityParam = !color && { opacity: 0 };
    const fillOpacityParam = fillOpacity && { fillOpacity };
    const outlineColorParam = outlineColor && { outlineColor };
    const outlineWidthParam = outlineWidth && { outlineWidth };
    const outlineOpacityParam = outlineOpacity && { outlineOpacity };
    const outlineDasharrayParam = outlineDasharray && { outlineDasharray };

    return {
      kind,
      ...colorParam,
      ...opacityParam,
      ...fillOpacityParam,
      ...outlineColorParam,
      ...outlineWidthParam,
      ...outlineOpacityParam,
      ...outlineDasharrayParam
    };
  }

  getSymbolizersFromRules(geoCSSRules: any): Symbolizer[] {
    const { rules, pseudoSelectors } = geoCSSRules;
    return rules.reduce(
      (acc: Symbolizer[], rule: any) => {
        if (rule.symbolizer === 'line') {
          return [...acc, this.getLineSymbolizerFromGeoCSSRule({ rule, pseudoSelectors })];
        }
        if (rule.symbolizer === 'polygon') {
          return [...acc, this.getFillSymbolizerFromGeoCSSRule({ rule, pseudoSelectors })];
        }
        return [...acc];
      },
      []);
  }

  getRulesFromGeoCSSSelectors(geoCSSSelectors: any): Rule[] {
    const { pseudoSelectors, selectors } = geoCSSSelectors;
    return selectors.map((geoCSSSelector: any) => {
      const { title = '', selectors: filterSelectors, rules } = geoCSSSelector;
      const filter: Filter | undefined = this.getFilterFromSelectors(filterSelectors);
      const scaleDenominator: ScaleDenominator | undefined = this.getScaleDenominatorFromSelectors();
      const symbolizers: Symbolizer[] = this.getSymbolizersFromRules({ rules, pseudoSelectors });
      const filterParam = filter && { filter };
      const scaleDenominatorParam = scaleDenominator && { scaleDenominator };
      const symbolizersParam = symbolizers && { symbolizers };
      return {
        name: title,
        ...filterParam,
        ...scaleDenominatorParam,
        ...symbolizersParam
      };
    });
  }

  geoCSSObjectToGeoStylerStyle(geoCSSObject: any): Style {
    const { info = {}, ...geoCSSSelectors } = geoCSSObject;
    if (info.mode !== 'Flat') {
      this.warn('Supported only \'Flat\' mode, other directive will be translated as flat GeoCSS');
    }
    const name = info.styleTitle || '';
    const rules = this.getRulesFromGeoCSSSelectors(geoCSSSelectors);
    return {
      name,
      rules
    };
  }

  readStyle(geoCSSStyle: string): Promise<Style> {
    return new Promise((resolve, reject) => {
      try {
        const geoCSSObject = geoCSS2JSON(geoCSSStyle);
        const geoStylerStyle = this.geoCSSObjectToGeoStylerStyle(geoCSSObject);
        resolve(geoStylerStyle);
      } catch (error) {
        reject(error);
      }
    });
  }

  writeStyle(): Promise<string> {
    return new Promise((resolve) => {
      resolve('');
    });
  }
}

export default GeoCSSStyleParser;
