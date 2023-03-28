const _sortBy = require("lodash/sortBy");
import { IEpisodeTopic } from "../../../models/episodes.model";

// export const sortTopics = (topics: IEpisodeTopic) => {
//   const initSort = _sortBy(topics, "order");
//   let finalSort: IEpisodeTopic[] = [];

//   for (let i = 0; i < initSort.length; i++) {
//     if (finalSort.includes(initSort[i])) {
//     } else if (initSort[i].isParent === true) {
//       finalSort.push(initSort[i]);
//       let children = initSort.filter(
//         (topic: IEpisodeTopic) =>
//           topic.isChild === true && topic.parentId === initSort[i]._id
//       );

//       finalSort = finalSort.concat(children);
//     } else {
//       finalSort.push(initSort[i]);
//     }
//   }

//   return finalSort;
// };

export const sortTopics = (topics: IEpisodeTopic[]) => {
  const initSort = _sortBy(topics, "order");
  let finalSort: IEpisodeTopic[] = [];

  for (let i = 0; i < initSort.length; i++) {
    if (initSort[i].isChild === true) {
      console.log(initSort[i].name, "is a child - top level");
    } else if (finalSort.includes(initSort[i])) {
      console.log(initSort[i].name, "already included");
    } else if (initSort[i].isParent === true) {
      finalSort.push(initSort[i]);
      console.log(initSort[i].name, "is a parent");

      initSort.map((topic: IEpisodeTopic) => {
        console.log(40, "cid:", initSort[i]._id, initSort[i].name);
        console.log(41, "pid:", topic.parentId);
        console.log(42, "isChild:", topic.isChild);
        console.log(
          43,
          "match:",
          String(topic.parentId) === String(initSort[i]._id)
        );

        console.log(49, "need false, is included:", finalSort.includes(topic));

        const shouldAdd =
          String(topic.parentId) === String(initSort[i]._id) &&
          topic.isChild === true;

        console.log(55, "shouldAdd:", shouldAdd);

        const shouldAdd2 =
          String(topic.parentId) === String(initSort[i]._id) &&
          topic.isChild === true &&
          !finalSort.includes(topic);

        console.log(62, "shouldAdd:", shouldAdd2);

        if (
          String(topic.parentId) === String(initSort[i]._id) &&
          topic.isChild === true
        ) {
          finalSort.push(topic);
          console.log(topic.name, "is a child AND is being added");
        }
      });
    } else {
      finalSort.push(initSort[i]);
    }
  }

  return finalSort;
};
