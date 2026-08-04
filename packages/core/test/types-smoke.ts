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

/* @nessframework/components */
import {
  ClientOnly,
  Form as NessForm,
  NavigationProgress,
  Pagination,
  Pending,
  SearchField,
  Streamed,
  useActivity,
  useHydrated,
  useSearchParam,
  useSubmitOnChange,
} from '@nessframework/components';

const hydrated: boolean = useHydrated();
const activity = useActivity();
const busy: boolean = activity.busy;
const [query, setQuery] = useSearchParam('q', { defaultValue: '' });
setQuery('tigers');
setQuery(2);
setQuery(undefined);
const submitOnChange = useSubmitOnChange({ replace: true });

void hydrated;
void busy;
void query;
void submitOnChange;
void ClientOnly;
void NessForm;
void NavigationProgress;
void Pagination;
void Pending;
void SearchField;
void Streamed;
