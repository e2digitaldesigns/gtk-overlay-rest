export const getIdFromUrl = (string: string): string | undefined => {
  const reg = new RegExp("^(http(s)?://)?((w){3}.)?youtu(be|.be)?(.com)?/.+");

  console.log(reg.test(string));

  if (!reg.test(string)) return undefined;
  let starter = string.split("v=")[1] || string.split(".be/")[1];
  starter = starter.split(/[&?]/)[0];

  return starter.trim();
};
