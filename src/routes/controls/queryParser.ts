const _map = require("lodash/map");
const _replace = require("lodash/replace");
const _split = require("lodash/split");
const _slice = require("lodash/slice");

export function queryParser(url: string) {
  const paramArr: { [key: string]: string } = {};

  let rawParams = _replace(url, "?", "&");
  rawParams = _split(rawParams, "&");
  rawParams = _slice(rawParams, 1);

  _map(rawParams, (m: string) => {
    let pair = _split(m, "=");
    if (pair[0] !== "type") {
      paramArr[pair[0]] = decodeURIComponent(pair[1]);
    }
  });

  return paramArr;
}
