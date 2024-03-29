import React from 'react';
import { Router } from '../router';
import { render, useRefresh, useRoot, useContainer } from 'nessapp/client/dom';

// tailwind
import 'ness-tailwind/styles/base.scss';

// prefer to use this instead classic React DOM function,
// because it will discard server-side fetching
render({
    document: useRoot(<Router/>),
    root: useContainer(document.getElementById('root')),
    module: useRefresh(module)
});