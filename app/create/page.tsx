import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateForm from "@/components/create-form";

export const maxDuration = 60;

export default async function CreatePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 pt-12 pb-24">
      <h1 className="text-4xl font-semibold tracking-tight">Caption a photo</h1>

      <p className="mt-3 text-lg text-black/60">
        Upload something you saw in the city, pick a tone, and let AI write
        the captions.
      </p>

      <CreateForm userId={user.id} />
    </main>
  );
}
