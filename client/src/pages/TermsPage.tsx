import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TermsPage() {
  const { t } = useLanguage();
  
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-black tracking-tighter mb-8 uppercase">Terms of Service</h1>
        <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground font-medium">
          <p>Last updated: April 23, 2026</p>
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using Estate IQ, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the service.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">2. Description of Service</h2>
            <p>Estate IQ provides real estate intelligence, lead management, and marketing tools for property professionals in Ethiopia.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">3. User Responsibilities</h2>
            <p>Users are responsible for maintaining the confidentiality of their account and password. You agree to provide accurate information and comply with local laws and regulations regarding real estate transactions.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">4. Limitation of Liability</h2>
            <p>Estate IQ is a platform and does not guarantee the accuracy of listings or the outcome of any transaction. We are not liable for any direct or indirect damages arising from your use of the service.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">5. Modifications</h2>
            <p>We reserve the right to modify or terminate the service at any time without notice. We may also update these terms from time to time.</p>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
