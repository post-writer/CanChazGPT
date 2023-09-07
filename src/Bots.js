import config from '../config.js'
import Bot from './Bot.js';


class Bots {
  static instance;
  static bots = {};

  constructor() {
    if (this.instance) {
      return this.instance;
    }
    Bots.bots = {
      TotallyHuman: new Bot('TotallyHuman'),
      RookieRaccoon: new Bot('RookieRaccoon')
    }
    Bots.client = Bots.bots['TotallyHuman'].discord;
    Bots.timer = null;

    Bots.client.on('messageCreate', async (m) => {
      // only main channel
      if (m.channel.id !== config.bard_channel_id) return;
      // only if someone else wrote it
      if (m.author.id === Bots.client.user.id) return;
      Bots.log(`${m.author.globalName}: ${m}`);
      if (Bots.timer) {
        Bots.timer.messages.push(m);
        return;
      }
      Bots.timer = setTimeout(async () => {
        Bots.askAll(Bots.timer.messages);
        Bots.timer = null;
      }, config.minimum_wait_before_querying_openai);
      Bots.timer.messages = [m];
    });
    this.instance = this;
    return this;
  }

  static async askAll(messages) {
    await messages;
    const text = await messages.map(m =>
      `${m.author.globalName}: ${m} `).join('\n');
    let total_priority = 0;

    // remember, each time we ask a bot, it will return an array of responses
    // we have to flatten them into a single array

    const responses = Object.values(Bots.bots).map(b => b.ask(text));

    // wait for all the bots to respond
    const settledResponses = await Promise.allSettled(responses);
    const flattenedResponses = settledResponses
      .filter(response => response.status === 'fulfilled')
      .flatMap(response => response.value);

    // sort the responses by priority
    const selected_responses = flattenedResponses.sort((a, b) => b.priority - a.priority).map(r => {
      if ((r.priority === 1) ||
        (total_priority <= config.max_priority_sum) &&
        (r.priority !== 0)) {
        total_priority =+ r.priority;
        r.bot.send(r.text, r.priority);
        return r.text;
      } else {
        r.bot.log(`${r.bot.name}: priority ${r.priority} discarded ${r.text}`);
      }
    });
    return selected_responses;
  }
  static async getInstance() {
    if (!Bots.instance) {
      Bots.instance = new Bots();
    }
    return await Bots.instance;
  }

  static async log(text) {
    console.log(text);
    return Bots.client.channels.cache.get(config.adminlog_channel_id).send(text);
  }
}

export default Bots;
