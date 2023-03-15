import { IEpisodeHost } from "../../../models/episodes.model";
import { IHost } from "../../../models/hosts.model";

const _map = require("lodash/map");

interface ISearchSocials {
  seatNum: number;
  name: string;
  socials: any[];
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
        socials: host.socials
      });
    }
  });

  return searchHost;
};
