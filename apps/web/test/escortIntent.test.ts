import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { fromBinary } from "@bufbuild/protobuf";
import { IntentEnvelopeSchema } from "@bitwars/shared/gen/intent_pb";
import { ENGINE_PROTOCOL_MAJOR } from "../src/lib/constants";
const mockedRedis = vi.hoisted(() => ({ get:vi.fn(async () => null), xaddBuffer:vi.fn(async (..._args:unknown[]) => "1-0") }));
vi.mock("@/lib/db/connection", () => ({ redis: mockedRedis }));
vi.mock("@/features/users/utils/auth", () => ({ requireAuthOr401: vi.fn(async () => ({auth:{playerId:"me"},res:null})) }));
vi.mock("@/features/users/server/session-state", () => ({getPlayerSessionState:vi.fn(async () => "active")}));
import { POST } from "../src/app/api/v1/intent/route";
afterEach(() => vi.clearAllMocks());
const body = { type:"Escort",entity_ids:[1,2],target_entity_id:10,
  client_cmd_id:"019237a0-0000-7000-8000-000000000001",client_seq:1,policy:"REPLACE_ACTIVE" };
const post = (payload: unknown) => POST(new NextRequest("http://localhost/api/v1/intent",{method:"POST",body:JSON.stringify(payload)}));

it("encodes a target entity reference with one authenticated group command",async () => {
  expect((await post(body)).status).toBe(200);
  const bytes=mockedRedis.xaddBuffer.mock.calls[0]![6] as Uint8Array;
  const envelope=fromBinary(IntentEnvelopeSchema,bytes);
  expect(envelope.playerId).toBe("me");
  expect(envelope.protocolVersion).toBe(ENGINE_PROTOCOL_MAJOR);
  expect(envelope.payload).toMatchObject({case:"escort",value:{entityIds:[1n,2n],targetEntityId:10n}});
});

it.each([
  {entity_ids:[]}, {entity_ids:[1,1]}, {entity_ids:[1,-2]}, {entity_ids:Array.from({length:257},(_,i)=>i+100)},
  {target_entity_id:1},{target_entity_id:0},{target_entity_id:1.5},{target_entity_id:"10"},
  {policy:"APPEND"},{policy:"CLEAR_THEN_APPEND"},{policy:"typo"},
])("rejects invalid Escort shape without enqueuing it: %j",async (change) => {
  expect((await post({...body,...change})).status).toBe(400);
  expect(mockedRedis.xaddBuffer).not.toHaveBeenCalled();
});
