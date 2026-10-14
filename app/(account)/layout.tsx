import { redirect } from "next/navigation";
import AccountSidebar from "@/components/account-sidebar";
import { getAccount } from "@/lib/account";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await getAccount();

  if (!account) {
    redirect("/");
  }

  return (
    <div className="min-h-screen lg:flex">
      <AccountSidebar account={account} />
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-10 lg:px-12 lg:py-10">
        {children}
      </main>
    </div>
  );
}
