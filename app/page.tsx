import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center bg-white px-16 py-32 dark:bg-black">
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Tableau de bord HCS-U7
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Vous êtes connecté en tant que {session.user?.email}.
        </p>
      </main>
    </div>
  );
}

