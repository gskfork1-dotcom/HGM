import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-hgm-dark-bg via-hgm-dark-bg to-hgm-sapphire px-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full max-w-sm",
            card: "shadow-xl",
          },
        }}
      />
    </div>
  );
}
