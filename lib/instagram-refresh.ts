import { exchangeToken, fetchSnapshot } from "@/lib/instagram";
import { getIgConfig, setIgConfig, setIgSnapshot, type IgSnapshot } from "@/lib/store";

export async function refreshInstagramSnapshot(): Promise<IgSnapshot> {
  const config = await getIgConfig();
  if (!config) throw new Error("Instagram não conectado.");

  if (config.tokenExpiresAt) {
    const msLeft = new Date(config.tokenExpiresAt).getTime() - Date.now();
    if (msLeft < 7 * 24 * 60 * 60 * 1000) {
      try {
        const { token, expiresIn } = await exchangeToken(config.appId, config.appSecret, config.token);
        config.token = token;
        config.tokenExpiresAt = expiresIn
          ? new Date(Date.now() + expiresIn * 1000).toISOString()
          : config.tokenExpiresAt;
        await setIgConfig(config);
      } catch {
        // Segue com o token atual; a busca abaixo retornará o erro real se ele não for mais válido.
      }
    }
  }

  const snapshot = await fetchSnapshot(config, 25);
  await setIgSnapshot(snapshot);
  return snapshot;
}
