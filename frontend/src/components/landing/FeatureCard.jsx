import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, desc, href, iconBg, iconColor, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -8, transition: { duration: 0.25 } }}
    className="h-full"
  >
    <Link
      to={href}
      className="group flex flex-col h-full p-7 lg:p-8 rounded-2xl bg-white/85 backdrop-blur-sm border border-teal/10 shadow-sm hover:shadow-xl hover:border-teal/25 transition-all duration-300"
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${iconBg} ${iconColor} group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon size={26} strokeWidth={2} />
      </div>
      <h3 className="text-lg font-bold text-navy">{title}</h3>
      <p className="mt-3 text-base text-muted leading-relaxed flex-1">{desc}</p>
      <span
        className={`mt-5 inline-flex items-center gap-1 text-sm font-bold ${iconColor} group-hover:gap-2 transition-all`}
      >
        Explore <ArrowRight size={16} />
      </span>
    </Link>
  </motion.div>
);

export default FeatureCard;
