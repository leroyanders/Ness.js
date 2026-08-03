import * as core from '@ness/core';
import * as cache from '@ness/cache';
import * as client from '@ness/core/client';
import * as config from '@ness/router';
import * as deployment from '@ness/deployment';
import * as font from '@ness/assets/font';
import * as image from '@ness/assets/image';
import * as imageServer from '@ness/assets/image/server';
import * as instrumentation from '@ness/instrumentation';
import * as metadata from '@ness/assets/metadata';
import * as responses from '@ness/server/responses';
import * as rsc from '@ness/core/rsc';
import * as server from '@ness/server';
import * as testing from '@ness/testing';
import * as vite from '@ness/router/vite';
import * as legacyCache from '@ness/core/cache';
import * as legacyConfig from '@ness/core/config';
import * as legacyImage from '@ness/core/image';
import * as legacyServer from '@ness/core/server';

export const publicTypeSurface = {
  cache,
  client,
  config,
  core,
  deployment,
  font,
  image,
  imageServer,
  instrumentation,
  legacyCache,
  legacyConfig,
  legacyImage,
  legacyServer,
  metadata,
  responses,
  rsc,
  server,
  testing,
  vite,
};
