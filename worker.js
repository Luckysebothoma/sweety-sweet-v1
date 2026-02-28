import { getAssetFromKV } from "@cloudflare/kv-asset-handler";

addEventListener("fetch", event => {
  event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
  try {
    const response = await getAssetFromKV(event);
    return response;
  } catch (e) {
    return new Response("Not found", { status: 404 });
  }
}
