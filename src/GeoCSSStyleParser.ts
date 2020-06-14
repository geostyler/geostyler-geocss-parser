import {
  Filter,
  StyleParser,
  Style,
  Rule,
  // FunctionFilter,
  // ComparisonOperator,
  // CombinationOperator,
  ScaleDenominator,
  PointSymbolizer,
  Symbolizer,
  IconSymbolizer,
  LineSymbolizer,
  FillSymbolizer,
  TextSymbolizer,
  RasterSymbolizer,
  // ColorMap,
  // ChannelSelection,
  // ComparisonFilter,
  MarkSymbolizer,
  WellKnownName,
  // ColorMapEntry,
  // Channel,
  // ContrastEnhancement,
  // StrMatchesFunctionFilter
} from 'geostyler-style';

const flatGeoCSS = require('flat-geo-css').default;
const _castArray = require('lodash/castArray');
const _isArray = require('lodash/join');
const _isNil = require('lodash/isNil');

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
    return undefined;
  }

  getScaleDenominatorFromSelectors(scales: any): ScaleDenominator | undefined {
    return undefined;
  }

  readExpression(expression: any) {
    if (expression === undefined) {
      return null;
    }
    if (typeof expression === 'string' || expression instanceof String) {
        return expression;
    }
    if (!isNaN(expression)) {
        return expression;
    }
    const [ operator, ...args ] = expression;

    switch (operator) {
      case 'array':
        return args;
      case 'get':
        return args[0];
      case 'hex':
        return args[0];
      case 'symbol':
        return args[0];
      case 'url':
        return args[0];
      default:
        return expression;
    }
  }

  getMarkSymbolizerFromGeoCSSRule(properties: any): MarkSymbolizer {
    const symbolName = this.readExpression(properties.mark);
    let wellKnownName:WellKnownName;
    switch (symbolName) {
      case 'circle':
      case 'square':
      case 'triangle':
      case 'star':
      case 'cross':
      case 'x':
        const wkn = symbolName.charAt(0).toUpperCase() + symbolName.slice(1);
        wellKnownName = wkn as WellKnownName;
        break;
      case 'shape://vertline':
      case 'shape://horline':
      case 'shape://slash':
      case 'shape://backslash':
      case 'shape://dot':
      case 'shape://plus':
      case 'shape://times':
      case 'shape://oarrow':
      case 'shape://carrow':
        wellKnownName = symbolName as WellKnownName;
        break;
      default:
        throw new Error('MarkSymbolizer cannot be parsed. Unsupported WellKnownName.');
    }

    const kind = 'Mark';

    const markSize = this.readExpression(properties['mark-size']);
    const markRotation = this.readExpression(properties['mark-rotation']);

    const pseudoSelector = properties[':mark'] || {};

    const opacity = this.readExpression(pseudoSelector.opacity);
    const fillOpacity = this.readExpression(pseudoSelector['fill-opacity']);
    const color = this.readExpression(pseudoSelector.fill);
    const rotate = this.readExpression(pseudoSelector.rotation) || markRotation;
    const size = (this.readExpression(pseudoSelector.size) || markSize);
    const strokeColor = this.readExpression(pseudoSelector.stroke);
    const strokeWidth = this.readExpression(pseudoSelector['stroke-width']);
    const strokeOpacity = this.readExpression(pseudoSelector['stroke-opacity']);

    const wellKnownNameParam = wellKnownName && { wellKnownName };
    const opacityParam = !_isNil(opacity) && { opacity };
    const fillOpacityParam = !_isNil(fillOpacity) && { fillOpacity };
    const colorParam = color && { color };
    const rotateParam = !_isNil(rotate) && { rotate };
    const radiusParam = !_isNil(size) && { radius: size / 2 };
    const strokeColorParam = strokeColor && { strokeColor };
    const strokeWidthParam = !_isNil(strokeWidth) && { strokeWidth };
    const strokeOpacityParam = !_isNil(strokeOpacity) && { strokeOpacity };

    return {
      kind,
      ...wellKnownNameParam,
      ...opacityParam,
      ...fillOpacityParam,
      ...colorParam,
      ...rotateParam,
      ...radiusParam,
      ...strokeColorParam,
      ...strokeWidthParam,
      ...strokeOpacityParam
    };
  }

  getIconSymbolizerFromGeoCSSRule(properties: any): IconSymbolizer {
    const kind = 'Icon';
    const image = this.readExpression(properties.mark);
    const markSize = this.readExpression(properties['mark-size']);
    const markRotation = this.readExpression(properties['mark-rotation']);

    const pseudoSelector = properties[':mark'] || {};

    const opacity = this.readExpression(pseudoSelector.opacity);
    const rotate = this.readExpression(pseudoSelector.rotation) || markRotation;
    const size = this.readExpression(pseudoSelector.size) || markSize;

    const imageParam = image && { image };
    const opacityParam = !_isNil(opacity) && { opacity };
    const rotateParam = !_isNil(rotate) && { rotate };
    const sizeParam = !_isNil(size) && { size };

    return {
      kind,
      ...imageParam,
      ...opacityParam,
      ...rotateParam,
      ...sizeParam
    };
  }

  getPointSymbolizerFromGeoCSSRule(properties: any): PointSymbolizer {
    const externalGraphic = properties.mark[0] === 'url';
    if (externalGraphic) {
      return this.getIconSymbolizerFromGeoCSSRule(properties);
    }
    return this.getMarkSymbolizerFromGeoCSSRule(properties);
  }

  getLineSymbolizerFromGeoCSSRule(properties: any): LineSymbolizer {
    const kind = 'Line';
    const color = this.readExpression(properties.stroke);
    const width = this.readExpression(properties['stroke-width']);
    const opacity = this.readExpression(properties['stroke-opacity']);
    const join = this.readExpression(properties['stroke-linejoin']);
    const cap = this.readExpression(properties['stroke-linecap']);
    const dasharray = this.readExpression(properties['stroke-dasharray']);
    const dashOffset = this.readExpression(properties['stroke-dashoffset']);
    const perpendicularOffset = this.readExpression(properties['stroke-offset']);

    // graphicFill or graphicStroke
    const graphicStroke = (properties.stroke[0] === 'symbol' || properties.stroke[0] === 'url')
      ? this.getPointSymbolizerFromGeoCSSRule({
        'mark': properties.stroke,
        'mark-size': properties['stroke-size'],
        'mark-rotation': properties['stroke-rotation'],
        ':mark': properties[':stroke']
      })
      : undefined;

    const colorParam = !graphicStroke && color && { color };
    const graphicStrokeParam = graphicStroke && { graphicStroke };
    const widthParam = !_isNil(width) && { width };
    const opacityParam = !_isNil(opacity) && { opacity };
    const joinParam = join && { join };
    const capParam = cap && { cap };
    const dasharrayParam = dasharray && { dasharray };
    const dashOffsetParam = dashOffset && { dashOffset };
    const perpendicularOffsetParam = !_isNil(perpendicularOffset) && { perpendicularOffset };

    return {
      kind,
      ...colorParam,
      ...graphicStrokeParam,
      ...widthParam,
      ...opacityParam,
      ...joinParam,
      ...capParam,
      ...dasharrayParam,
      ...dashOffsetParam,
      ...perpendicularOffsetParam
    };
  }

  getFillSymbolizerFromGeoCSSRule(properties: any): FillSymbolizer {

    const kind = 'Fill';
    const color = this.readExpression(properties.fill);
    const fillOpacity = this.readExpression(properties['fill-opacity']);
    const outlineColor = this.readExpression(properties.stroke);
    const outlineWidth = this.readExpression(properties['stroke-width']);
    const outlineOpacity = this.readExpression(properties['stroke-opacity']);
    const outlineDasharray = this.readExpression(properties['stroke-dasharray']);

    const graphicFill = (properties.fill[0] === 'symbol' || properties.fill[0] === 'url')
      ? this.getPointSymbolizerFromGeoCSSRule({
        'mark': properties.fill,
        'mark-size': properties['fill-size'],
        'mark-rotation': properties['fill-rotation'],
        ':mark': properties[':fill']
      })
      : undefined;

    const colorParam = !graphicFill && color && { color };
    const graphicFillParam = graphicFill && { graphicFill };
    const opacityParam = !color && { opacity: 0 };
    const fillOpacityParam = !_isNil(fillOpacity) && { fillOpacity };
    const outlineColorParam = outlineColor && { outlineColor };
    const outlineWidthParam = !_isNil(outlineWidth) && { outlineWidth };
    const outlineOpacityParam = !_isNil(outlineOpacity) && { outlineOpacity };
    const outlineDasharrayParam = outlineDasharray && { outlineDasharray };

    return {
      kind,
      ...colorParam,
      ...graphicFillParam,
      ...opacityParam,
      ...fillOpacityParam,
      ...outlineColorParam,
      ...outlineWidthParam,
      ...outlineOpacityParam,
      ...outlineDasharrayParam
    };
  }

  getTextSymbolizerFromGeoCSSRule(properties: any): TextSymbolizer {
    const kind = 'Text';

    const label = this.readExpression(properties.label); // this.getTextSymbolizerLabelFromGeoCSSProperty(label);
    const color = this.readExpression(properties['font-fill']);
    const haloWidth = this.readExpression(properties['halo-radius']);
    const haloColor = this.readExpression(properties['halo-color']);
    const offset = this.readExpression(properties['label-offset']);
    const rotate = this.readExpression(properties['label-rotation']);
    const font = this.readExpression(properties['font-family']);
    const fontStyle = this.readExpression(properties['font-style']);
    const fontWeight = this.readExpression(properties['font-weight']);
    const size = this.readExpression(properties['font-size']);

    const labelParam = label && { label };
    const colorParam = color && { color };
    const haloWidthParam = !_isNil(haloWidth) && { haloWidth };
    const haloColorParam = haloColor && { haloColor };
    const offsetParam = offset && { offset };
    const rotateParam = !_isNil(rotate) && { rotate };
    const fontParam = font && { font: _castArray(font) };
    const fontStyleParam = fontStyle && { fontStyle };
    const fontWeightParam = fontWeight && { fontWeight };
    const sizeParam = !_isNil(size) && { size };

    return {
      kind,
      ...labelParam,
      ...colorParam,
      ...haloWidthParam,
      ...haloColorParam,
      ...offsetParam,
      ...rotateParam,
      ...fontParam,
      ...fontStyleParam,
      ...fontWeightParam,
      ...sizeParam
    };
  }

  getRasterSymbolizerFromGeoCSSRule(properties: any): RasterSymbolizer {
    const kind = 'Raster';

    const opacity = this.readExpression(properties['']);
    const colorMap = this.readExpression(properties['']); // this.getColorMapFromGeoCSSProperty();
    const channelSelection = this.readExpression(properties['']); // this.getChannelSelectionFromGeoCSSPropertyChannelSelection();
    const contrastEnhancement = this.readExpression(properties['']); // this.getContrastEnhancementFromGeoCSSPropertyContrastEnhancement();

    const opacityParam = !_isNil(opacity) && { opacity };
    const colorMapParam = colorMap && { colorMap };
    const channelSelectionParam = channelSelection && { channelSelection };
    const contrastEnhancementParam = contrastEnhancement && { contrastEnhancement };

    return {
      kind,
      ...opacityParam,
      ...colorMapParam,
      ...channelSelectionParam,
      ...contrastEnhancementParam
    };
  }

  getSymbolizerTypesFromProperties(properties: any): String[] {
    let symbolizers = [];
    if (properties.mark) {
      symbolizers.push('point');
    } else if (properties.stroke && (properties.fill === 'none' || !properties.fill)) {
      symbolizers.push('line');
    } else if (properties.fill && properties.fill !== 'none') {
      symbolizers.push('polygon');
    }
    if (properties.label) { symbolizers.push('text'); }
    return symbolizers;
  }

  getSymbolizersFromRules(geoCSSProperties: any): Symbolizer[] {
    const propertiesGroup = _castArray(geoCSSProperties);
    return propertiesGroup.reduce((symbolizers: Symbolizer[], properties: any) => {
      const symbolizerTypes = this.getSymbolizerTypesFromProperties(properties);
      return [
        ...symbolizers,
        ...symbolizerTypes.reduce(
          (acc: Symbolizer[], symbolizerType: string) => {
            if (symbolizerType === 'point') {
              return [...acc, this.getPointSymbolizerFromGeoCSSRule(properties)];
            }
            if (symbolizerType === 'line') {
              return [...acc, this.getLineSymbolizerFromGeoCSSRule(properties)];
            }
            if (symbolizerType === 'polygon') {
              return [...acc, this.getFillSymbolizerFromGeoCSSRule(properties)];
            }
            if (symbolizerType === 'text') {
              return [...acc, this.getTextSymbolizerFromGeoCSSRule(properties)];
            }
            return [...acc];
          },
          [])
      ]
    }, []);
  }

  getRulesFromGeoCSSSelectors(geoCSSRules: any): Rule[] {

    // merge rule with same group id
    // to render as symbolizer
    let rules = [];
    for (let i = 0; i < geoCSSRules.length; i++) {
      const rule = geoCSSRules[i];
      const lastGroup:any = rules[rules.length - 1] || {};
      const lastGroupId = lastGroup.group;
      if (lastGroupId !== undefined && lastGroupId === rule.group) {
        rules[rules.length - 1] = {
          ...lastGroup,
          properties: [
            ...(_isArray(lastGroup.properties) ? lastGroup.properties : [lastGroup.properties]),
            rule.properties
          ]
        };
      } else {
        rules.push(rule);
      }
    }

    return rules.map((geoCSSRule: any) => {
      const { title = '', selector: filterSelectors, properties, ...others } = geoCSSRule;
      const filter: Filter | undefined = this.getFilterFromSelectors(filterSelectors);
      const scaleDenominator: ScaleDenominator | undefined = this.getScaleDenominatorFromSelectors(others);
      const symbolizers: Symbolizer[] = this.getSymbolizersFromRules(properties);
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
    const { directive = {}, rules: geoCSSRules } = geoCSSObject;
    if (directive['@mode'] !== 'Flat') {
      this.warn('Supported only \'Flat\' mode, other directive will be translated as flat GeoCSS');
    }
    const name = directive['@styleTitle'] || '';
    const rules = this.getRulesFromGeoCSSSelectors(geoCSSRules);
    return {
      name,
      rules
    };
  }

  readStyle(geoCSSStyle: string): Promise<Style> {
    return new Promise((resolve, reject) => {
      try {
        const geoCSSObject = flatGeoCSS.read(geoCSSStyle);
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
