"use client"

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlayerLoginSchema, type PlayerLogin } from '@/features/users/schema/player/playerLogin';
import { SuggestedLoginDetails } from '@/features/users/schema/player/suggestedLoginDetails';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import PlayerColorSelector from './PlayerColorSelector';
import Username from './Username';
import { SuggestedLoginDetailsContext } from './LoginFormContext';


export default function LoginForm({ suggestedLoginDetailsPromise }: { suggestedLoginDetailsPromise: Promise<SuggestedLoginDetails> }) {
  const suggestedLoginDetails = use(suggestedLoginDetailsPromise);
  const router = useRouter();

  const methods = useForm<PlayerLogin>({
    resolver: zodResolver(PlayerLoginSchema),
    defaultValues: {
      name: suggestedLoginDetails?.suggestedName ?? '',
      color: suggestedLoginDetails?.availableColors?.[0] ?? '',
    },
  });

  const { handleSubmit, formState: { errors } } = methods;

  const onSubmit = async (playerLogin: PlayerLogin) => {
    try {
        const res = await fetch('/api/players/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(playerLogin),
        });
  
        if (!res.ok) throw new Error(`Login failed (${res.status})`);
  
        const playerResponse = await res.json();
        console.log({playerResponse});
        if (playerResponse.player) {
          console.log('calling redirect')
          router.push('/play');
        }
        // On success, redirect to game page
        // ...or call refresh() to load from /api/players/me and keep one codepath
        // await refresh();
      } catch (e: any) {
        console.error(e)
        console.error(e?.message ?? 'Login failed');
      }
  };

  return (
    <SuggestedLoginDetailsContext.Provider value={suggestedLoginDetails}>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-row justify-between pb-4">
                <div className="space-y-2">
                    <Label htmlFor="username">Commander Name</Label>
                    <Username />
                </div>
                <div className="ml-4 space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <PlayerColorSelector />
                </div>
            </div>

          <Button type="submit" className="w-full" size="lg" disabled={false}>
            Join the Battle
          </Button>
        </form>
      </FormProvider>
    </SuggestedLoginDetailsContext.Provider>
  );
}