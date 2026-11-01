import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createEntity } from "@/app/api/content/entities/route";
import { PUT as updateEntity } from "@/app/api/content/entities/[entityId]/route";
import { POST as uploadAsset } from "@/app/api/content/entities/[entityId]/asset/route";
import { POST as createTechnology } from "@/app/api/content/technologies/route";
import { PUT as updateTechnology } from "@/app/api/content/technologies/[technologyId]/route";
import { POST as publishSprite } from "@/app/api/content/sprites/[entityId]/[requestId]/[candidateId]/publish/route";
import { POST as publishMasks } from "@/app/api/content/sprite-library/masks/publish/route";
import { POST as transformSprite } from "@/app/api/content/sprite-library/transform/route";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), mutate: vi.fn() }));
vi.mock("@/features/users/utils/auth", () => ({ requireAuthOr401: mocks.auth }));
vi.mock("@/lib/content/contentRevisions", () => ({
  mutateContentResponse: mocks.mutate,
  mutateContentAndReload: mocks.mutate,
}));

beforeEach(() => {
  mocks.auth.mockReset().mockImplementation(async () => ({
    auth: null, res: Response.json({ error: "Unauthorized" }, { status: 401 }),
  }));
  mocks.mutate.mockReset();
});

const request = () => new Request("http://localhost/api/content/editor", { method: "POST", body: "malformed body must not be parsed before authentication" });
const routes: { name: string; call: () => Promise<Response> }[] = [
  { name: "entity creation", call: () => createEntity(request()) },
  { name: "entity update", call: () => updateEntity(request(), { params: Promise.resolve({ entityId: "worker" }) }) },
  { name: "entity asset upload", call: () => uploadAsset(request(), { params: Promise.resolve({ entityId: "worker" }) }) },
  { name: "technology creation", call: () => createTechnology(request()) },
  { name: "technology update", call: () => updateTechnology(request(), { params: Promise.resolve({ technologyId: "research" }) }) },
  { name: "sprite publication", call: () => publishSprite(request(), { params: Promise.resolve({ entityId: "worker", requestId: "request", candidateId: "candidate" }) }) },
  { name: "mask publication", call: () => publishMasks(request()) },
  { name: "library transformation", call: () => transformSprite(request()) },
];

describe("live content mutation authorization", () => {
  it.each(routes)("requires authentication before $name touches content", async ({ call }) => {
    const response = await call();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
});
