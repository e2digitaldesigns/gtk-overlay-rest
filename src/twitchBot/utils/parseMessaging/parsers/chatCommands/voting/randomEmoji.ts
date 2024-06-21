export function randomEmoji(action: string): string {
  const addEmojis = [
    "👍",
    "😂",
    "💕",
    "🫠",
    "🔥",
    "🥳",
    "🙌",
    "😘",
    "😍",
    "🥰",
    "🤗",
    "😎",
    "🤩",
    "😋",
    "😛"
  ];
  const removeEmojis = [
    "👎",
    "😵",
    "🤢",
    "😒",
    "🤮",
    "🤐",
    "🧊",
    "🤬",
    "👿",
    "👺",
    "😠",
    "😡",
    "😖",
    "😫",
    "😩"
  ];
  const superEmojis = [
    "♨️",
    "❤️‍🔥",
    "♨️",
    "❤️‍🔥",
    "♨️",
    "❤️‍🔥",
    "♨️",
    "❤️‍🔥",
    "♨️",
    "❤️‍🔥",
    "🔥",
    "💥",
    "⭐",
    "✨",
    "💫"
  ];

  const emojiSets: { [key: string]: string[] } = {
    add: addEmojis,
    remove: removeEmojis,
    super: superEmojis.concat(addEmojis)
  };

  const emojis = emojiSets[action];
  const randomIndex = Math.floor(Math.random() * emojis.length);

  return emojis[randomIndex];
}
