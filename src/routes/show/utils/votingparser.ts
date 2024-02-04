import {
  IEpisodeTopic,
  IEpisodeTopicVotingOptions
} from "../../../models/episodes.model";

export const votingParser = (topics: IEpisodeTopic[]) => {
  topics.map(topic => {
    if (topic?.desc) {
      topic.votingOptions = labelParser(topic.desc);
      topic.desc = topic.desc.replace(/{{VOTING::.*}}/g, "");
    }
  });

  return topics;
};

function labelParser(string: string) {
  if (!string) return [];

  const regexString = /{{VOTING::\w+(\s\w+)*::\w+(\s\w+)*}}/g;

  const matches = string.match(regexString);
  console.log(matches);
  if (!matches) return [];

  const regex = /{{VOTING::([\w\s]+)::([\w\s]+)}}/;

  const matchResult = matches[0].match(regex);

  console.log(matchResult);

  if (!matchResult) return [];

  const [, label1, label2] = matchResult;

  console.log({ label1, label2 });

  const options = [
    {
      label: label1,
      value: true
    },
    { label: label2, value: false }
  ];

  console.log("xxxxx xxxxx xxxxx");
  console.log(options);
  console.log("xxxxx xxxxx xxxxx");

  return options;
}
