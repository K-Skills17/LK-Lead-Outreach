import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Zod schema for validation
const diagnosticSchema = z.object({
  totalPatients: z.number().min(1, 'Total de pacientes deve ser no mínimo 1'),
  ticketMedio: z.number().min(0.01, 'Ticket médio deve ser maior que zero'),
  inactivePercent: z.number().min(10).max(90),
  lostRevenue: z.number(),
  clinicName: z.string().min(2, 'Nome da clínica deve ter no mínimo 2 caracteres'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  whatsapp: z.string().min(10, 'WhatsApp inválido'),
  email: z.string().email('Email inválido'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate data
    const validatedData = diagnosticSchema.parse(body);

    // Add timestamp
    const payload = {
      ...validatedData,
      timestamp: new Date().toISOString(),
    };

    // Get webhook URL from environment
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('MAKE_WEBHOOK_URL not configured');
      // Don't block user experience if webhook is not configured
      return NextResponse.json({
        success: true,
        message: 'Diagnóstico enviado com sucesso',
      });
    }

    // Send to Make.com webhook
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!webhookResponse.ok) {
        console.error('Webhook error:', webhookResponse.statusText);
        // Don't block user experience even if webhook fails
      }
    } catch (webhookError) {
      console.error('Failed to send to webhook:', webhookError);
      // Don't block user experience even if webhook fails
    }

    // Always return success to user
    return NextResponse.json({
      success: true,
      message: 'Diagnóstico enviado com sucesso',
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Dados inválidos',
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao processar solicitação',
      },
      { status: 500 }
    );
  }
}
