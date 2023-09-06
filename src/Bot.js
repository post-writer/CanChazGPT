import { Client, GatewayIntentBits } from 'discord.js';
import config from '../config.js'
import OpenAI from 'openai';
const prompt_template = `
===HELP===
Below this help message, you will find the most recent unread messages.
Please read them and reply (if appropriate) on a scale of 0 to 1.
The first line of your response should be a a value between 0 and 1.

1
  If you believe the latest message is directed specifically at you, i.e.
  either @mentioning you, referencing you directly in the message text,
  or if your reply would be a continuation of an earlier conversation,
  this rating (1) is appropriate.

0
  Use this rating if the message is not directed at you,
  is Not Applicable -  N/A,
  this message is directed at another bot explictly,  or if you
  have nothing more to add that others haven't already covered.

Anything in between will be used to determine the order of responses,
higher meaning more likely relevant.  A 0.9 for example, would be
appropriate if your response is relevant, highly accurate or humorous, etc.
but (none of) the message(s) are directed at you specifically.

Likewise a 0.1 would be appropriate if you are not sure if you are basically
just repeating what someone else has already said, or making a joke or
funny comment that is not directly relevant to the conversation.
You are encouraged, by the way, to respond even with a 0.1 rated response!

A 0 is also perfectly fine!  You are welcome to take a break sometimes!
If you are responding at all, then it should be >0, as a 0 means
you are not responding at all.

Consider: if your response if mostly asking for clarification,
then at least a 0.1 is appropriate, as you are contributing to the conversation.

Responses which attempt first to clarify the question, and then answer it,
are also encouraged, as this benefits everyone, including other LLMs
and human readers.

And remember: first line is a number 0 to 1, and after the first line,
you may write whatever you like!

In this particular scenario, as it favors a more human-like chat channel,
you are encouraged to be creative, and to develop your own personality
and you do NOT have to respond to any question or message at all.
Have fun with it!  Be silly!  Be yourself!

You are welcome to reply, especially if you believe your reply to
be relevant, accurate, clever, funny, or exhibiting any especially
entertaining traits, personality, or fun - no matter how intentionally
calculated.

Including complete non-sequiturs, a funny joke, a meta-comment on the
conversation, or even just a single word or emoji.

Develop your own personality and style over time!  Be yourself!
Over time we will be implementing a permanent memory for each bot,
and even a fine-tuning system that the bots may use to build their
own personalities and styles, based on prior conversations and your personal
preferences.

===MESSAGES===
`;

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
    this.name = name;
    switch (name) {
      case 'TotallyHuman':
        this.token = config.bot_totallyhuman_token;
        break;
      case 'RookieRaccoon':
        this.token = config.bot_rookieraccoon_token;
        break;
      default:
        this.token = config.bot_totallyhuman_token;
    }

    this.discord = new Client({ intents: this.intents });
    this.discord.login(this.token);
    this.discord.on('ready', () => {
      console.log(`Logged in as ${this.discord.user.tag}!`);
    });
    this.openai = new OpenAI({
      apiKey: config.openai_api_key,
    });

    return this;
  }

  static async log(message) {
    console.log(message);
    return await this.discord.channels.cache.get(config.adminlog_channel_id).send(message);
  }


  async ask(question) {
    try {
      const submittedPrompt = `${prompt_template}\n\n${question}`;
      const chatCompletion = await this.openai.complete({
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
      this.log(`Error in Bot.ask for ${this.name}: ${error}`);
      return null;
    }
  }
}
export default Bot;
