const _map = require("lodash/map");

import { IEpisodeSocials } from "../../../models/episodes.model";
import { ISocialNetworks } from "../../../models/socialNetworks.model";

interface ISearchSocials {
  order: number;
  site: string;
  username: string;
}

export const socialParser = (
  databaseSocials: ISocialNetworks[],
  episodeSocials: IEpisodeSocials[]
) => {
  const searchSocials: ISearchSocials[] = [];

  _map(episodeSocials, (epSocial: IEpisodeSocials) => {
    const social = databaseSocials.find(
      dbSocial =>
        dbSocial._id === epSocial.socialId ||
        String(dbSocial._id) === String(epSocial.socialId)
    );

    if (social) {
      searchSocials.push({
        order: epSocial.order,
        site: social.site,
        username: social.username
      });
    }
  });

  return searchSocials;
};
