import { Style } from 'geostyler-style';

const pointExternalGraphic: Style = {
  name: 'External graphic',
  rules: [{
    name: '',
    symbolizers: [{
      kind: 'Icon',
      image: 'http://geoserver.org/img/geoserver-logo.png',
      size: 10,
      rotate: 90
    }]
  }]
};

export default pointExternalGraphic;
