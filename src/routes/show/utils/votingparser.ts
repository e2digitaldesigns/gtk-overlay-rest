import { IEpisodeTopic } from "../../../models/episodes.model";

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
  if (!matches) return [];

  const regex = /{{VOTING::([\w\s]+)::([\w\s]+)}}/;
  const matchResult = matches[0].match(regex);

  if (!matchResult) return [];

  // use regex to return all values wrapped in {{}}
  const valueString = string.replace(regexString, "");
  const valueRegex = /{{(.*?)}}/g;
  const valueMatches = valueString.match(valueRegex);

  if (!valueMatches) return [];

  const values = valueMatches?.map(match => match.replace(/{{|}}/g, ""));

  const [, label1, label2] = matchResult;

  if (!values) return [];

  const options = [
    {
      label: label1,
      value: values[0]
    },
    { label: label2, value: values[1] }
  ];

  return options;
}
