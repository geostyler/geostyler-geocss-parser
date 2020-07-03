import { Style } from 'geostyler-style';

const lineSimpleLine: Style = {
  name: 'Line with symbol',
  rules: [{
    name: '',
    symbolizers: [{
      kind: 'Line',
      width: 3,
      dasharray: [13, 37],
      cap: 'round',
      join: 'miter',
      graphicStroke: {
        kind: 'Mark',
        wellKnownName: 'Circle',
        color: '#FF0000',
        radius: 3.5
      }
    }]
  }]
};

export default lineSimpleLine;
