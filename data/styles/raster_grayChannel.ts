import { Style } from 'geostyler-style';

const rasterSimpleRaster: Style = {
    name: 'Raster gray channel',
    rules: [
        {
            name: 'Raster style',
            symbolizers: [
                {
                    kind: 'Raster',
                    opacity: 0.5,
                    colorMap: {
                        type: 'intervals',
                        colorMapEntries: [
                            {
                                color: '#00ffff',
                                quantity: 64,
                                label: 'label1',
                                opacity: 0.4
                            },
                            {
                                color: '#ff00ff',
                                quantity: 256,
                                label: 'label2',
                                opacity: 0.8
                            }
                        ]
                    },
                    channelSelection: {
                        grayChannel: {
                            sourceChannelName: '0',
                            contrastEnhancement: {
                                enhancementType: 'normalize',
                                gammaValue: 0.5
                            }
                        }
                    }
                }
            ]
        }
    ]
};

export default rasterSimpleRaster;