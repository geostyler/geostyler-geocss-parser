import { Style } from 'geostyler-style';

const rasterSimpleRaster: Style = {
    name: 'Raster rgb channels',
    rules: [
        {
            name: 'Raster style',
            symbolizers: [
                {
                    kind: 'Raster',
                    opacity: 0.5,
                    colorMap: {
                        type: 'ramp',
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
                        redChannel: {
                            sourceChannelName: '0',
                            contrastEnhancement: {
                                enhancementType: 'histogram',
                                gammaValue: 0.5
                            }
                        },
                        greenChannel: {
                            sourceChannelName: '1',
                            contrastEnhancement: {
                                enhancementType: 'histogram',
                                gammaValue: 0.5
                            }
                        },
                        blueChannel: {
                            sourceChannelName: '2',
                            contrastEnhancement: {
                                enhancementType: 'histogram',
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