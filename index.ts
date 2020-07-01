// DiscordJs API
import * as djs from 'discord.js'

// My own imports
import { runCheck } from './src/checks'
import { Config } from './src/configs'
import { initGetHelp } from './src/getHelp'
import { Command } from './src/helpers'
import { leniencyHandler } from './src/leniencies'

let commands: Command[] = [
  new Command(
    [`go`, `run`],
    `runs the greeter check`,
    `go`,
    runCheck
  ),
  new Command(
    [`leniency`, `external`],
    `Adds or removes a user or role from the external conditions leniency`,
    `leniency <add / remove / get> <user id [optional on get]>`,
    leniencyHandler
  ),
  new Command(
    [`ping`],
    `Responds with 'pong'`,
    `ping`,
    function (params, msg, cmd, config) {
      msg.reply(`> Pong!!`)
        .catch(err => console.error(`unable to send pong due to: ${err}`))
    }
  )
]

/**
 * Selects the correct handler from the commands array - if 2 commands have the same name,
 * the latter in the array will be chosen
 * @param msg the message that was sent
 */
async function messageHandler(msg: djs.Message) {
  const config = Config.getInstance()

  if (!commands.some(c => c.names.includes(`help`))) {
    initGetHelp(commands)
  }

  if (msg.mentions.members.has(msg.client.user.id)) {
    let authorised = msg.guild.members.resolve(msg.author.id).roles.cache.has(config.controlRole)
    msg.reply(`Hi there! My prefix is \`${config.prefix}\`${
      authorised ? `` : ` - But you can't use me as you dont have my management role!`
      }`)
  }

  // Check prefix
  if (!msg.content.startsWith(config.prefix)) {
    return;
  }
  console.log(`Handling message > ${msg.content}`);

  // Checl if DM
  if (msg.channel.type !== `text`) {
    msg.reply(`I can only be used in our mutual server... Try summoning me there!!`)
    return
  }

  // Check allowed usage
  let author = msg.guild.members.resolve(msg.author.id)
  author = await author.fetch()
  if (!author.roles.cache.has(config.controlRole)) {
    msg.reply(`You don't have permission to use this bot`)
      .catch(err => console.error(`unable to send permission failure message due to: ${err}`))
    return
  }

  // Remove prefix and parameterise
  let withoutPrefix = msg.content.substring(config.prefix.length)
  // no params
  if (withoutPrefix.length == 0) {
    return;
  }
  let params: string[] = withoutPrefix.split(` `)

  // Find command
  let res: Command = undefined
  commands.forEach(c => res = c.names.includes(params[0]) ? c : res)

  // If no command found
  if (res === undefined) {
    console.log(`command ${params[0]} not found`)
    msg.reply(`**${params[0]}** is not a command!`)
      .catch(err => console.error(`unable to send response: ${err}`))
    return
  }

  // Handle command
  res.handler(params, msg, res, config)
}

function main() {
  const config = Config.getInstance()

  // Connectify
  let client = new djs.Client({ ws: { intents: djs.Intents.ALL } });
  client.once('ready', () => {
    console.log(`GTrace Ready!`)
    console.log(`Invite me using 'https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=268504064'`)

    let pd: djs.PresenceData = {
      activity: {
        name: 'the greeter team!',
        type: 'WATCHING',
        url: 'https://github.com/Nightmarlin/gtrace'
      },
      status: 'online'
    }
    client.user.setPresence(pd)
  })

  client.on('message', messageHandler)

  client.login(config.token)

}

main()
