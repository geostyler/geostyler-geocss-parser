import {
  Filter,
  StyleParser,
  Style,
  Rule,
  // FunctionFilter,
  ComparisonOperator,
  CombinationOperator,
  ScaleDenominator,
  PointSymbolizer,
  Symbolizer,
  IconSymbolizer,
  LineSymbolizer,
  FillSymbolizer,
  TextSymbolizer,
  RasterSymbolizer,
  ColorMap,
  ChannelSelection,
  // ComparisonFilter,
  MarkSymbolizer,
  WellKnownName,
  ColorMapEntry,
  Channel,
  ContrastEnhancement,
  // StrMatchesFunctionFilter
} from 'geostyler-style';

const flatGeoCSS = require('flat-geo-css').default;
const _castArray = require('lodash/castArray');
const _isArray = require('lodash/isArray');
const _isNil = require('lodash/isNil');
const _isNumber = require('lodash/isNumber');
const _isEqual = require('lodash/isEqual');
const _flatten = require('lodash/flatten');
const _isString = require('lodash/isString');
const _find = require('lodash/find');

export class GeoCSSStyleParser implements StyleParser {
  /**
   * The name of the GeoCSS Style Parser.
   */
  public static title = 'GeoCSS Style Parser';

  title = 'GeoCSS Style Parser';

  private warnings: string[] = [];

  private addWarning(text: string): any {
    this.warnings.push(text);
  }

  getWarnings() {
    return [...this.warnings];
  }

  static combinationMap = {
    'all': '&&',
    'any': '||'
  };

  static comparisonMap = {
    '==': '==',
    '>': '>',
    '>=': '>=',
    '<': '<',
    '<=': '<=',
    '!=': '!=',
    'like': '*=',
    'ilike': '*='
  };

