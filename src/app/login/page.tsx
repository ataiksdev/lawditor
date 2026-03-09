'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase-client';
export default function LoginPage() {
    const supabase = createClient();
    return (
        <div className="max-w-md mx-auto mt-20 p-8">
            <h1 className="text-2xl font-bold mb-6">Sign in to LegalAudit</h1>
            <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={['google']}
                redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
            />
        </div>
    );
}
