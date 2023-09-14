type StringReplacement = {
  stringToReplace: string;
  replacement: string;
};

export function twitchChatParser(
  message: string,
  emotesMap: { [key: string]: string[] } | null
) {
  const emotesArr =
    typeof emotesMap === "object" && emotesMap ? Object.entries(emotesMap) : [];
  if (!emotesArr.length) return message;
  const stringReplacements: StringReplacement[] = [];
  let messageHTML = "";

  emotesArr.forEach(emote => {
    const id = emote[0];
    const positions = emote[1][0];
    const [start, end] = positions.split("-");

    const stringToReplace = message.substring(
      parseInt(start, 10),
      parseInt(end, 10) + 1
    );

    stringReplacements.push({
      stringToReplace: stringToReplace,
      replacement: `https://static-cdn.jtvnw.net/emoticons/v1/${id}/1.0`
    });

    messageHTML = stringReplacements.reduce(
      (
        acc: string,
        {
          stringToReplace,
          replacement
        }: { stringToReplace: string; replacement: string }
      ) => {
        return acc.split(stringToReplace).join(replacement);
      },
      message
    );
  });
  return messageHTML;
}
