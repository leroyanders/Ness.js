import transformRuntime from '@babel/plugin-transform-runtime';
import presetEnv from '@babel/preset-env';
import presetReact from '@babel/preset-react';
import presetTypescript from '@babel/preset-typescript';
import removePropTypes from 'babel-plugin-transform-react-remove-prop-types';

export default function nessPreset(api, options = {}) {
  const caller = api.caller(value => {
    if (!value) return 'unknown';
    return JSON.stringify({
      isServer: Boolean(value.isServer),
      supportsStaticESM: Boolean(value.supportsStaticESM),
    });
  });
  const callerOptions = caller === 'unknown' ? {} : JSON.parse(caller);
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  const presetEnvOptions = {
    modules: 'auto',
    ...(options['preset-env'] || {}),
  };

  if ((callerOptions.isServer || isTest) && !presetEnvOptions.targets) {
    presetEnvOptions.targets = { node: 'current' };
  }

  return {
    sourceType: 'unambiguous',
    presets: [
      [presetEnv, presetEnvOptions],
      [
        presetReact,
        {
          runtime: 'automatic',
          development: !isProduction,
          ...(options['preset-react'] || {}),
        },
      ],
      options['preset-typescript'] !== false && [
        presetTypescript,
        {
          allowNamespaces: true,
          ...(options['preset-typescript'] || {}),
        },
      ],
    ].filter(Boolean),
    plugins: [
      [
        transformRuntime,
        {
          absoluteRuntime: true,
          ...(options['transform-runtime'] || {}),
        },
      ],
      isProduction && [removePropTypes, { removeImport: true }],
    ].filter(Boolean),
  };
}
