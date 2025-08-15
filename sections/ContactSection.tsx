import { useEffect, useRef, useState } from "react";
import { RoughNotation } from "react-rough-notation";
import { useTheme } from "next-themes";

import { useSection } from "context/section";
import useOnScreen from "hooks/useOnScreen";
import useScrollActive from "hooks/useScrollActive";

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

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you'd send this data to a backend API
    console.log('Form submitted:', formData);
    alert('Thank you for your message! I will get back to you soon.');
    // Reset the form
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="section min-h-[700px]"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <RoughNotation
            type="underline"
            color={`${theme === "light" ? "rgb(0, 122, 122)" : "rgb(5 206 145)"}`}
            strokeWidth={2}
            order={1}
            show={isOnScreen}
          >
            <h2 className="text-4xl font-bold mb-4">Get In Touch</h2>
          </RoughNotation>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto" ref={elementRef}>
            I'm always interested in discussing new opportunities, collaborations, or just chatting about data science. Feel free to reach out!
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          {/* Left Section: Send me a message form - HIDDEN */}
          <div className="lg:w-2/3 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md hidden">
            <h3 className="text-2xl font-semibold mb-6 dark:text-white">Send me a message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What's this about?"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell me about your project or just say hello!"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  required
                ></textarea>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l.649-.182.937.472a1 1 0 001.18.043l5.02-4.821 3.288 8.092a1 1 0 001.077.445l.93-.284.64-.191a1 1 0 00.984-1.684l-4.254-7.545 3.09-3.09a1 1 0 00-1.414-1.414L10.894 2.553z"></path>
                  </svg>
                  Send Message
                </button>
              </div>
            </form>
          </div>

          {/* Right Section: Contact Information and Follow Me */}
          <div className="w-full space-y-8">
            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold mb-6 dark:text-white">Contact Information</h3>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <div className="text-blue-600 dark:text-blue-400 mr-4 text-xl">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-17 4v7a2 2 0 002 2h12a2 2 0 002-2v-7"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Email</h4>
                    <p className="text-gray-600 dark:text-gray-300">Arjunchidambaram1991@gmail.com</p>
                  </div>
                </li>
                <li className="flex items-center">
                  <div className="text-blue-600 dark:text-blue-400 mr-4 text-xl">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Phone</h4>
                    <p className="text-gray-600 dark:text-gray-300">+1 (610) 653-3607</p>
                  </div>
                </li>
                <li className="flex items-center">
                  <div className="text-blue-600 dark:text-blue-400 mr-4 text-xl">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0L6.343 16.657m10.314-10.314L13.414 3.1a1.998 1.998 0 00-2.828 0L6.343 6.343m10.314 10.314A10.007 10.007 0 0018 10a10.007 10.007 0 00-1.729-5.657M6.343 16.657A10.007 10.007 0 016 10a10.007 10.007 0 011.729-5.657"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Location</h4>
                    <p className="text-gray-600 dark:text-gray-300">Reston, VA, USA</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Follow Me */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold mb-6 dark:text-white">Follow Me</h3>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <a href="https://github.com/arjunsubbiah" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                    <div className="text-blue-600 dark:text-blue-400 mr-4 text-xl">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.47.087.683-.23.683-.507 0-.251-.01-1.09-.016-1.986-2.775.601-3.363-1.378-3.363-1.378-.454-1.156-1.11-1.464-1.11-1.464-.905-.618.069-.606.069-.606 1.002.071 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.831.091-.644.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.93 0-1.09.39-1.983 1.03-2.682-.104-.253-.447-1.272.098-2.65 0 0 .84-.27 2.75 1.025.798-.223 1.65-.335 2.503-.339.853.004 1.705.116 2.503.339 1.909-1.295 2.747-1.025 2.747-1.025.546 1.378.202 2.397.098 2.65.64.699 1.029 1.592 1.029 2.682 0 3.826-2.338 4.673-4.566 4.921.359.31.678.921.678 1.855 0 1.336-.012 2.419-.012 2.747 0 .278.21.597.682.504C20.138 20.2 23 16.444 23 12.017 23 6.484 18.522 2 13 2h-1z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <span className="text-gray-900 dark:text-white">GitHub: @arjunsubbiah</span>
                  </a>
                </li>
                <li className="flex items-center">
                  <a href="https://linkedin.com/in/arjun-subbiah-b19330a6/" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                    <div className="text-blue-600 dark:text-blue-400 mr-4 text-xl">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <span className="text-gray-900 dark:text-white">LinkedIn: Arjun Chidambaram</span>
                  </a>
                </li>
                <li className="flex items-center">
                  <a href="https://twitter.com/arjunsubbiah" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                    <div className="text-blue-600 dark:text-blue-400 mr-4 text-xl">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.816-2.264 8.243 8.243 0 01-2.606.996 4.109 4.109 0 00-6.993 3.743 11.65 11.65 0 01-8.47-4.286 4.109 4.109 0 001.272 5.478A4.086 4.086 0 014 9.173v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.188v.093a11.672 11.672 0 006.29 1.84"></path>
                      </svg>
                    </div>
                    <span className="text-gray-900 dark:text-white">Twitter: @arjunsubbiah</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
