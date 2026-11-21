import { useEffect, useRef, useState } from "react";
import { RoughNotation } from "react-rough-notation";
import { useTheme } from "next-themes";

import { useSection } from "context/section";
import useOnScreen from "hooks/useOnScreen";
import useScrollActive from "hooks/useScrollActive";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { siteConfig } from "config/site.config";

const ContactSection: React.FC = () => {
  const { theme } = useTheme();

  const sectionRef = useRef<HTMLDivElement>(null);
  const isSecOnScreen = useOnScreen(sectionRef);

  const elementRef = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(elementRef);

  // Set active link for contact section
  const contactSection = useScrollActive(sectionRef);
  const { onSectionChange } = useSection();
  useEffect(() => {
    contactSection && onSectionChange!("contact");
  }, [contactSection]);

  const { email, location } = siteConfig.personalInfo;
  const { linkedin, github } = siteConfig.socialLinks;

  // The site is static, so the form opens the visitor's email app with the message filled in.
  const [form, setForm] = useState({ name: "", subject: "", message: "" });
  const [copied, setCopied] = useState(false);
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(form.subject || `Hello from ${form.name}`);
    const bodyText = encodeURIComponent(`${form.message}\n\n${form.name}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${bodyText}`;
  };
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const q = gsap.utils.selector(sectionRef);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      q(".contact-panel"),
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.2,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: q(".contact-panel")[0], start: "top 85%" },
      }
    );
    // the paper plane takes off and loops on its own path
    gsap.to(q(".paper-plane"), {
      keyframes: [
        { x: 18, y: -10, rotate: -8, duration: 1.2 },
        { x: 0, y: 0, rotate: 0, duration: 1.2 },
      ],
      repeat: -1,
      ease: "sine.inOut",
    });
  }, []);

  const field =
    "mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-bgdark px-3 py-2 focus:border-marrsgreen focus:outline-none focus:ring-2 focus:ring-marrsgreen/30 dark:focus:border-carrigreen";

  return (
    <section ref={sectionRef} id="contact" className="section min-h-[700px]">
      <div className="text-center mb-12">
        <RoughNotation
          type="underline"
          color={`${theme === "light" ? "rgb(0, 122, 122)" : "rgb(5 206 145)"}`}
          strokeWidth={2}
          order={1}
          show={isOnScreen}
        >
          <h2 className="section-heading">{siteConfig.contactSection.title}</h2>
        </RoughNotation>
        <p className="mx-auto mt-3 max-w-2xl" ref={elementRef}>
          {siteConfig.contactSection.description}
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-5">
        <form onSubmit={onSubmit} className="contact-panel lg:col-span-3 rounded-lg bg-white dark:bg-carddark p-6 md:p-8 shadow-md">
          <h3 className="mb-5 flex items-center gap-3 text-2xl font-semibold">
            Send me a message
            <span aria-hidden="true" className="paper-plane inline-block">✈️</span>
          </h3>
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Your name
              <input name="name" required value={form.name} onChange={onChange} className={field} autoComplete="name" />
            </label>
            <label className="block text-sm font-medium">
              Subject
              <input name="subject" value={form.subject} onChange={onChange} className={field} placeholder="Role, collaboration, or a question" />
            </label>
            <label className="block text-sm font-medium">
              Message
              <textarea name="message" required rows={5} value={form.message} onChange={onChange} className={field} />
            </label>
          </div>
          <button
            type="submit"
            className="mt-6 rounded bg-marrsgreen dark:bg-carrigreen px-6 py-3 font-medium text-white dark:text-bgdark transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marrsgreen"
          >
            Open in my email app
          </button>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Your message opens as a draft in your own email app. Nothing is sent until you press send there.</p>
        </form>

        <div className="contact-panel lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-lg bg-white dark:bg-carddark p-6 shadow-md">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
            <a href={`mailto:${email}`} className="mt-1 block break-all font-medium text-marrsgreen dark:text-carrigreen hover:underline">
              {email}
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className="mt-3 rounded border border-marrsgreen dark:border-carrigreen px-3 py-1 text-sm text-marrsgreen dark:text-carrigreen hover:bg-marrsgreen hover:text-white dark:hover:bg-carrigreen dark:hover:text-bgdark"
              aria-live="polite"
            >
              {copied ? "Copied ✓" : "Copy email"}
            </button>
          </div>
          <div className="rounded-lg bg-white dark:bg-carddark p-6 shadow-md">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
            <p className="mt-1 font-medium">📍 {location}</p>
          </div>
          <div className="rounded-lg bg-white dark:bg-carddark p-6 shadow-md">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Elsewhere</h3>
            <ul className="mt-2 space-y-2 font-medium">
              <li><a className="link" href={linkedin.url} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
              <li><a className="link" href={github.url} target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
