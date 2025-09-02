"use client"

import { use } from 'react';
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

  const methods = useForm<PlayerLogin>({
    resolver: zodResolver(PlayerLoginSchema),
    defaultValues: {
      name: suggestedLoginDetails?.suggestedName ?? '',
      color: suggestedLoginDetails?.availableColors?.[0] ?? '',
    },
  });

  const { handleSubmit, formState: { errors } } = methods;

  return (
    <SuggestedLoginDetailsContext.Provider value={suggestedLoginDetails}>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit((data) => console.log(data))}>
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