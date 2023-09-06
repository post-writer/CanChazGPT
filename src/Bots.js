import config from '../config.json';
import Bot from './Bot.js';

class Bots {
  static instance;
  static bots = {};

  constructor() {
    if (this.instance) {
      return this.instance;
    }
    this.bots = {
      TotallyHuman: new Bot('TotallyHuman', config.bot_rookieraccoon_token),
      RookieRaccoon: new Bot('RookieRaccoon', config.bot_rookieraccoon_token)
    }
    this.client = this.bots['TotallyHuman'].discord;
    this.client.on('messageCreate', async (m) => {
      if (m.channel.id !== config.bard_channel_id) return;
      if (this.timer) {
        this.timer.messages.push(m);
        return;
      }
      this.timer = setTimeout(async () => {
        Bots.askAll(this.timer.messages);
        this.timer = null;
      }, config.minimum_wait_before_querying_openai);
      this.timer.messages = [m];
    });

    return this;
  }

  static askAll(messages) {
    const text = messages.map(m => `${m.author.name}: ${m.content} `).join('\n');
    let total_priority = 0;
    const responses = this.bots.map(b => b.ask(text))
    const sorted = responses.sort(
      (a, b) => b.priority - a.priority)
    const prioritized = sorted.map(r => {
      if ((r.priority === 1) ||
        (total_priority <= config.max_priority_sum) &&
        (r.priority !== 0)) {
        total_priority += r.priority;
        r.bot.discord.send(r.text);
        log(`${r.bot.name}: priority ${r.priority} responded with ${r.text}`);
        return r.text;
      } else {
        log(`${r.bot.name}: priority ${r.priority} discarded ${r.text}`);
      }
    });

    return prioritized;
  }

  static async getInstance() {
    if (!Bots.instance) {
      Bots.instance = new Bots();
    }
    return await Bots.instance;
  }

  static async log(message) {
    console.log(message);
    return await this.client.channels.cache.get(config.adminlog_channel_id).send(message);
  }

  static async send(message) {
    return await this.client.channels.cache.get(config.bard_channel_id).send(message);
  }

}

export default Bots;
