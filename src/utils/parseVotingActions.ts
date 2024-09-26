export function parseAction(command: string): string | undefined {
  const action = command.split(" ")?.[0];
  let actionValue = undefined;

  const actionObj: { [key: string]: string } = {
    "!1": "1",
    "!2": "2",
    "!v": "add",
    "!sv": "super",
    "!d": "remove",
    "!true": "true",
    "!false": "false",
    "!yes": "yes",
    "!no": "no",
    "!win": "win"
  };

  const keys = Object.keys(actionObj);

  for (const key of keys) {
    if (action.startsWith(key.toLowerCase())) {
      actionValue = actionObj?.[key.toLowerCase()];
      break;
    }
  }

  return actionValue;
}
