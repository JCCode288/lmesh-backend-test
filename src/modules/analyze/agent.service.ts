import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from '@langchain/core/prompts';
import { ChatGoogle } from '@langchain/google';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_HUMAN_TEMPLATE, DEFAULT_SYSTEM_TEMPLATE } from './agent.templates';
import { analysisResultSchema, AnalysisResult } from './schemas/analysis-result.schema';

@Injectable()
export class AgentService {
    private readonly model: ChatGoogle;
    private systemPrompt: SystemMessagePromptTemplate;
    private humanPrompt: HumanMessagePromptTemplate;
    private logger = new Logger(AgentService.name);

    constructor(private readonly configSvc: ConfigService) {
        const apiKey = this.configSvc.getOrThrow<string>('GEMINI_API_KEY');
        const modelName = this.configSvc.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';
        const temperature = parseFloat(this.configSvc.get<string>('GEMINI_TEMPERATURE') || '0');

        this.model = new ChatGoogle(modelName, { apiKey, temperature });
        this.systemPrompt = SystemMessagePromptTemplate.fromTemplate(DEFAULT_SYSTEM_TEMPLATE);
        this.humanPrompt = HumanMessagePromptTemplate.fromTemplate(DEFAULT_HUMAN_TEMPLATE);
    }

    async analyze(data: string): Promise<AnalysisResult> {
        this.logger.debug("== Starting processing data ==");
        this.logger.debug(data);
        this.logger.debug(typeof data);

        const structuredModel = this.model.withStructuredOutput(analysisResultSchema);
        const chain = this.prompt.pipe(structuredModel);
        this.logger.debug('== prompt ==');
        this.logger.debug(await this.prompt.format({ data }));
        const result = await chain.invoke({ data });

        this.logger.debug("== Analyze Result ==");
        this.logger.debug(result);

        return result;
    }

    setSystemPrompt(template: string) {
        this.systemPrompt = SystemMessagePromptTemplate.fromTemplate(template);

        return this;
    }

    setHumanPrompt(template: string) {
        this.humanPrompt = HumanMessagePromptTemplate.fromTemplate(template);

        return this;
    }

    private get prompt() {
        return ChatPromptTemplate.fromMessages([
            this.systemPrompt,
            this.humanPrompt
        ]);
    }
}
