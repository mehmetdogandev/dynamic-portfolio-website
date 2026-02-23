import { SectionTitle } from "@/components/website/ui/section-title";
import { ContactForm } from "@/components/website/contact/contact-form";
import { ContactInfo } from "@/components/website/contact/contact-info";
import { AnimateOnScroll } from "@/components/website/ui/animate-on-scroll";

export default function IletisimPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <AnimateOnScroll variant="fadeUp">
        <SectionTitle
          title="İletişim"
          subtitle="Benimle iletişime geçin"
          className="mb-10"
        />
      </AnimateOnScroll>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <AnimateOnScroll variant="fadeLeft" delay={0.06} className="lg:col-span-2">
          <ContactForm />
        </AnimateOnScroll>
        <AnimateOnScroll variant="fadeRight" delay={0.08}>
          <ContactInfo />
        </AnimateOnScroll>
      </div>
    </div>
  );
}
