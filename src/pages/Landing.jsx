import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Button from '../components/ui/Button';
import { Activity, Brain, Target, ChevronRight, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';

const Landing = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:-accent/30 overflow-hidden">
      <SEO 
        title="FitSadhana | Cultivate Your Strength"
        description="The ultimate AI-powered fitness and nutrition tracker. Transform your body with data-driven insights."
      />
      
      {/* Dynamic Backgrounds */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div 
          style={{ y, opacity }}
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[150px] mix-blend-screen" 
        />
        <motion.div 
          style={{ y: useTransform(scrollYProgress, [0, 1], [0, -300]), opacity }}
          className="absolute top-1/4 -right-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/70 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="FitSadhana" className="h-8 object-contain" />
          </Link>
          <div className="flex items-center gap-3 md:gap-6">
            <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors hidden md:block">
              Log in
            </Link>
            <Link to="/register">
              <Button variant="gradient" className="text-sm px-6 py-2 shadow-lg shadow-accent/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 z-10 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 flex flex-col items-start text-left"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 border border-border mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Introducing FitSadhana 2.0</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.15]">
            The intelligence behind <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-500 to-indigo-500">
              your dream physique.
            </span>
          </h1>
          
          <p className="text-lg text-text-secondary mb-10 max-w-lg font-light leading-relaxed">
            Experience a world-class fitness platform designed for absolute precision. Dynamic body visualizations, AI-powered coaching, and a massive exercise database, all wrapped in a premium interface.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link to="/register" className="w-full sm:w-auto">
              <Button variant="gradient" className="w-full sm:w-auto px-8 py-4 text-base font-semibold shadow-2xl shadow-accent/25 flex items-center justify-center gap-2">
                Start your transformation
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="flex-1 w-full relative"
        >
          <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-2xl shadow-accent/20 max-w-[600px] ml-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10" />
            <img 
              src="/hero.png" 
              alt="Athlete working out" 
              className="w-full h-auto object-cover aspect-[4/5] object-center"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative z-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Engineered for results.</h2>
            <p className="text-text-secondary text-lg">Everything you need to succeed, nothing you don't.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'Smart Generation', desc: 'Instantly generate highly personalized workout plans powered by Gemini AI. No more guesswork.' },
              { icon: Brain, title: 'On-Demand AI Coach', desc: 'Have a question? Chat directly with an expert AI coach that understands your entire workout history.' },
              { icon: Activity, title: 'Massive DB', desc: 'Over 800+ exercises covering Yoga, Weightlifting, HIIT, and more. Track reps, duration, and distance.' }
            ].map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-foreground/3 p-8 rounded-3xl border border-border hover:border-accent transition-all group backdrop-blur-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/20 flex items-center justify-center mb-6 border border-border group-hover:scale-110 transition-transform">
                  <feat.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feat.title}</h3>
                <p className="text-text-secondary leading-relaxed text-sm md:text-base">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 relative z-10 px-6 bg-foreground/[0.02] border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Trusted by athletes.</h2>
            <p className="text-text-secondary text-lg">See what our community is saying about FitSadhana.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Alex R.", role: "Powerlifter", text: "The AI coach completely restructured my programming. I broke my plateau within 3 weeks." },
              { name: "Sarah M.", role: "Fitness Enthusiast", text: "I love the 3D body visualizer! Seeing my body change on the screen keeps me so motivated." },
              { name: "David T.", role: "Marathon Runner", text: "FitSadhana tracks my macros and workouts seamlessly. Best fitness app I've ever used, period." }
            ].map((review, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-background p-8 rounded-3xl border border-border shadow-lg shadow-black/5"
              >
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-text-secondary leading-relaxed mb-6 italic">"{review.text}"</p>
                <div>
                  <h4 className="font-semibold text-foreground">{review.name}</h4>
                  <p className="text-sm text-text-secondary">{review.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 relative z-10 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Ready to crush your goals?</h2>
          <p className="text-text-secondary text-lg mb-10">Join thousands of others transforming their bodies with FitSadhana.</p>
          <Link to="/register">
            <Button variant="gradient" className="px-10 py-5 text-lg font-semibold shadow-2xl shadow-accent/25">
              Create your free account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-text-secondary text-sm border-t border-border relative z-10">
        <p>Provided by Dhanvatix</p>
      </footer>
      
    </div>
  );
};

export default Landing;
