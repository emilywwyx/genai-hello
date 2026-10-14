import MobileTabBar from "@/components/mobile-tab-bar";
import TopNav from "@/components/top-nav";
import { getAccount } from "@/lib/account";
import { SITE_NAME } from "@/lib/site";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await getAccount();

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav account={account} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-6 pb-28 sm:px-8 md:pb-16">
        {children}
      </main>

      <footer className="hidden bg-ink text-white md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-6">
          <span className="display text-xl">{SITE_NAME}</span>
          <span className="text-xs text-white/50">
            Your New York, captioned. AI writes, people vote.
          </span>
        </div>
      </footer>

      <MobileTabBar signedIn={!!account} />
    </div>
  );
}
