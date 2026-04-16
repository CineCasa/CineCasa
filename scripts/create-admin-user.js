// Script para criar usuário admin no Supabase
// Executar: node scripts/create-admin-user.js

const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://eqhstnlsmfrwxhvcwoid.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Precisa da service role key
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaHN0bmxzbWZyd3hodmN3b2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTg1NTcsImV4cCI6MjA4ODI5NDU1N30.6AmJi7zs-1QDnStIIN5bJGoFFhv4WveC1NUAHKI0Qlo';

const ADMIN_EMAIL = 'mpaixaodesigner@gmail.com';
const ADMIN_PASSWORD = '300818';

async function createAdminUser() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não definida');
    console.log('\nPara criar um usuário admin, você precisa:');
    console.log('1. Acesse o painel do Supabase: https://app.supabase.com/project/eqhstnlsmfrwxhvcwoid');
    console.log('2. Vá em Settings > API > Project API keys');
    console.log('3. Copie a "service_role key"');
    console.log('4. Execute: export SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui && node scripts/create-admin-user.js');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Verificar se o usuário já existe
    console.log('🔍 Verificando se o usuário já existe...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
      throw listError;
    }

    const existingUser = existingUsers.users.find(u => u.email === ADMIN_EMAIL);
    let userId;

    if (existingUser) {
      console.log('👤 Usuário já existe, atualizando senha...');
      userId = existingUser.id;
      
      // Atualizar senha
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: ADMIN_PASSWORD,
      });
      
      if (updateError) {
        console.error('❌ Erro ao atualizar senha:', updateError);
        throw updateError;
      }
      console.log('✅ Senha atualizada com sucesso!');
    } else {
      // 2. Criar novo usuário
      console.log('🆕 Criando novo usuário admin...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true, // Confirmar email automaticamente
      });

      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError);
        throw createError;
      }

      userId = newUser.user.id;
      console.log('✅ Usuário criado com sucesso!');
    }

    // 3. Criar/atualizar perfil como admin
    console.log('👑 Configurando perfil como admin...');
    
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: ADMIN_EMAIL,
        is_admin: true,
        approved: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (upsertError) {
      console.error('❌ Erro ao criar perfil:', upsertError);
      throw upsertError;
    }

    console.log('\n✅ USUÁRIO ADMIN CONFIGURADO COM SUCESSO!');
    console.log('\n📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Senha:', ADMIN_PASSWORD);
    console.log('🆔 User ID:', userId);
    console.log('\n📝 O usuário pode fazer login em:');
    console.log('   https://cinecasa.vercel.app/login');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    process.exit(1);
  }
}

createAdminUser();
