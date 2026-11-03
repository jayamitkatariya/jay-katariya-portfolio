// decodeURIComponent throws URIError on a stray or cut-off escape ("/writing/50%off",
// a link a chat app truncated mid "%E2%80"). Those reach render/effects from the url,
// so a throw there would put the whole page on the error panel; keep the raw text instead.
export function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
