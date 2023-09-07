import { Client, GatewayIntentBits } from 'discord.js';
import config from '../config.js'
import OpenAI from 'openai';

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
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.MessageContent
  ];

  constructor(name) {
    this.name = name;
    this.token = config.tokens[name];
    this.template = config.prompts[name];

    this.discord = new Client({ intents: this.intents });
    this.discord.login(this.token);
    this.discord.on('ready', () => {
      this.log(`Logged in as ${this.discord.user.tag}!`);
    });
    this.openai = new OpenAI({
      apiKey: config.openai_api_key,
    });

    return this;
  }

  async log(text) {
    if (!this.adminlog_channel) {
      this.adminlog_channel = this.discord.channels.cache.get(config.adminlog_channel_id);
    }
    try {
      await this.adminlog_channel.send(text);
    } catch (e) {
      console.log(`${e}\n\n${text}`);
    }
  }

  async send(text, priority = 1) {
    if (!this.bard_channel) {
      this.bard_channel = this.discord.channels.cache.get(config.bard_channel_id);
    }
    try {
      await this.bard_channel.send(text);
      this.log(`${this.name}: priority ${priority} responded with ${text}`);
    } catch (e) {
      console.log(`${e}\n\n${text}`);
    }
  }


  async ask(question) {
    const chatCompletions = await this.openai.chat.completions.create({
      messages: [{
        role: "system",
        content: this.system_prompt
      },
      {
        role: "user",
        content: question
      }],
      model: "gpt-4",
      max_tokens: 2048,
      n: 1,
      temperature: 1.1,
      top_p: 1,
      presence_penalty: 0.2,
      frequency_penalty: 0.1
    });

    const responses = chatCompletions.choices.map(element => {
      return {
        bot: this,
        question: question,
        template: prompt_template,
        chatCompletion: element,
        priority: parseFloat(element.message.content.split('\n')[0]),
        text: element.message.content.split('\n')[1]
      };
    });
    return responses;
  }
}
export default Bot;
