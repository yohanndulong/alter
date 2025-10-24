import { DataSource } from 'typeorm';
import { Parameter } from '../modules/parameters/entities/parameter.entity';
import { CONVERSATION_QUALITY_PROMPT } from '../modules/llm/prompts/conversation-quality.prompt';

/**
 * Script pour initialiser le prompt d'analyse de qualité de conversation
 */
async function initConversationQualityPrompt() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'alter',
    entities: [Parameter],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const parameterRepository = dataSource.getRepository(Parameter);

    // Vérifier si le paramètre existe déjà
    const existingParam = await parameterRepository.findOne({
      where: { key: 'prompts.conversation_quality' },
    });

    if (existingParam) {
      console.log('📝 Updating existing conversation quality prompt...');
      existingParam.value = CONVERSATION_QUALITY_PROMPT;
      existingParam.description = 'Prompt pour analyser la qualité d\'une conversation';
      await parameterRepository.save(existingParam);
      console.log('✅ Conversation quality prompt updated');
    } else {
      console.log('📝 Creating conversation quality prompt...');
      const parameter = parameterRepository.create({
        key: 'prompts.conversation_quality',
        value: CONVERSATION_QUALITY_PROMPT,
        description: 'Prompt pour analyser la qualité d\'une conversation',
        version: 1,
        isActive: true,
      });
      await parameterRepository.save(parameter);
      console.log('✅ Conversation quality prompt created');
    }

    await dataSource.destroy();
    console.log('👋 Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

initConversationQualityPrompt();
