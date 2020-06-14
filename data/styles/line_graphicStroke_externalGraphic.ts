import { Style } from 'geostyler-style';

const lineSimpleLine: Style = {
  name: 'Line with external graphic',
  rules: [{
    name: '',
    symbolizers: [{
      kind: 'Line',
      width: 3,
      dasharray: [13, 37],
      cap: 'round',
      join: 'miter',
      graphicStroke: {
        kind: 'Icon',
        image: 'http://geoserver.org/img/geoserver-logo.png',
        size: 10,
        rotate: 90
      }
    }]
  }]
};

export default lineSimpleLine;
