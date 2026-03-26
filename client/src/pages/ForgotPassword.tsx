import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Link } from "wouter";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  
  const requestReset = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSubmitted(true);
        setSubmittedEmail(form.getValues("email"));
        toast.success("Password reset email sent! Check your inbox.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send reset email");
    },
  });

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    requestReset.mutate({ email: data.email });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a password reset link to <span className="font-semibold text-foreground">{submittedEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">What to do next:</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ Check your email inbox</li>
                <li>✓ Click the reset link (valid for 24 hours)</li>
                <li>✓ Create a new password</li>
                <li>✓ Log in with your new password</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSubmitted(false);
                  form.reset();
                }}
              >
                Try Another Email
              </Button>
            </div>

            <div className="text-center">
              <Link href="/login">
                <a className="text-sm text-accent hover:underline flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-accent" />
            </div>
          </div>
          <CardTitle className="text-2xl">Forgot Your Password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        disabled={requestReset.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={requestReset.isPending}
                size="lg"
              >
                {requestReset.isPending ? "Sending..." : "Send Reset Link"}
              </Button>

              <div className="text-center">
                <Link href="/login">
                  <a className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </a>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
