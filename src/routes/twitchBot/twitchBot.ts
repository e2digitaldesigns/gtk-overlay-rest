export async function isUserConnected(client: any, username: string) {
  const channels = client.getChannels();
  return channels.some((channel: any) => channel.slice(1) === username);
}
