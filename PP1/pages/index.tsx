import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaCode, FaBlog, FaLightbulb, FaUsers, FaRocket } from 'react-icons/fa';

const ScriptoriumLandingPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"} flex flex-col`}>
      {/* Hero Section - Enhanced messaging */}
      <section className="relative flex-grow flex flex-col items-center justify-center text-center p-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-10 animate-gradient-xy"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            Welcome to Scriptorium
          </h1>
          <p className="max-w-2xl text-xl mb-8 leading-relaxed">
            Your all-in-one platform for coding, learning, and sharing knowledge. 
            Execute code in real-time, share insights through blogs, and accelerate 
            your development with our curated templates.
          </p>
          
          <motion.div 
            className="flex gap-4 justify-center flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link href="/code">
              <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transform transition hover:scale-105">
                Try Code Runner
              </button>
            </Link>
            <Link href="/blogs">
              <button className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transform transition hover:scale-105">
                Explore Blogs
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Core Features Section - Enhanced descriptions */}
      <motion.section 
        className={`py-20 px-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Why Choose Scriptorium?</h2>
          <p className="text-center text-gray-500 mb-12 max-w-3xl mx-auto">
            Built by developers for developers, Scriptorium combines powerful coding tools 
            with a vibrant community platform to enhance your development journey.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <FaCode className="text-blue-500" size={30} />,
                title: "Interactive Code Runner",
                description: "Execute code in multiple languages with our real-time compiler and interactive editor. Perfect for testing, learning, and sharing code snippets with instant feedback."
              },
              {
                icon: <FaBlog className="text-purple-500" size={30} />,
                title: "Knowledge Sharing",
                description: "Share your insights through blogs, tutorials, and discussions. Connect with fellow developers, learn from their experiences, and contribute to the community."
              },
              {
                icon: <FaRocket className="text-green-500" size={30} />,
                title: "Code Templates",
                description: "Jump-start your projects with our curated collection of code templates. Save time with pre-built solutions for common development scenarios and best practices."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="text-center p-6 rounded-xl"
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Community Stats - Enhanced with context */}
      <motion.section 
        className="py-16 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Growing Community</h2>
          <p className="text-center text-gray-500 mb-12 max-w-3xl mx-auto">
            Join thousands of developers who trust Scriptorium for their coding needs.
            Our community is growing every day with passionate developers like you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                number: "50K+", 
                label: "Lines of Code Run",
                description: "Code executed successfully by our community"
              },
              { 
                number: "500+", 
                label: "Active Developers",
                description: "Engaged users sharing knowledge daily"
              },
              { 
                number: "100+", 
                label: "Code Templates",
                description: "Ready-to-use templates for various projects"
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center p-6"
                whileHover={{ scale: 1.05 }}
              >
                <h3 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </h3>
                <p className="font-semibold mb-2">{stat.label}</p>
                <p className="text-sm text-gray-500">{stat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section - Enhanced with more context */}
      <motion.section 
        className={`py-20 px-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Alex Chen",
                role: "Software Engineer at Google",
                quote: "The code execution environment is fantastic. I use it daily for testing algorithms and sharing solutions with my team.",
              },
              {
                name: "Sarah Johnson",
                role: "Full Stack Developer",
                quote: "Scriptorium's blog feature has helped me share my knowledge and connect with other developers. It's more than just a coding platform.",
              },
              {
                name: "Michael Park",
                role: "Computer Science Student",
                quote: "The code templates saved me countless hours. Perfect for learning and quick project setups.",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className={`p-6 rounded-xl shadow-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center mb-4">
                  <div>
                    <h3 className="font-bold">{testimonial.name}</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className={`italic ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  "{testimonial.quote}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section - Enhanced messaging */}
      {!isLoggedIn && (
        <motion.section 
          className={`py-20 px-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="container mx-auto text-center max-w-3xl">
            <h2 className="text-3xl font-bold mb-6">Join Our Community</h2>
            <p className="text-xl text-gray-500 mb-8">
              Start your journey with Scriptorium today. Join thousands of developers 
              who are already experiencing the power of collaborative coding and 
              knowledge sharing.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Link href="/signup">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg transform transition hover:scale-105 hover:shadow-xl">
                  Create Free Account
                </button>
              </Link>
              <p className="text-sm text-gray-500">
                No credit card required · Instant access · Join in seconds
              </p>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default ScriptoriumLandingPage;
