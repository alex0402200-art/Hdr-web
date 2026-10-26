import { json, getLoggedInUser } from '../_utils.js';

export async function onRequestGet({ request, env }) {
  const username = await getLoggedInUser(request, env);
  return json({ loggedIn: !!username, username });
}
