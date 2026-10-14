import { redirect } from "next/navigation";
import CreateForm from "@/components/create-form";
import PageTitle from "@/components/page-title";
import { createClient } from "@/lib/supabase/server";

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
    <div className="max-w-3xl">
      <PageTitle
        label="New post"
        title="Post a photo"
        description="Share something you saw around New York. Pick a voice and AI writes three captions, straight to the feed for everyone to vote on."
      />
      <CreateForm userId={user.id} />
    </div>
  );
}
