import * as core from '@nessframework/core';
import * as cache from '@nessframework/cache';
import * as client from '@nessframework/core/client';
import * as config from '@nessframework/router';
import * as deployment from '@nessframework/deployment';
import * as font from '@nessframework/assets/font';
import * as image from '@nessframework/assets/image';
import * as imageServer from '@nessframework/assets/image/server';
import * as instrumentation from '@nessframework/instrumentation';
import * as metadata from '@nessframework/assets/metadata';
import * as responses from '@nessframework/server/responses';
import * as rsc from '@nessframework/core/rsc';
import * as server from '@nessframework/server';
import * as testing from '@nessframework/testing';
import * as vite from '@nessframework/router/vite';
import * as legacyCache from '@nessframework/core/cache';
import * as legacyConfig from '@nessframework/core/config';
import * as legacyImage from '@nessframework/core/image';
import * as legacyServer from '@nessframework/core/server';

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
