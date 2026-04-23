import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PrivacyPage() {
  const { t } = useLanguage();
  
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-black tracking-tighter mb-8 uppercase">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground font-medium">
          <p>Last updated: April 23, 2026</p>
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">1. Data Collection</h2>
            <p>We collect information you provide directly to us, such as when you create an account, post a listing, or contact us. This includes your name, email address, phone number, and any property data you input.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">2. Use of Data</h2>
            <p>We use your data to provide and improve the service, process transactions, communicate with you, and for security purposes. We may also use anonymized data for market analysis.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">3. Data Sharing</h2>
            <p>We do not sell your personal data. We may share information with service providers (like payment processors) or when required by law. Phone numbers provided in listings will be visible to other registered agents as part of the service functionality.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">4. Security</h2>
            <p>We implement security measures to protect your data from unauthorized access. However, no method of transmission over the internet is 100% secure.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">5. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. You can manage most of this through your account settings or by contacting our support.</p>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
