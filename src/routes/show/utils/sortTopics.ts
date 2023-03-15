const _sortBy = require("lodash/sortBy");
import { IEpisodeTopic } from "../../../models/episodes.model";

export const sortTopics = (topics: IEpisodeTopic) => {
  const initSort = _sortBy(topics, "order");
  let finalSort: IEpisodeTopic[] = [];

  for (let i = 0; i < initSort.length; i++) {
    if (finalSort.includes(initSort[i])) {
    } else if (initSort[i].isParent === true) {
      finalSort.push(initSort[i]);
      let children = initSort.filter(
        (topic: IEpisodeTopic) =>
          topic.isChild === true && topic.parentId === initSort[i]._id
      );

      finalSort = finalSort.concat(children);
    } else {
      finalSort.push(initSort[i]);
    }
  }

  return finalSort;
};
