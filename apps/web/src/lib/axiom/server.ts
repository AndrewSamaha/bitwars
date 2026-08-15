import axiomClient from '@/lib/axiom/axiom';
import { Logger, AxiomJSTransport, type Transport } from '@axiomhq/logging';
import { createAxiomRouteHandler, nextJsFormatters } from '@axiomhq/nextjs';

const axiomToken = process.env.AXIOM_TOKEN?.trim();
const noopTransport: Transport = { log: () => undefined, flush: () => undefined };

export const logger = new Logger({
  // An empty transport list is an intentional local-development no-op. Do not
  // construct a transport with an empty token: it repeatedly flushes to Axiom
  // and produces noisy 403 Forbidden errors in the Next.js terminal.
  transports: axiomToken
    ? [new AxiomJSTransport({ axiom: axiomClient, dataset: process.env.AXIOM_DATASET! })]
    : [noopTransport],
  formatters: nextJsFormatters,
});

// Cast to avoid private field type identity mismatch when multiple copies of
// @axiomhq/logging are installed by the package manager.
export const withAxiom = createAxiomRouteHandler(logger);
