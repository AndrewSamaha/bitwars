import ClientGamePage from "@/app/play/ClientGamePage";
import { getPlayerById } from "@/features/users/queries/read/getPlayerById";
import { getOptionalAuth } from "@/features/users/utils/auth";

export default async function BitWarsPage() {
  const auth = await getOptionalAuth();
  const player = auth ? await getPlayerById(auth.playerId) : null;
  const initialPlayer = player
    ? {
        ...player,
        createdAt: player.createdAt.toISOString(),
        lastSeen: player.lastSeen.toISOString(),
      }
    : null;

  return <ClientGamePage initialPlayer={initialPlayer} />;
}
