// Source imports
import { Log } from "../classes/Log";
import { channelType, getChannel, getFromDB } from "../util/utils";

/**
 * Log class instance used everywhere in the bot
 */
export let log = new Log();

export const shuxSvId = process.env.GUILD!.toString();

/**
 * Channels object
 * { id: { type: number, skip: boolean } }
 */
export let channels: any;

/**
 * Roles object
 * { rolename: { id: string, perms: string } }
 */
export let roles: any;

/**
 * Reactions object
 * { msgId: { reaction1: { role: string, remove: boolean, ticket: boolean } } }
 */
export let reactions: any;

/**
 * Colors object
 * { color: { id: string, level: number, perms: 'color' } }
 */

export let colors: any;

export type data = "channels" | "roles" | "reactions";

/**
 * Refreshes data
 * @param {string} data - The data to be refreshed (channels | roles | reactions)
 * @returns {Promise<any>} RefreshedData
 */

export const refreshData = async (data: data): Promise<void> => {
  let refreshedData = await getFromDB(`server/${data}`);

  if (data == "channels") {
    channels = refreshedData;
    let logsChannel = getChannel(undefined, channelType.logs);
    if (logsChannel && !log.isLoggeable) log.isLoggeable = true;
  } else if (data == "reactions") reactions = refreshedData;
  else [roles, colors] = sortRoles(refreshedData);

  log.warn(`Se ha actualizado la referencia: server/${data}`);
};

/**
 * Sorts roles and colors
 * @param {any} rolesObject - The roles object
 * @returns {[any, any]} - Array with roles and colors [roles, colors]
 */

export const sortRoles = (rolesObject: any): [any, any] => {
  let roles: any = {};
  let colors: any = {};

  for (let role in rolesObject) {
    if (rolesObject[role].perms == "color") {
      colors[role] = rolesObject[role];
    } else {
      roles[role] = rolesObject[role];
    }
  }

  return [roles, colors];
};

/**
 * Starts SHUX basic processes
 * - Gets and sorts data from database
 * @async
 * @returns {void} Nothing
 */

export const initialize = async (): Promise<void> => {
  let initLog = "Starting...\n\n";

  // Channels
  await refreshData("channels");
  initLog += "Channels:\n";

  for (let chId in channels) {
    initLog += `
	  ${chId} - <#${chId}>
      - type: ${channels[chId].type}
	  - skip: ${channels[chId].skip}`;
  }

  // Roles
  await refreshData("roles");
  initLog += "\nRoles:\n";

  for (let r in roles) {
    initLog += `
	  Nivel: ${roles[r].perms}
	    - <@&${roles[r].id}>
		- id: ${roles[r].id}`;
  }

  // Reactions
  await refreshData("reactions");
  initLog += "\nReactions:\n";

  for (let message in reactions) {
    initLog += `
	  ${message}
	  `;

    for (let reaction in reactions[message]) {
      initLog += `${reaction}
		- role: <@&${reactions[message][reaction].role}>
		- remove: ${reactions[message][reaction].remove}
		- ticket: ${reactions[message][reaction].ticket}
		`;
    }
  }

  log.warn(initLog);
};

/** Object containing warning messages */
export const warningMessages = {
  wrongChannel: {
    cmds: [
      "recuerda utilizar correctamente los canales!",
      "oops! los comandos van en el canal de comandos!",
    ],
  },
  flood: [
    "escribe más despacio!",
    "oops! no te excedas enviando mensajes tan rápido!",
  ],
  emojiFlood: [
    "cuidado, demasiados emojis!",
    "no uses tantos emojis, floodeas el chat!",
  ],
  invite: [
    "están prohibidas las invitaciones a servidores de discord!",
    "no spammees con invitaciones a servidores de discord!",
  ],
};

/** Message to be sent when a new ticket is created */
export const ticketMessage = ` **Su ticket ha sido abierto.**
  Para cerrar el ticket: reaccione de nuevo en el mismo canal desde el que abrió el ticket.

  Recuerda enviar directamente el **problema** y las **specs** del dispositivo.
  En caso de que necesite ayuda con un **presupuesto**, indique la moneda y el país.

  Por favor espere a que un técnico este libre!

  Si el ticket no cumple con estos requisitos será cerrado en las próximas 12 horas.`;
