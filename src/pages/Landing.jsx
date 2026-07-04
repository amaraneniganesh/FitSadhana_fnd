import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Button from '../components/ui/Button';
import { Activity, Brain, Target, ChevronRight, CheckCircle2, Zap, ArrowRight } from 'lucide-react';

const Landing = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-background text-white selection:-accent/30 overflow-hidden">
      
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
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/70 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="FitSadhana" className="h-8 object-contain" />
          </Link>
          <div className="flex items-center gap-3 md:gap-6">
            <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden md:block">
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
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 z-10 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Introducing FitSadhana 2.0</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-6 leading-[1.1]">
              The intelligence behind <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent to-accent">
                your dream physique.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              Experience the world's most advanced fitness platform. Dynamic body visualizations, AI-powered coaching, and over 800+ exercises wrapped in a stunning interface.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="gradient" className="w-full sm:w-auto px-8 py-4 text-base font-semibold group flex items-center justify-center gap-2">
                  Start your transformation
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Abstract Mockup / Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="aspect-[16/9] md:aspect-[21/9] rounded-3xl bg-white/3 border border-white/10 p-2 md:p-4 shadow-2xl shadow-blue-900/20 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-accent/5" />
              
              <div className="w-full h-full bg-background rounded-2xl border border-white/5 relative overflow-hidden flex flex-col">
                {/* Mockup Header */}
                <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                {/* Mockup Content */}
                <div className="flex-1 p-8 flex items-center justify-center relative">
                  <div className="absolute inset-0 grid grid-cols-4 gap-4 p-8 opacity-30 pointer-events-none">
                    <div className="col-span-1 rounded-xl bg-white/5 border border-white/10" />
                    <div className="col-span-2 rounded-xl bg-gradient-to-br from-accent/20 to-transparent border border-accent" />
                    <div className="col-span-1 rounded-xl bg-white/5 border border-white/10" />
                    <div className="col-span-4 h-32 rounded-xl bg-white/5 border border-white/10 mt-4" />
                  </div>
                  <div className="text-center z-10">
                    <Activity className="w-16 h-16 text-accent mx-auto mb-4 opacity-80" />
                    <p className="text-xl font-semibold text-white/90">Interactive Dashboard inside</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative z-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Engineered for results.</h2>
            <p className="text-gray-400 text-lg">Everything you need to succeed, nothing you don't.</p>
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
                className="bg-white/3 p-8 rounded-3xl border border-white/5 hover:border-accent transition-all group backdrop-blur-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/20 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                  <feat.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feat.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 relative z-10 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Ready to crush your goals?</h2>
          <p className="text-gray-400 text-lg mb-10">Join thousands of others transforming their bodies with FitSadhana.</p>
          <Link to="/register">
            <Button variant="gradient" className="px-10 py-5 text-lg font-semibold shadow-2xl shadow-accent/25">
              Create your free account
            </Button>
          </Link>
        </div>
      </section>
      
    </div>
  );
};

export default Landing;
