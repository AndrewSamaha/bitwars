import { Axiom } from '@axiomhq/js';

const axiomClient = new Axiom({
  token: process.env.AXIOM_TOKEN!,
  orgId: process.env.AXIOM_ORG_ID,
});

export default axiomClient;
