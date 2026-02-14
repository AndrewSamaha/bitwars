import { redirect } from "next/navigation";
import { requireAuthOrRedirect } from "@/features/users/utils/auth";
import { getPlayerById } from "@/features/users/queries/read/getPlayerById";
import ClientGamePage from "./ClientGamePage";

/**
 * Server component: load the current player so the client tree gets initialPlayer.
 * This avoids the Strict Mode remount race where the second mount had no player
 * and GameStreamGate redirected to /.
 */
export default async function PlayPage() {
  const auth = await requireAuthOrRedirect("/");
  const player = await getPlayerById(auth.playerId);
  if (!player) redirect("/");
  // Serialize for RSC -> client: dates become ISO strings
  const initialPlayer = {
    ...player,
    createdAt: player.createdAt.toISOString(),
    lastSeen: player.lastSeen.toISOString(),
  };

  return <ClientGamePage initialPlayer={initialPlayer} />;
}
