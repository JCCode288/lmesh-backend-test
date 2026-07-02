import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from '@langchain/core/prompts';
import { ChatGoogle } from '@langchain/google';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_HUMAN_TEMPLATE, DEFAULT_SYSTEM_TEMPLATE } from './agent.templates';

@Injectable()
export class AgentService {
    private readonly model: ChatGoogle;
    private systemPrompt: SystemMessagePromptTemplate;
    private humanPrompt: HumanMessagePromptTemplate;

    constructor(private readonly configSvc: ConfigService) {
        const apiKey = this.configSvc.getOrThrow<string>("GEMINI_API_KEY");
        const modelName = this.configSvc.get<string>("GEMINI_MODEL") || "gemini-2.5-flash";
        const temperature = parseInt(this.configSvc.get("GEMINI_TEMPERATURE") || "0")

        this.model = new ChatGoogle(modelName, { apiKey, temperature });
        this.systemPrompt = SystemMessagePromptTemplate.fromTemplate(DEFAULT_SYSTEM_TEMPLATE);
        this.humanPrompt = HumanMessagePromptTemplate.fromTemplate(DEFAULT_HUMAN_TEMPLATE);
    }


    /**
     * @description this method is used to encapsulate analysis on file data
     * @param {Buffer} fileData 
     */
    async analyze(fileData: Buffer) {
        try {
            const stringFileData = fileData.toString("utf-8");
            const chain = this.prompt.pipe(this.model);

        } catch (err) {

        }
    }


    /**
     * @description this method is used to changing the system prompt
     * @param {string} template system template to use for analyzing the data 
     */
    setSystemPrompt(template: string) {
        const systemPrompt = SystemMessagePromptTemplate.fromTemplate(template);
        this.systemPrompt = systemPrompt;

        return this;
    }

    /**
     * @description this method is used to changing the human prompt
     * @param {string} template human template to use for analyzing the data 
     */
    setHumanPrompt(template: string) {
        const humanPrompt = HumanMessagePromptTemplate.fromTemplate(template);
        this.humanPrompt = humanPrompt;

        return this;
    }

    private get prompt() {
        return ChatPromptTemplate.fromMessages([
            this.systemPrompt,
            this.humanPrompt
        ]);
    }
}
