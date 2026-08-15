'use client';

import { Logger, ProxyTransport, type Transport } from '@axiomhq/logging';
import { createUseLogger, createWebVitalsComponent } from '@axiomhq/react';

const enableProxyLogging = process.env.NODE_ENV !== 'development';
const noopTransport: Transport = { log: () => undefined, flush: () => undefined };

export const logger = new Logger({
  // Server-only Axiom credentials are deliberately not exposed to the browser.
  // Keep development logging local/no-op instead of repeatedly proxying events
  // to a server transport that has no token configured.
  transports: enableProxyLogging
    ? [new ProxyTransport({ url: 'http://localhost:3000/api/axiom', autoFlush: true })]
    : [noopTransport],
});

const useLogger = createUseLogger(logger);
const WebVitals = createWebVitalsComponent(logger);

export { useLogger, WebVitals };
