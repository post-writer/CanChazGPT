import Useful from './Useful.js';
import Bot from './Bot.js';
const useful = Useful.getInstance();

class Bots {
  static instance;
  bots = {};

  constructor() {
    if (Bots.instance) {
      return Bots.instance;
    }
    this.bots['TotallyHuman'] = new Bot('TotallyHuman', useful.env['BOT_TOTALLYHUMAN_TOKEN']);
    // this.bots['RookieRaccoon'] = new Bot('RookieRaccoon',useful.env['BOT_ROOKIERACCOON_TOKEN']);

    this.client = this.bots['TotallyHuman'].discord;
    this.configureWatchers();

    Bots.instance = this;
  }

  configureWatchers() {
    const client = this.client;
    client.on('messageCreate', async (m) => {
      if (m.channel.id !== useful.bardChannelID) return;
      if (this.timer) {
        this.timer.messages.push(m);
        return;
      }
      this.timer = setTimeout(async () => {
        Bots.askAll(this.timer.messages);
        this.timer = null;
      }, useful.minimumWaitBeforeQueryingOpenAI);
      this.timer.messages = [m];
    });
  }

  static askAll(messages) {
    const text = messages.map(m => `${m.author.name}: ${m.content} `).join('\n');
    let total_priority = 0;

    const responses = Object.values(this.bots).map(bot => bot.ask(text))
      .sort((a, b) => b.priority - a.priority)
      .map(r => {
        if ((r.priority === 1) || (total_priority <= useful.maxPrioritySum) && (r.priority !== 0)) {
          total_priority += r.priority;
          bot.send(r.text);
          useful.adminLogChannel.send(`${bot.name}: priority ${r.priority} responded with ${r.text}`);
          return r.text;
        } else {
          useful.adminLogChannel.send(`${bot.name}: priority ${r.priority} discarded ${r.text}`);
        }
      });

    return responses;
  }

  static getInstance() {
    if (!Bots.instance) {
      Bots.instance = new Bots();
    }
    return Bots.instance;
  }
}

export default Bots;
