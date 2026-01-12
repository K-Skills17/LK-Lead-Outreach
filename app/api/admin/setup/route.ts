import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { hashPassword } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/setup
 * One-time setup to create admin user with hashed password
 * Protected by setup token
 */
export async function POST(request: NextRequest) {
  try {
    const { setupToken, email, password, name } = await request.json();

    // Verify setup token (should match env variable)
    const expectedToken = process.env.ADMIN_SETUP_TOKEN;
    
    if (!expectedToken || setupToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Token de configuração inválido' },
        { status: 401 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Usuário admin já existe' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin user
    const { data: admin, error: insertError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        name: name || 'Admin',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Admin Setup] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Erro ao criar usuário admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário admin criado com sucesso',
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error) {
    console.error('[Admin Setup] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao configurar admin' },
      { status: 500 }
    );
  }
}
