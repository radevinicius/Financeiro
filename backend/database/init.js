import { initDatabase } from './database.js';

async function main() {
    console.log('🚀 Iniciando setup do banco de dados...\n');

    try {
        await initDatabase();
        console.log('\n✨ Setup completo! O banco de dados está pronto para uso.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro durante setup:', error);
        process.exit(1);
    }
}

main();
