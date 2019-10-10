
const moo = require('moo');
const _trim = require('lodash/trim');
const _find = require('lodash/find');
const _join = require('lodash/join');
const _max = require('lodash/max');
const _range = require('lodash/range');

const PSEUDOSELECTOR_REGEX = /\*\:[a-zA-Z0-9\-\(\)]+|\[.*?\]\:[a-zA-Z0-9\-\(\)]+|\:[a-zA-Z0-9\-\(\)]+/;

let lexer = moo.compile({
  whitespace: /[ \t]+/,
  open: /\{/,
  close: /\}[\;]*/,
  mode: {
    match: /\@mode.*?\;/,
    value: (s: string) => _trim(_trim(s.replace(/\@mode|\;/g, '')), '\'')
  },
  styleTitle: {
    match: /\@styleTitle.*?\;/,
    value: (s: string) => _trim(_trim(s.replace(/\@styleTitle|\;/g, '')), '\'')
  },
  styleAbstract: {
    match: /\@styleAbstract.*?\;/,
    value: (s: string) => _trim(_trim(s.replace(/\@styleAbstract|\;/g, '')), '\'')
  },
  pseudoselector: {
    match: PSEUDOSELECTOR_REGEX,
    lineBreaks: true
  },
  selector: {
    match: /\*|\[[^]+?\]/,
    lineBreaks: true
  },
  rule: {
    match: /fill[\w-]*\:[^\{}]+?\;|stroke[\w-]*\:[^\{]+?\;|mark[\w-]*\:[^\{]+?\;|label[\w-]*\:[^\{]+?\;/,
    lineBreaks: true,
    value: (s: string) => {
      const [key] = s.match(/fill[\w-]*|stroke[\w-]*|mark[\w-]*|label[\w-]*/) || [];
      const value = s
        .replace(key, '')
        .replace(/\:|\;/g, '')
        .split(',')
        .map(val => _trim(val));
      return {
        [key]: value
      };
    }
  },
  title: {
    match: /\/\*\s+@title[^]+?\*\//,
    lineBreaks: true,
    value: (s: string) => _trim(_trim(s.replace(/\@title|\'/g, ''), /\/\*|\*\//g))
  },
  comment: {
    match: /\/\*[^]+?\*\//,
    lineBreaks: true
  },
  newline: {
    match: /\n|\r\n/,
    lineBreaks: true
  },
  comma: ','
});

function getSymbolizers(style: any) {
  let symbolizers = [];
  if (style.mark) { symbolizers.push('point'); }
  if (style.stroke && (style.fill === 'none' || !style.fill)) {
    symbolizers.push('line');
  } else if (style.fill && style.fill !== 'none') {
    symbolizers.push('polygon');
  }
  if (style.label) { symbolizers.push('text'); }
  return symbolizers;
}

function splitStyles(style: any) {
  const stylesKeys = Object.keys(style);
  const symbolizers = getSymbolizers(style);
  const numberOfStyles = _max(Object.values(style)
    .map((values: string) => values.length));
  const newStyles = _range(numberOfStyles)
    .map((idx: number) => {
      return stylesKeys.reduce(
        (acc: any, key: string) => {
          const currentValue = style[key][idx];
          return {
            ...acc,
            ...(currentValue && { [key]: currentValue })
          };
        },
        {});
    });
  return symbolizers.reduce(
    (acc: any, symbolizer: string) => {
      return [
        ...acc,
        ...newStyles.map((stl: any) => ({ ...stl, symbolizer }))
      ];
    },
    []);
}

function getRules(sortedTokens: any) {
  return sortedTokens.map((_tokens: any, idx: number) => {
    const titleToken = _find(_tokens, (token: any) => token.type === 'title');
    const pseudoselectorToken = _find(_tokens, (token: any) => token.type === 'pseudoselector');
    const selectorToken = _find(_tokens, (token: any) => token.type === 'selector');
    const style = _tokens
      .filter((token: any) => token.type === 'rule')
      .reduce(
        (acc: any, rule: any) => ({
          ...acc,
          ...(rule.value || {})
        }),
        {});

    const { level, group, value } = pseudoselectorToken || selectorToken || {};

    // TODO: check open close error
    // const open = _find(group, (token: any) => token.type === 'open') || {};
    // const close = _find(group, (token: any) => token.type === 'close') || {};

    const currentLevel = level;
    const currentGroup = group;

    const parentNodes = Object.values(sortedTokens
      .filter((_group: any, cidx: number) => cidx < idx
        && _group[0].group === currentGroup
        && _group[0].level < currentLevel)
      .reduce(
        (acc: any, _group: any) => {
          return {
            ...acc,
            [_group[0].level]: {
              selector: (_find(_group, (token: any) => token.type === 'selector') || {}).value || [],
              title: (_find(_group, (token: any) => token.type === 'title') || {}).value || ''
            }
          };
        },
        {}));

    const selectors = [
      ...parentNodes.map((tkn: any) => tkn.selector),
      value
    ]
      .reduce((prev: any, curr: any) => {
        let combinations: any = [];
        prev.forEach((start: any) => {
          curr.forEach((end: any) => {
            combinations.push(start + '' + end);
          });
        });
        return combinations;
      });

    const title = titleToken
      && _join(
        [
          ...parentNodes.map((tkn: any) => tkn.title),
          titleToken.value
        ].filter(val => val),
        ', ');

    return {
      selectors,
      rules: splitStyles(style),
      title
    };
  });
}

export default (geoCSS: string) => {

  lexer.reset(geoCSS);
  const tokens = Array.from(lexer);

  const infoTokens = tokens
    .filter((token: any) => (
      token.type === 'mode'
      || token.type === 'styleTitle'
      || token.type === 'styleAbstract')
    )
    .reduce(
      (acc: any, token: any) => ({
        ...acc,
        [token.type]: token.value
      }),
      {});

  const ruleTokens = tokens
    .filter((token: any) => !(
      token.type === 'newline'
      || token.type === 'whitespace'
      || token.type === 'mode'
      || token.type === 'styleTitle'
      || token.type === 'styleAbstract'
      || token.type === 'comment')
    );

  let groupTokens: any = [];
  let lastType = '';

  ruleTokens
    .forEach((token: any) => {
      if (token.type === 'pseudoselector'
        && lastType === 'comma') {
        const lastToken = { ...groupTokens[groupTokens.length - 2] };
        groupTokens = [
          ...groupTokens.filter((tkn: any, idx: number) => idx < groupTokens.length - 2),
          {
            ...lastToken,
            value: lastToken.value + ',' + token.value
          }
        ];
      } else if (token.type === 'selector'
        && lastType === 'comma') {
        const lastToken = { ...groupTokens[groupTokens.length - 2] };
        groupTokens = [
          ...groupTokens.filter((tkn: any, idx: number) => idx < groupTokens.length - 2),
          {
            ...lastToken,
            value: lastToken.value + ',' + token.value
          }
        ];
      } else if (token.type === 'selector'
        && lastType === 'selector') {
        const lastToken = { ...groupTokens[groupTokens.length - 1] };
        groupTokens = [
          ...groupTokens.filter((tkn: any, idx: number) => idx < groupTokens.length - 1),
          {
            ...lastToken,
            value: lastToken.value + '' + token.value
          }
        ];
      } else {
        groupTokens = [...groupTokens, { ...token }];
      }
      lastType = token.type;
    });

  let level = 0;
  let lastLevel = 0;
  let group = 0;
  let id = 0;

  const levels = groupTokens
    .filter((token: any) => token.type !== 'comma')
    .map((token: any) => {
      lastLevel = level;

      if (token.type === 'open') { level++; id++; }
      if (token.type === 'close') { level--; }
      const currentLevel = (token.type === 'selector'
        || token.type === 'pseudoselector'
        || token.type === 'close'
        || token.type === 'title') ? level + 1 : level;

      const value = (token.type === 'selector' || token.type === 'pseudoselector')
        ? token.value.split(',')
        : token.value;

      const { type, col, line, offset } = token;

      let currentGroup = group;

      if (lastLevel !== 0 && level === 0) {
        group++;
        id = 0;
        currentGroup = group - 1;
      }

      return {
        type,
        col,
        line,
        offset,
        value,
        level: currentLevel,
        group: currentGroup,
        id
      };
    });

  const groupTokensByGroupAndLevel = levels
    .reduce(
      (acc: any, token: any) => {
        const key = `${token.group}:${token.level}`;
        return {
          ...acc,
          [key]: acc[key] ? [...acc[key], token] : [token]
        };
      },
      {});

  const listTokens = Object.keys(groupTokensByGroupAndLevel)
    .map((key: string) => {
      const grouped = groupTokensByGroupAndLevel[key]
        .reduce(
          (acc: any, token: any) => {
            if (acc.length > 0) {
              const currentAcc = acc.filter((tkn: any, idx: number) => idx < acc.length - 1);
              const lastEntry = [...acc[acc.length - 1], token];
              return [
                ...currentAcc,
                lastEntry,
                ...(token.type === 'close' ? [[]] : [])
              ];
            }
            return [[token]];
          },
          []);

      return grouped;
    })
    .reduce(
      (acc: any, grouped: any) => {
        return [
          ...acc,
          ...grouped
            .filter((g: any) => g.length > 0)
            .map((g: any) =>
              g.map((tkn: any) => ({
                ...tkn,
                id: g[0].id
              }))
            )
        ];
      },
      []);

  const sortedTokens = [...listTokens]
    .sort((a: any, b: any) => {
      if (a[0].group === b[0].group) {
        return a[0].id > b[0].id ? 1 : -1;
      }
      return a[0].group > b[0].group ? 1 : -1;
    });

  const rules = getRules(sortedTokens);

  return {
    info: {
      ...infoTokens
    },
    pseudoSelectors: rules
      .map((obj: any) => {
        const { selectors, ...style } = obj;
        return {
          ...style,
          selectors: selectors.filter((selector: any) => selector.match(PSEUDOSELECTOR_REGEX))
        };
      })
      .filter((obj: any) => obj.selectors.length > 0),
    selectors: rules
      .map((obj: any) => {
        const { selectors, ...style } = obj;
        return {
          ...style,
          selectors: selectors.filter((selector: any) => !selector.match(PSEUDOSELECTOR_REGEX))
        };
      })
      .filter((obj: any) => obj.selectors.length > 0)
  };
};
