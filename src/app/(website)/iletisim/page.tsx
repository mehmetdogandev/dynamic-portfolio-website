import { SectionTitle } from "@/components/website/ui/section-title";
import { ContactForm } from "@/components/website/contact/contact-form";
import { ContactInfo } from "@/components/website/contact/contact-info";

export default function IletisimPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <SectionTitle
        title="İletişim"
        subtitle="Benimle iletişime geçin"
        className="mb-10"
      />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ContactForm />
        </div>
        <div>
          <ContactInfo />
        </div>
      </div>
    </div>
  );
}
