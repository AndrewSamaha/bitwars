import axiomClient from '@/lib/axiom/axiom';
import { Logger, AxiomJSTransport } from '@axiomhq/logging';
import { createAxiomRouteHandler, nextJsFormatters } from '@axiomhq/nextjs';

export const logger = new Logger({
  transports: [
    new AxiomJSTransport({ axiom: axiomClient, dataset: process.env.AXIOM_DATASET! }),
  ],
  formatters: nextJsFormatters,
});

// Cast to avoid private field type identity mismatch when multiple copies of
// @axiomhq/logging are installed by the package manager.
export const withAxiom = createAxiomRouteHandler(logger);