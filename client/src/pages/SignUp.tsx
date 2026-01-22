import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "rounded-xl border-border shadow-xl",
            logoBox: "h-40 w-auto mx-auto -mb-18",
            logoImage: "h-full w-full object-contain object-bottom",
            headerTitle: "text-slate-900 font-bold text-xl",
            headerSubtitle: "text-slate-500",
            formButtonPrimary: "bg-primary hover:bg-primary/90 text-white",
            footerActionLink: "text-primary hover:text-primary/90",
            formFieldLabel: "text-slate-700",
            formFieldInput: "border-slate-200 bg-white text-slate-900 ring-offset-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            otpCodeFieldInput: "border-slate-200 bg-white text-slate-900 ring-offset-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            phoneInputBox: "border-slate-200 bg-white text-slate-900",
            phoneInputInput: "bg-white text-slate-900",
            dividerLine: "bg-slate-200",
            dividerText: "text-slate-500",
          },
          variables: {
            colorPrimary: "#2563eb",
            borderRadius: "0.75rem",
            fontFamily: "'Inter', sans-serif",
          }
        }}
      />
    </div>
  );
}
