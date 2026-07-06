import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-hgm-dark-bg via-hgm-dark-bg to-hgm-sapphire px-4">
      <SignUp
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
