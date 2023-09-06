import OpenAI from 'openai';
import dotenv from 'dotenv';
import { discord } from './discord.js';


class Useful {
  static instance;

  constructor() {
    if (Useful.instance) {
      return Useful.instance;
    }

    dotenv.config();
    this.env = process.env;

    if (!this.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not defined');
    }

    this.minimumWaitBeforeQueryingOpenAI = this.env.MINIMUM_WAIT_BEFORE_QUERYING_OPENAI;
    this.maxPrioritySum = this.env.MAX_PRIORITY_SUM;
    this.openAIKey = this.env.OPENAI_API_KEY;

    this.discord = discord;
    this.adminLogChannelID = this.env.ADMINLOG_CHANNEL_ID;
    this.adminLogChannel = this.discord.channels.cache.get(this.adminLogChannelID);
    this.bardChannelID = this.env.BARD_CHANNEL_ID;
    this.bardChannel = this.discord.channels.cache.get(this.bardChannelID);

    this.openai = new OpenAI({
      apiKey: this.openAIKey,
    });

    Useful.instance = this;
  }

  static getInstance() {
    if (!Useful.instance) {
      Useful.instance = new Useful();
    }
    return Useful.instance;
  }
}

export { Useful };
