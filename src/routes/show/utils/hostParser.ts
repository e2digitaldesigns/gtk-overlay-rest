import { IEpisodeHost } from "../../../models/episodes.model";
import { IHost } from "../../../models/hosts.model";

const _map = require("lodash/map");

interface ITickerWithTitles {
  title: string;
  text: string;
}
interface ISearchSocials {
  seatNum: number;
  name: string;
  socials: any[];
  ticker: string[];
  tickerWithTitles: ITickerWithTitles[];
}

export const hostParser = (
  databaseHost: IHost[],
  episodeHost: IEpisodeHost[]
) => {
  const searchHost: ISearchSocials[] = [];

  _map(episodeHost, (epHost: IEpisodeHost) => {
    const host = databaseHost.find(
      dbHost =>
        dbHost._id === epHost.hostId ||
        String(dbHost._id) === String(epHost.hostId)
    );

    if (host) {
      searchHost.push({
        seatNum: epHost.seatNum,
        name: host.name,
        socials: host.socials,
        ticker: host.socials
          .map((social: any) => `${social.site}: ${social.username}`)
          .concat(host.name),
        tickerWithTitles: host.socials
          .map((social: any) => ({
            title: social.site,
            text: social.username
          }))
          .concat({ title: "Host", text: host.name })
      });
    }
  });

  return searchHost;
};
