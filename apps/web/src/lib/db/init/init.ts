import { flushdb } from "./01.flushdb";
import { createEntityIndex } from "@/features/gamestate/schema/init";
import { createPlayerIndex } from "@/features/users/schema/init";

export default async function init() {
  await flushdb();
  await createEntityIndex();
  await createPlayerIndex();
}
  