  private readExpression(expression: any) {
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
      case 'bool':
        return args[0] === 'true' ? true : false;
      default:
        return expression;
    }
  }

  private readSelectorsExpression(selectors: any): any {

    if (!selectors) {
      return undefined;
    }

    const [operator, ...operands] = selectors;

    switch (operator) {
      case 'any':
      case 'all':
        const combinationOperator: CombinationOperator = GeoCSSStyleParser.combinationMap[operator];
        return [combinationOperator, ...operands.map((arg: any) => this.readSelectorsExpression(arg))];
      case '>':
      case '<':
      case '>=':
      case '<=':
      case '!=':
      case '==':
      case 'like':
      case 'ilike':
        const comparisonOperator: ComparisonOperator = GeoCSSStyleParser.comparisonMap[operator];
        return [comparisonOperator, this.readExpression(operands[0]), this.readExpression(operands[1])];
      case 'isnull':
        return ['==', this.readExpression(operands[0]), null];
      default:
        return undefined;
    }
  }

  getFilterFromSelectors(selectors: any): Filter | undefined {
    const filter = this.readSelectorsExpression(selectors);
    if (!filter) {
      return undefined;
    }
    if ((filter[0] === '||' || filter[0] === '&&') && filter.length === 2) {
      return filter[1];
    }
    return filter;
  }

  getScaleDenominatorFromSelectors(scales: any): ScaleDenominator | undefined {
    const minScale = scales && this.readExpression(scales['min-scale']);
    const maxScale = scales && this.readExpression(scales['max-scale']);

    const minScaleParam = !_isNil(minScale) && { min: minScale[2] };
    const maxScaleParam = !_isNil(maxScale) && { max: maxScale[2] };

    return minScaleParam || maxScaleParam
      ? {
        ...minScaleParam,
        ...maxScaleParam
      }
      : undefined;
  }

  getMarkSymbolizerFromGeoCSSRule(properties: any): MarkSymbolizer {
    const symbolName = this.readExpression(properties.mark);
    let wellKnownName: WellKnownName;
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
    const markOpacity = this.readExpression(properties['mark-opacity']);

    const pseudoSelector = properties[':mark'] || {};

    const opacity = markOpacity;
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
    const markOpacity = this.readExpression(properties['mark-opacity']);

    const imageParam = image && { image };
    const opacityParam = !_isNil(markOpacity) && { opacity: markOpacity };
    const rotateParam = !_isNil(markRotation) && { rotate: markRotation };
    const sizeParam = !_isNil(markSize) && { size: markSize };

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
  getTextSymbolizerLabelFromGeoCSSProperty(label: any): string | undefined {

    function readLabelExpression(expression: any): any {
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
        case 'text':
          return args.map((arg: any) => readLabelExpression(arg));
        case 'brace':
          return readLabelExpression(args[0]);
        case 'get':
          return '{{' + args[0] + '}}';
        default:
          return expression;
      }
    }

    const value = readLabelExpression(label);
    if (_isArray(value)) {
      return value.join('');
    }
    return value;
  }

  getTextSymbolizerFromGeoCSSRule(properties: any): TextSymbolizer {
    const kind = 'Text';

    const label = this.getTextSymbolizerLabelFromGeoCSSProperty(properties.label);
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

  getColorMapFromGeoCSSProperty(properties: any): ColorMap|undefined {
    const colorMapEntries = properties['raster-color-map']
      && this.readExpression(properties['raster-color-map']).map((entry: any) => {
        const color = this.readExpression(entry[1]);
        const quantity = this.readExpression(entry[2]);
        const opacity = this.readExpression(entry[3]);
        const label = this.readExpression(entry[4]);
        return {
          color,
          quantity,
          label,
          opacity
        } as ColorMapEntry;
      });

    if (!colorMapEntries || colorMapEntries.length === 0) {
      return undefined;
    }
    const type = this.readExpression(properties['raster-color-map-type']);
    const colorMapEntriesParam = colorMapEntries && { colorMapEntries };
    return {
      type: type || 'ramp',
      ...colorMapEntriesParam
    } as ColorMap;
  }

  getContrastEnhancementFromGeoCSSPropertyContrastEnhancement(
    properties: any,
    index?: number
  ): ContrastEnhancement|undefined {

    const rasterContrastEnhancement = this.readExpression(properties['raster-contrast-enhancement']);
    const rasterGamma = this.readExpression(properties['raster-gamma']);
    if (index !== undefined) {

      const rasterContrastEnhancementArray = _castArray(rasterContrastEnhancement);
      const gammaValueArray = _castArray(rasterGamma);

      if (!(rasterContrastEnhancementArray.length === 3 || rasterContrastEnhancementArray.length === 1)
      || !(gammaValueArray.length === 3 || gammaValueArray.length === 1)) {
        throw new Error(`
          optional raster-contrast-enhancement and raster-gamma properties
          should use one or three values separated by space
          eg:

          raster-channels: 0 1 2; /* rgb */
          raster-contrast-enhancement: nomalize nomalize nomalize;
          raster-gamma: 0.5 0.5 0.5;

          /* or */

          raster-channels: 0 1 2; /* rgb */
          raster-contrast-enhancement: nomalize;
          raster-gamma: 0.5;

        `);
      }

      const fisrtEnhancementType = rasterContrastEnhancementArray[0];
      const fisrtGammaValue = gammaValueArray[0];

      if (fisrtEnhancementType !== undefined && rasterContrastEnhancementArray[index] === undefined) {
        this.addWarning('Used first value of raster-contrast-enhancement for all rgb channel');
      }
      if (fisrtGammaValue !== undefined && gammaValueArray[index] === undefined) {
        this.addWarning('Used first value of raster-gamma for all rgb channel');
      }

      const enhancementTypeRGB = rasterContrastEnhancementArray[index] || fisrtEnhancementType;
      const gammaValueRGB = !_isNil(gammaValueArray[index])
        ? gammaValueArray[index]
        : fisrtGammaValue;

      const enhancementTypeParamRGB = enhancementTypeRGB
        && { enhancementType: this.readExpression(enhancementTypeRGB) };
      const gammaValueParamRGB = !_isNil(gammaValueRGB) && { gammaValue: this.readExpression(gammaValueRGB) };
      return {
        ...enhancementTypeParamRGB,
        ...gammaValueParamRGB
      } as ContrastEnhancement;
    }

    if (_isArray(rasterContrastEnhancement) || _isArray(rasterGamma)) {
      throw new Error(`
          optional raster-contrast-enhancement and raster-gamma properties
          should use one value when used with gray channel
          eg:

          raster-channels: 0; /* gray */
          raster-contrast-enhancement: nomalize;
          raster-gamma: 0.5;

      `);
    }

    const enhancementType = this.readExpression(rasterContrastEnhancement);
    const gammaValue = this.readExpression(rasterGamma);

    if (_isNil(enhancementType) && _isNil(gammaValue)) {
      return undefined;
    }

    const enhancementTypeParam = enhancementType && { enhancementType };
    const gammaValueParam = !_isNil(gammaValue) && { gammaValue };

    return {
      ...enhancementTypeParam,
        ...gammaValueParam
    } as ContrastEnhancement;
  }

  getChannelFromGeoCSSChannel(sourceChannelName: any, properties: any, index?: number): Channel {
    const contrastEnhancement = this.getContrastEnhancementFromGeoCSSPropertyContrastEnhancement(properties, index);
    const contrastEnhancementParam = contrastEnhancement && { contrastEnhancement };
    return {
      sourceChannelName: sourceChannelName + '',
      ...contrastEnhancementParam
    } as Channel;
  }

  getChannelSelectionFromGeoCSSPropertyChannelSelection(properties: any): ChannelSelection|undefined {
    const rasterChannels = this.readExpression(properties['raster-channels']);
    if (rasterChannels === 'auto') {
      return undefined;
    }

    if (_isArray(rasterChannels) && rasterChannels.length === 3) {
      const [red, blue, green] = rasterChannels;
      const redChannel = this.getChannelFromGeoCSSChannel(red, properties, 0);
      const greenChannel = this.getChannelFromGeoCSSChannel(blue, properties, 1);
      const blueChannel = this.getChannelFromGeoCSSChannel(green, properties, 2);
      return {
        redChannel,
        greenChannel,
        blueChannel
      } as ChannelSelection;
    }

    if (_isNumber(rasterChannels) || _isString(rasterChannels)) {
      const grayChannel = this.getChannelFromGeoCSSChannel(rasterChannels, properties);
      return {
        grayChannel
      } as ChannelSelection;
    }

    throw new Error(`
      Cannot parse raster-channels. It does not match the auto, gray or rgb structure
      eg:

      raster-channels: auto;
      raster-channels: 0; /* gray */
      raster-channels: 7 2 4; /* rgb */

    `);
  }

  getRasterSymbolizerFromGeoCSSRule(properties: any): RasterSymbolizer {

    const kind = 'Raster';

    const opacity = this.readExpression(properties['raster-opacity']);
    const colorMap = this.getColorMapFromGeoCSSProperty(properties);
    const channelSelection = this.getChannelSelectionFromGeoCSSPropertyChannelSelection(properties);
    const contrastEnhancement = !channelSelection
      && this.getContrastEnhancementFromGeoCSSPropertyContrastEnhancement(properties);

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
    } else if (properties['raster-channels'] !== undefined) {
      symbolizers.push('raster');
    }
    if (properties.label) { symbolizers.push('text'); }
    return symbolizers;
  }

  getSymbolizersFromRules(geoCSSProperties: any): Symbolizer[] {
    const propertiesGroup = _castArray(geoCSSProperties);
    const newSymbolizers = propertiesGroup.reduce(
      (symbolizers: Symbolizer[], properties: any) => {
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
              if (symbolizerType === 'raster') {
                return [...acc, this.getRasterSymbolizerFromGeoCSSRule(properties)];
              }
              return [...acc];
            },
            [])];
      },
      []);
    // remove duplicated symbolizers
    return newSymbolizers.reduce(
      (symbolizers: Symbolizer[], symbolizer: Symbolizer) => {
        const isDuplicated = !!symbolizers.find((compareSymbolizer) => _isEqual(compareSymbolizer, symbolizer));
        return [
          ...symbolizers,
          ...(isDuplicated
            ? []
            : [symbolizer])
        ];
      },
      []);
  }

  getRulesFromGeoCSSSelectors(geoCSSRules: any): Rule[] {

    // merge rule with same group id
    // to render as symbolizer
    let rules = [];
    for (let i = 0; i < geoCSSRules.length; i++) {
      const rule = geoCSSRules[i];
      const lastGroup: any = rules[rules.length - 1] || {};
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
      this.addWarning('Supported only \'Flat\' mode, other directive will be translated as flat GeoCSS');
    }
    const name = directive['@styleTitle'] || '';
    const rules = this.getRulesFromGeoCSSSelectors(geoCSSRules);
    return {
      name,
      rules
    };
  }

  readStyle(geoCSSStyle: string): Promise<Style> {
    this.warnings = [];
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

  writeStyle(geoStylerStyle: Style): Promise<string> {
    this.warnings = [];
    return new Promise<any>((resolve, reject) => {
      try {
        const geoCSSObject = this.geoStylerStyleToGeoCSSObject(geoStylerStyle);
        const geoCSS = flatGeoCSS.write(geoCSSObject);
        resolve(geoCSS);
      } catch (error) {
        reject(error);
      }
    });
  }

  geoStylerStyleToGeoCSSObject(geoStylerStyle: Style): any {
    const rules: any[] = this.getGeoCSSRulesFromRules(geoStylerStyle.rules);
    return {
      directive: {
        '@mode': 'Flat',
        '@styleTitle': geoStylerStyle.name
      },
      rules
    };
  }

  private getFisrtValidPesudoselector = (key: string, properties: any): any => {
    const firstValid = _find(properties, (props: any) => !_isNil(props[key])) || {};
    return firstValid[key] || {};
  }

  getGeoCSSRulesFromRules(rules: Rule[]): any {
    return _flatten(rules.map((rule: Rule, group) => {
      const title = rule.name;
      const selector = this.getSelectorsFromFilter(rule.filter);
      const titleParam = title && { title };
      const { min: minScale, max: maxScale } = rule.scaleDenominator || {};
      const hasScales = !!(_isNumber(minScale) || _isNumber(maxScale));
      const minScaleParam = _isNumber(minScale) && { 'min-scale': ['>', ['get', '@sd'], minScale] };
      const maxScaleParam = _isNumber(maxScale) && { 'max-scale': ['<', ['get', '@sd'], maxScale] };
      const properties = this.getGeoCSSPropertiesFromSymbolizers(rule.symbolizers);
      const propertiesKeys = properties.reduce((acc: any, props: any) => [...acc, ...Object.keys(props)], []);

      return properties.map((props: any) => ({
        selector: hasScales && selector === '*'
          ? ['any', ['all']]
          : selector,
        ...titleParam,
        ...minScaleParam,
        ...maxScaleParam,
        // flatten rules using group property to display all symbolizers
        properties: propertiesKeys.reduce(
          (acc: any, key: any) => ({
            ...acc,
            [key]: !_isNil(props[key])
              ? props[key]
              : key[0] === ':'
                ? this.getFisrtValidPesudoselector(key, properties) // take the first array property or empty
                :  undefined // empty property
          }),
          {}),
        group
      }));
    }));
  }

  private readFilterExpression(filter: Filter|undefined): any {

    const combinationMap = {
      '||': 'any',
      '&&': 'all'
    };

    const comparisonMap = {
      '==': '==',
      '>': '>',
      '>=': '>=',
      '<': '<',
      '<=': '<=',
      '!=': '!=',
      '*=': 'like'
    };

    if (!filter) {
      return undefined;
    }

    const [operator, ...operands] = filter;

    switch (operator) {
      case '||':
      case '&&':
        const combinationOperator = combinationMap[operator];
        return [combinationOperator, ...operands.map((arg: any) => this.readFilterExpression(arg))];
      case '>':
      case '<':
      case '>=':
      case '<=':
      case '!=':
      case '==':
      case '*=':
        if (operator === '==' && operands[1] === null) {
          return ['isnull', ['get', operands[0]]];
        }
        const comparisonOperator = comparisonMap[operator];
        return [comparisonOperator, ['get', operands[0]], operands[1]];
      default:
        return undefined;
    }
  }

  getSelectorsFromFilter(filter: Filter|undefined): any {
    if (!filter) {
      return '*';
    }
    return this.readFilterExpression(filter);
  }

  getGeoCSSPropertiesFromSymbolizers(symbolizers: Symbolizer[]): any {
    return symbolizers.map(symbolizer => {
      switch (symbolizer.kind) {
        case 'Mark':
          return this.getGeoCSSPropertiesFromMarkSymbolizer(symbolizer);
        case 'Icon':
          return  this.getGeoCSSPropertiesFromIconSymbolizer(symbolizer);
        case 'Text':
          return this.getGeoCSSPropertiesFromTextSymbolizer(symbolizer);
        case 'Line':
          return this.getGeoCSSPropertiesFromLineSymbolizer(symbolizer);
        case 'Fill':
          return this.getGeoCSSPropertiesFromFillSymbolizer(symbolizer);
        case 'Raster':
          return this.getGeoCSSPropertiesFromRasterSymbolizer(symbolizer);
        default:
          return null;
      }
    }).filter(value => value);
  }

  getGeoCSSPropertiesFromMarkSymbolizer(markSymbolizer: MarkSymbolizer, prefix: string = 'mark'): any {

    const mark = markSymbolizer.wellKnownName && ['symbol', markSymbolizer.wellKnownName.toLowerCase()];

    const markOpacity = markSymbolizer.opacity;
    const markSize = markSymbolizer.radius !== undefined && markSymbolizer.radius * 2;
    const markRotation = markSymbolizer.rotate;

    const fill = markSymbolizer.color && ['hex', markSymbolizer.color];
    const fillOpacity = markSymbolizer.fillOpacity;
    const stroke = markSymbolizer.strokeColor && ['hex', markSymbolizer.strokeColor];
    const strokeWidth = markSymbolizer.strokeWidth;
    const strokeOpacity = markSymbolizer.strokeOpacity;

    const hasPseudoSelector = fill || stroke;

    const markParam = mark && { [prefix]: mark };
    const markOpacityParam = prefix === 'mark' && !_isNil(markOpacity) && { 'mark-opacity': markOpacity };
    const markSizeParam = !hasPseudoSelector && markSize !== false
      && !_isNil(markSize) && { [prefix + '-size']: markSize };
    const markRotationParam = !hasPseudoSelector && !_isNil(markRotation) && { [prefix + '-rotation']: markRotation };

    const fillParam = fill && { fill };
    const fillOpacityParam = fillOpacity && { 'fill-opacity': fillOpacity };
    const strokeParam = stroke && { stroke };
    const strokeWidthParam = strokeWidth && { 'stroke-width': strokeWidth };
    const strokeOpacityParam = strokeOpacity && { 'stroke-opacity': strokeOpacity };
    const sizeParam = markSize !== false && !_isNil(markSize) && { size: markSize };
    const rotationParam = !_isNil(markRotation) && { rotation: markRotation };

    const colonMarkParam = hasPseudoSelector && {
      [':' + prefix]: {
        ...fillParam,
        ...fillOpacityParam,
        ...strokeParam,
        ...strokeWidthParam,
        ...strokeOpacityParam,
        ...sizeParam,
        ...rotationParam
      }
    };

    return {
      ...markParam,
      ...markOpacityParam,
      ...markSizeParam,
      ...markRotationParam,
      ...colonMarkParam
    };
  }

  getGeoCSSPropertiesFromIconSymbolizer(iconSymbolizer: IconSymbolizer, prefix: string = 'mark'): any {

    const mark = iconSymbolizer.image && ['url', iconSymbolizer.image];

    const markOpacity = iconSymbolizer.opacity;
    const markSize = iconSymbolizer.size;
    const markRotation = iconSymbolizer.rotate;

    const markParam = mark && { [prefix]: mark };
    const markOpacityParam = prefix === 'mark' && !_isNil(markOpacity) && { [prefix + '-opacity']: markOpacity };
    const markSizeParam = !_isNil(markSize) && { [prefix + '-size']: markSize };
    const markRotationParam = !_isNil(markRotation) && { [prefix + '-rotation']: markRotation };

    return {
      ...markParam,
      ...markOpacityParam,
      ...markSizeParam,
      ...markRotationParam
    };
  }

  getGeoCSSLabelPropertyFromTextSymbolizer(template: string|undefined): any {
    if (!template) {
      return undefined;
    }
    const parts = template.split(/(\{\{)|(\}\})/g).filter(val => val);
    return parts.map((part, idx) => {
      if (part === '{{' || part === '}}') {
        return null;
      }
      if (parts[idx - 1] === '{{' && parts[idx + 1] === '}}') {
        return ['brace', ['get', part]];
      }
      return part;
    }).filter(val => val !== null);
  }

  getGeoCSSPropertiesFromTextSymbolizer(textSymbolizer: TextSymbolizer): any {

    const label = this.getGeoCSSLabelPropertyFromTextSymbolizer(textSymbolizer.label);
    const fontFamily = textSymbolizer.font;
    const fontFill = textSymbolizer.color && ['hex', textSymbolizer.color];
    const fontSize = textSymbolizer.size;
    const fontStyle = textSymbolizer.fontStyle;
    const fontWeight = textSymbolizer.fontWeight;
    const labelOffset = textSymbolizer.offset && ['array', ...textSymbolizer.offset];
    const labelRotation = textSymbolizer.rotate;
    const haloRadius = textSymbolizer.haloWidth;
    const haloColor = textSymbolizer.haloColor && ['hex', textSymbolizer.haloColor];

    const labelParam = label && { label: ['text', ...label] };
    const fontFamilyParam = fontFamily && { 'font-family': ['array', ...fontFamily] };
    const fontFillParam = fontFill && { 'font-fill': fontFill };
    const fontSizeParam = !_isNil(fontSize) && { 'font-size': fontSize };
    const fontStyleParam = fontStyle && { 'font-style': ['get', fontStyle] };
    const fontWeightParam = fontWeight && { 'font-weight': ['get', fontWeight] };
    const labelOffsetParam = labelOffset && { 'label-offset': labelOffset };
    const labelRotationParam = !_isNil(labelRotation) && { 'label-rotation': labelRotation };
    const haloRadiusParam = !_isNil(haloRadius) && { 'halo-radius': haloRadius };
    const haloColorParam = haloColor && { 'halo-color': haloColor };

    return {
      ...labelParam,
      ...labelOffsetParam,
      ...labelRotationParam,
      ...fontFamilyParam,
      ...fontFillParam,
      ...fontSizeParam,
      ...fontStyleParam,
      ...fontWeightParam,
      ...haloRadiusParam,
      ...haloColorParam
    };
  }

  getGeoCSSPropertiesFromLineSymbolizer(lineSymbolizer: LineSymbolizer): any {

    const stroke = lineSymbolizer.color && ['hex', lineSymbolizer.color];
    const strokeWidth = lineSymbolizer.width;
    const strokeOpacity = lineSymbolizer.opacity;
    const strokeLinejoin = lineSymbolizer.join;
    const strokeLinecap = lineSymbolizer.cap;
    const strokeDasharray = lineSymbolizer.dasharray && ['array', ...lineSymbolizer.dasharray];
    const strokeDashOffset = lineSymbolizer.dashOffset;

    const graphicStrokeParam = lineSymbolizer.graphicStroke
      ? lineSymbolizer.graphicStroke.kind === 'Mark'
        ? this.getGeoCSSPropertiesFromMarkSymbolizer(lineSymbolizer.graphicStroke, 'stroke')
        : lineSymbolizer.graphicStroke.kind === 'Icon'
          ? this.getGeoCSSPropertiesFromIconSymbolizer(lineSymbolizer.graphicStroke, 'stroke')
          : undefined
      : undefined;

    const strokeParam = !graphicStrokeParam && stroke && { stroke };
    const strokeWidthParam = !_isNil(strokeWidth) && { 'stroke-width': strokeWidth };
    const strokeOpacityParam = !_isNil(strokeOpacity) && { 'stroke-opacity': strokeOpacity };
    const strokeLinejoinParam = strokeLinejoin && { 'stroke-linejoin': strokeLinejoin };
    const strokeLinecapParam = strokeLinecap && { 'stroke-linecap': strokeLinecap };
    const strokeDasharrayParam = strokeDasharray && { 'stroke-dasharray': strokeDasharray };
    const strokeDashOffsetParam = strokeDashOffset && { 'stroke-dashoffset': strokeDashOffset };

    return {
      ...strokeParam,
      ...strokeWidthParam,
      ...strokeOpacityParam,
      ...strokeLinejoinParam,
      ...strokeLinecapParam,
      ...strokeDasharrayParam,
      ...strokeDashOffsetParam,
      ...graphicStrokeParam
    };
  }

  getGeoCSSPropertiesFromFillSymbolizer(fillSymbolizer: FillSymbolizer): any {

    const fill = fillSymbolizer.color && ['hex', fillSymbolizer.color];
    const fillOpacity = fillSymbolizer.fillOpacity;
    const stroke = fillSymbolizer.outlineColor && ['hex', fillSymbolizer.outlineColor];
    const strokeWidth = fillSymbolizer.outlineWidth;
    const strokeOpacity = fillSymbolizer.outlineOpacity;
    const strokeDasharray = fillSymbolizer.outlineDasharray && ['array', ...fillSymbolizer.outlineDasharray];

    const graphicFillParam = fillSymbolizer.graphicFill
      ? fillSymbolizer.graphicFill.kind === 'Mark'
        ? this.getGeoCSSPropertiesFromMarkSymbolizer(fillSymbolizer.graphicFill, 'fill')
        : fillSymbolizer.graphicFill.kind === 'Icon'
          ? this.getGeoCSSPropertiesFromIconSymbolizer(fillSymbolizer.graphicFill, 'fill')
          : undefined
      : undefined;

    const fillParam = !graphicFillParam && fill && { fill };
    const fillOpacityParam = !_isNil(fillOpacity) && { 'fill-opacity': fillOpacity };
    const strokeParam = stroke && { 'stroke': stroke };
    const strokeWidthParam = !_isNil(strokeWidth) && { 'stroke-width': strokeWidth };
    const strokeOpacityParam = !_isNil(strokeOpacity) && { 'stroke-opacity': strokeOpacity };
    const strokeDasharrayParam = strokeDasharray && { 'stroke-dasharray': strokeDasharray };

    return {
      ...fillParam,
      ...fillOpacityParam,
      ...strokeParam,
      ...strokeWidthParam,
      ...strokeOpacityParam,
      ...strokeDasharrayParam,
      ...graphicFillParam
    };
  }

  getGeoCSSColorMapFromColorMap(colorMap: ColorMap|undefined): any {
    if (!colorMap) {
      return undefined;
    }

    const rasterColorMap = colorMap.colorMapEntries && colorMap.colorMapEntries.length > 0
      && colorMap.colorMapEntries
        .map(({ color, quantity, opacity, label }) =>
          ['color-map-entry', ['hex', color], quantity, opacity, label].filter((value) => !_isNil(value))
        )
        .filter((value) => value.length > 1);

    const rasterColorMapTypeParam = colorMap.type && { 'raster-color-map-type': ['get', colorMap.type] };
    const rasterColorMapParam = rasterColorMap && rasterColorMap.length > 0
      && { 'raster-color-map': ['array', ...rasterColorMap] };

    return {
      ...rasterColorMapTypeParam,
      ...rasterColorMapParam
    };
  }

  getGeoCSSChannelSelectionFromChannelSelection(channelSelection: ChannelSelection|undefined): any {

    const redChannelKey = 'redChannel';
    const greenChannelKey = 'greenChannel';
    const blueChannelKey = 'blueChannel';

    const redChannel = channelSelection && channelSelection[redChannelKey];
    const greenChannel = channelSelection && channelSelection[greenChannelKey];
    const blueChannel = channelSelection && channelSelection[blueChannelKey];

    if (redChannel && greenChannel && blueChannel) {
      const red = redChannel.sourceChannelName;
      const green = greenChannel.sourceChannelName;
      const blue = blueChannel.sourceChannelName;

      const {
        enhancementType: redEnhancementType,
        gammaValue: redGammaValue
      } = redChannel.contrastEnhancement;
      const {
        enhancementType: greenEnhancementType,
        gammaValue: greenGammaValue
      } = greenChannel.contrastEnhancement;
      const {
        enhancementType: blueEnhancementType,
        gammaValue: blueGammaValue
      } = blueChannel.contrastEnhancement;

      const rasterContrastEnhancementParam = (redEnhancementType && greenEnhancementType && blueEnhancementType)
        && { 'raster-contrast-enhancement': ['array',
          ['get', redEnhancementType],
          ['get', greenEnhancementType],
          ['get', blueEnhancementType]] };

      const rasterGammaParam = (!_isNil(redGammaValue) && !_isNil(greenGammaValue) && !_isNil(blueGammaValue))
        && { 'raster-gamma': ['array', redGammaValue, greenGammaValue, blueGammaValue] };

      return {
        'raster-channels': ['array', parseFloat(red), parseFloat(green), parseFloat(blue)],
        ...rasterContrastEnhancementParam,
        ...rasterGammaParam
      };
    }

    const grayChannelKey = 'grayChannel';
    const grayChannel = channelSelection && channelSelection[grayChannelKey];

    if (grayChannel) {
      const gray = grayChannel.sourceChannelName;
      const {
        enhancementType: grayEnhancementType,
        gammaValue: grayGammaValue
      } = grayChannel.contrastEnhancement;

      const rasterContrastEnhancementParam = grayEnhancementType
        && { 'raster-contrast-enhancement': ['get', grayEnhancementType] };
      const rasterGammaParam = !_isNil(grayGammaValue)
        && { 'raster-gamma': grayGammaValue };

      return {
        'raster-channels': parseFloat(gray),
        ...rasterContrastEnhancementParam,
        ...rasterGammaParam
      };
    }

    return {
      'raster-channels': ['get', 'auto']
    };
  }

  getGeoCSSPropertiesFromRasterSymbolizer(rasterSymbolizer: RasterSymbolizer): any {
    const rasterOpacityParam = !_isNil(rasterSymbolizer.opacity) && { 'raster-opacity': rasterSymbolizer.opacity };
    const rasterColorMapParams = this.getGeoCSSColorMapFromColorMap(rasterSymbolizer.colorMap);
    const rasterChannelsParams = this.getGeoCSSChannelSelectionFromChannelSelection(rasterSymbolizer.channelSelection);
    const {
      enhancementType,
      gammaValue
    } = rasterSymbolizer && rasterSymbolizer.contrastEnhancement || {};
    const isAuto = rasterChannelsParams['raster-channels'] && rasterChannelsParams['raster-channels'][1] === 'auto';
    const rasterContrastEnhancementParam = isAuto && enhancementType
      && { 'raster-contrast-enhancement': ['get', enhancementType] };
    const rasterGammaParam = isAuto && !_isNil(gammaValue)
        && { 'raster-gamma': gammaValue };

    return {
      ...rasterChannelsParams,
      ...rasterContrastEnhancementParam,
      ...rasterGammaParam,
      ...rasterOpacityParam,
      ...rasterColorMapParams
    };
  }
}

export default GeoCSSStyleParser;
