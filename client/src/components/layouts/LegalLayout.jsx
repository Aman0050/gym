import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import PublicNavbar from '../PublicNavbar';
import PublicFooter from '../PublicFooter';
import { PageTransition } from '../Animations';

const LegalLayout = ({ title, subtitle, lastUpdated, sections, contactEmail }) => {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Update reading progress
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight}`;
      setScrollProgress(scroll);

      // Update active section
      const sectionElements = sections.map(s => document.getElementById(s.id));
      let currentSection = sections[0]?.id;
      
      for (const section of sectionElements) {
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 200) { // 200px offset for sticky header
            currentSection = section.id;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Offset to account for sticky navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-obsidian selection:bg-earth-clay/30 selection:text-white">
        <PublicNavbar />

        {/* Reading Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 z-[200] bg-white/5">
          <motion.div 
            className="h-full bg-gradient-to-r from-earth-clay to-amber-500"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>

        {/* Hero Section */}
        <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-24 overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(160,82,45,0.15)_0%,transparent_50%)]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-earth-clay/10 blur-[120px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full mb-8">
                <ShieldCheck size={14} className="text-earth-clay" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Legal & Compliance</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-black text-white font-serif tracking-tighter mb-6 drop-shadow-xl">
                {title}
              </h1>
              <p className="text-xl sm:text-2xl text-slate-400 font-light leading-relaxed mb-8">
                {subtitle}
              </p>
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <span>Last Updated:</span>
                <span className="text-white font-medium">{lastUpdated}</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 lg:py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
              
              {/* Sticky Sidebar */}
              <aside className="lg:w-1/4 hidden lg:block">
                <div className="sticky top-32">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">Contents</h4>
                  <nav className="space-y-1">
                    {sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        onClick={(e) => scrollToSection(e, section.id)}
                        className={`block px-4 py-2.5 rounded-lg text-sm transition-all duration-300 ${
                          activeSection === section.id
                            ? 'bg-earth-clay/10 text-earth-clay font-bold border-l-2 border-earth-clay'
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                        }`}
                      >
                        {section.title}
                      </a>
                    ))}
                  </nav>

                  {/* Trust Badge */}
                  <div className="mt-12 p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                    <ShieldCheck className="text-emerald-500 mb-4" size={24} />
                    <h5 className="text-white font-bold mb-2">Enterprise Grade Security</h5>
                    <p className="text-xs text-slate-400">
                      Your data is protected by industry-standard encryption and security protocols.
                    </p>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <main className="lg:w-3/4">
                <div className="prose prose-invert prose-slate max-w-none">
                  {sections.map((section, index) => (
                    <motion.div
                      key={section.id}
                      id={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5 }}
                      className="mb-16 scroll-mt-32"
                    >
                      <h2 className="text-2xl sm:text-3xl font-black text-white mb-6 flex items-center group">
                        <span className="text-earth-clay mr-4 text-xl opacity-50 group-hover:opacity-100 transition-opacity">
                          {String(index + 1).padStart(2, '0')}.
                        </span>
                        {section.title}
                      </h2>
                      
                      <div className="bg-white/[0.02] border border-white/5 p-6 sm:p-8 rounded-2xl backdrop-blur-sm shadow-2xl space-y-4">
                        {section.content}
                      </div>
                      
                      {index < sections.length - 1 && (
                         <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mt-16" />
                      )}
                    </motion.div>
                  ))}

                  {/* Contact Section */}
                  <motion.div
                    id="contact"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-20 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-earth-clay/20 to-transparent border border-earth-clay/20 text-center"
                  >
                    <Mail className="mx-auto text-earth-clay mb-6" size={32} />
                    <h3 className="text-2xl font-bold text-white mb-4">Questions about this policy?</h3>
                    <p className="text-slate-400 mb-8 text-center px-4 sm:px-8">
                      Our legal and support teams are available to clarify any terms or conditions regarding your use of FitXeno OS.
                    </p>
                    <a 
                      href={`mailto:${contactEmail}`}
                      className="inline-flex items-center px-8 py-4 bg-white text-obsidian rounded-xl font-bold hover:bg-slate-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                    >
                      Contact Legal Team <ArrowRight size={16} className="ml-2" />
                    </a>
                  </motion.div>
                </div>
              </main>

            </div>
          </div>
        </section>

        <PublicFooter />
      </div>
    </PageTransition>
  );
};

export default LegalLayout;
