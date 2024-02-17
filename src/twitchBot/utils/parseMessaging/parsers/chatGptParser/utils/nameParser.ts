function parseName(name: string | string[]) {
  if (typeof name === "string") return name;
  return name[Math.floor(Math.random() * name.length)];
}

export { parseName };
