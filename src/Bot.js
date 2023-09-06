import { Client, GatewayIntentBits } from 'discord.js';
import Useful from './Useful.js';

class Bot {

  // set up intents to monitor
  intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildEmojisAndStickers
  ];

  constructor(name) {
    const useful = Useful.getInstance();
    const template = Template.getInstance();
    this.name = name;
    this.discord = new Client({ intents: this.intents });
    // Fetch a channel by its id
    this.token = useful.env[`BOT_${name}_TOKEN`];
    this.template = template.getTemplateByBot(this.name);

    this.discord.login(this.token);
    this.discord.on('ready', () => {
      console.log(`Logged in as ${this.discord.user.tag}!`);
    });
    useful.setAdminLogChannel(this.discord.channels.fetch(useful.adminLogChannelID));
    useful.setBardChannel(this.discord.channels.fetch(useful.BardChannelID));

  }

  async ask(question) {
    try {
      const submittedPrompt = `${this.template}\n\n${question}`;
      const chatCompletion = await useful.openai.complete({
        model: "gpt-4",
        prompt: submittedPrompt,
        maxTokens: 2048,
        temperature: 1.1,
        topP: 1,
        presencePenalty: 0.1,
        frequencyPenalty: 0.2
      });

      const responseText = chatCompletion.choices[0].text;
      const priority = parseFloat(responseText.split('\n')[0]);
      const text = responseText.split('\n')[1];

      return {
        bot: this,
        question: question,
        submittedPrompt: submittedPrompt,
        chatCompletion: chatCompletion,
        priority,
        text
      };
    } catch (error) {
      useful.adminLogChannel.send(`Error in Bot.ask for ${this.name}: ${error}`);
      return null;
    }
  }
}

export default Bot;
