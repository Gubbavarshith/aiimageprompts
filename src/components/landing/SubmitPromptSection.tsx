import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { 
  Sparkles
} from 'lucide-react';

// Circuit Pattern Component
const CircuitPattern = () => {
  return (
    <CircuitWrapper>
      <div className="circuit-wrapper">
        <div className="circuit-background" />
      </div>
    </CircuitWrapper>
  );
}

const CircuitWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: visible;

  .circuit-wrapper {
    min-height: 100%;
    width: 100%;
    max-width: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.34;
    pointer-events: none;
    z-index: 0;
  }

  html.dark & .circuit-wrapper {
    opacity: 0.3;
    color: #ffffff;
  }

  .circuit-background {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    min-width: 100%;
    z-index: 0;
    pointer-events: none;
    background-image: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 19px,
        rgba(75, 85, 99, 0.08) 19px,
        rgba(75, 85, 99, 0.08) 20px,
        transparent 20px,
        transparent 39px,
        rgba(75, 85, 99, 0.08) 39px,
        rgba(75, 85, 99, 0.08) 40px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 19px,
        rgba(75, 85, 99, 0.08) 19px,
        rgba(75, 85, 99, 0.08) 20px,
        transparent 20px,
        transparent 39px,
        rgba(75, 85, 99, 0.08) 39px,
        rgba(75, 85, 99, 0.08) 40px
      ),
      radial-gradient(
        circle at 20px 20px,
        rgba(55, 65, 81, 0.12) 2px,
        transparent 2px
      ),
      radial-gradient(
        circle at 40px 40px,
        rgba(55, 65, 81, 0.12) 2px,
        transparent 2px
      );
    background-size:
      40px 40px,
      40px 40px,
      40px 40px,
      40px 40px;
    background-repeat: repeat;
    background-position: 0 0;
  }
`;

export const SubmitPromptSection = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } }
  };

  return (
    <section className="relative py-40 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#FFDE1A]/5 rounded-full blur-[120px] mix-blend-screen dark:mix-blend-normal" />
        <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-zinc-100 dark:from-zinc-900 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-6xl mx-auto"
        >
          {/* 1. Header Manifesto */}
          <div className="text-center mb-32 max-w-4xl mx-auto relative py-16 px-8 rounded-2xl overflow-visible">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[300vw] overflow-visible pointer-events-none">
              <CircuitPattern />
            </div>
            {/* Left fade overlay */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-zinc-50 via-zinc-50/30 to-transparent dark:from-zinc-950 dark:via-zinc-950/30 dark:to-transparent pointer-events-none z-20"></div>
            {/* Right fade overlay */}
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-zinc-50 via-zinc-50/30 to-transparent dark:from-zinc-950 dark:via-zinc-950/30 dark:to-transparent pointer-events-none z-20"></div>
            <div className="relative z-10">
            <motion.div variants={itemVariants} className="mb-12 flex justify-center">
              <span className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border-2 border-[#FFDE1A]/30 dark:border-[#FFDE1A]/20 bg-[#FFDE1A]/10 dark:bg-[#FFDE1A]/5 backdrop-blur-md text-sm font-bold uppercase tracking-[0.15em] text-zinc-900 dark:text-[#FFDE1A] shadow-lg shadow-[#FFDE1A]/10">
                <Sparkles className="w-4 h-4 text-[#FFDE1A] dark:text-[#FFDE1A] animate-pulse" />
                Join the Collective
              </span>
            </motion.div>
            
            <motion.h2 variants={itemVariants} className="text-7xl md:text-9xl font-black tracking-[-0.04em] text-zinc-900 dark:text-white mb-10 leading-[0.85]">
              <span className="block mb-2">Share Your</span>
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFDE1A] via-zinc-900 to-zinc-700 dark:from-[#FFDE1A] dark:via-white dark:to-zinc-300">
                  Creative Vision.
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFDE1A]/50 to-transparent"></span>
              </span>
            </motion.h2>

            <motion.p variants={itemVariants} className="text-2xl md:text-3xl text-zinc-700 dark:text-zinc-300 max-w-3xl mx-auto leading-[1.4] font-medium tracking-tight">
              <span className="block mb-2">Submit your prompts.</span>
              <span className="block mb-2 text-zinc-600 dark:text-zinc-400">Inspire thousands.</span>
              <span className="block font-semibold text-zinc-900 dark:text-zinc-200">Shape the future of AI art.</span>
            </motion.p>
            </div>
          </div>

          {/* 2. The Process Strip (Numbered Manifesto) */}
          <div className="grid md:grid-cols-3 border-t border-zinc-200 dark:border-zinc-800 mb-32">
             {[
              {
                step: "01",
                title: "Create",
                desc: "Craft unique, high-quality prompts that generate stunning results."
              },
              {
                step: "02",
                title: "Submit",
                desc: "Share your work with our community of creators and enthusiasts."
              },
              {
                step: "03",
                title: "Inspire",
                desc: "Get featured, earn recognition, and help others learn."
              }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                className={`group pt-8 px-6 md:px-12 pb-12 border-l border-zinc-200 dark:border-zinc-800 ${i === 0 ? 'border-l-0 md:border-l' : ''} ${i === 2 ? 'border-r-0 md:border-r border-zinc-200 dark:border-zinc-800' : ''}`}
              >
                <span className="block text-sm font-mono text-[#FFDE1A] mb-6 tracking-widest">{item.step}</span>
                <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4 group-hover:translate-x-2 transition-transform duration-500">
                  {item.title}
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors duration-500">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* 3. The CTA Button */}
          <motion.div variants={itemVariants} className="relative flex justify-center mt-20">
            <CTAButton onClick={() => navigate('/submit')} />
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};

// Custom CTA Button Component
const CTAButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <StyledWrapper>
      <button type="button" className="button" onClick={onClick}>
        <span className="fold" />
        <div className="points_wrapper">
          <i className="point" />
          <i className="point" />
          <i className="point" />
          <i className="point" />
          <i className="point" />
          <i className="point" />
          <i className="point" />
          <i className="point" />
          <i className="point" />
          <i className="point" />
        </div>
        <span className="inner">
          <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
          Submit
        </span>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  /* Theme Variables */
  /* Default (Light Mode Global -> Black Banner -> Yellow Button) */
  --btn-main: #FFDE1A;
  --btn-highlight: rgba(255, 255, 255, 0.4);
  --btn-fold: #C7A000;
  --btn-point: #000000;
  --btn-text: #000000;

  /* Dark Mode (Dark Mode Global -> Yellow Banner -> Black Button) */
  html.dark & {
    --btn-main: #000000;
    --btn-highlight: rgba(255, 255, 255, 0.2);
    --btn-fold: #333333;
    --btn-point: #ffffff;
    --btn-text: #ffffff;
  }

  .button {
    --h-button: 48px;
    --w-button: auto; /* Allow auto width for text */
    --round: 0.75rem;
    cursor: pointer;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: all 0.25s ease;
    
    background: radial-gradient(
        65.28% 65.28% at 50% 100%,
        var(--btn-highlight) 0%,
        rgba(255, 255, 255, 0) 100%
      ),
      linear-gradient(0deg, var(--btn-main), var(--btn-main));
      
    border-radius: var(--round);
    border: none;
    outline: none;
    padding: 16px 32px; /* Increased padding for text */
    min-width: 240px; /* Min width for stability */
  }

  .button::before,
  .button::after {
    content: "";
    position: absolute;
    inset: var(--space);
    transition: all 0.5s ease-in-out;
    border-radius: calc(var(--round) - var(--space));
    z-index: 0;
  }

  .button::before {
    --space: 1px;
    background: linear-gradient(
      177.95deg,
      rgba(255, 255, 255, 0.19) 0%,
      rgba(255, 255, 255, 0) 100%
    );
  }

  .button::after {
    --space: 2px;
    background: radial-gradient(
        65.28% 65.28% at 50% 100%,
        var(--btn-highlight) 0%,
        rgba(255, 255, 255, 0) 100%
      ),
      linear-gradient(0deg, var(--btn-main), var(--btn-main));
  }

  .button:active {
    transform: scale(0.95);
  }

  .fold {
    z-index: 1;
    position: absolute;
    top: 0;
    right: 0;
    height: 1rem;
    width: 1rem;
    display: inline-block;
    transition: all 0.5s ease-in-out;
    background: radial-gradient(
      100% 75% at 55%,
      var(--btn-main) 0%,
      rgba(255, 255, 255, 0) 100%
    );
    box-shadow: 0 0 3px black;
    border-bottom-left-radius: 0.5rem;
    border-top-right-radius: var(--round);
    background-color: var(--btn-fold); /* Base color for fold */
  }

  .fold::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 150%;
    height: 150%;
    transform: rotate(45deg) translateX(0%) translateY(-18px);
    background-color: #e8e8e8;
    pointer-events: none;
    opacity: 0.5;
  }

  .button:hover .fold {
    margin-top: -1rem;
    margin-right: -1rem;
  }

  .points_wrapper {
    overflow: hidden;
    width: 100%;
    height: 100%;
    pointer-events: none;
    position: absolute;
    z-index: 1;
  }

  .points_wrapper .point {
    bottom: -10px;
    position: absolute;
    animation: floating-points infinite ease-in-out;
    pointer-events: none;
    width: 2px;
    height: 2px;
    background-color: var(--btn-point);
    border-radius: 9999px;
  }

  @keyframes floating-points {
    0% {
      transform: translateY(0);
    }
    85% {
      opacity: 0;
    }
    100% {
      transform: translateY(-55px);
      opacity: 0;
    }
  }

  .points_wrapper .point:nth-child(1) { left: 10%; opacity: 1; animation-duration: 2.35s; animation-delay: 0.2s; }
  .points_wrapper .point:nth-child(2) { left: 30%; opacity: 0.7; animation-duration: 2.5s; animation-delay: 0.5s; }
  .points_wrapper .point:nth-child(3) { left: 25%; opacity: 0.8; animation-duration: 2.2s; animation-delay: 0.1s; }
  .points_wrapper .point:nth-child(4) { left: 44%; opacity: 0.6; animation-duration: 2.05s; }
  .points_wrapper .point:nth-child(5) { left: 50%; opacity: 1; animation-duration: 1.9s; }
  .points_wrapper .point:nth-child(6) { left: 75%; opacity: 0.5; animation-duration: 1.5s; animation-delay: 1.5s; }
  .points_wrapper .point:nth-child(7) { left: 88%; opacity: 0.9; animation-duration: 2.2s; animation-delay: 0.2s; }
  .points_wrapper .point:nth-child(8) { left: 58%; opacity: 0.8; animation-duration: 2.25s; animation-delay: 0.2s; }
  .points_wrapper .point:nth-child(9) { left: 98%; opacity: 0.6; animation-duration: 2.6s; animation-delay: 0.1s; }
  .points_wrapper .point:nth-child(10) { left: 65%; opacity: 1; animation-duration: 2.5s; animation-delay: 0.2s; }

  .inner {
    z-index: 2;
    gap: 12px;
    position: relative;
    width: 100%;
    color: var(--btn-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.5;
    transition: color 0.2s ease-in-out;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .inner svg.icon {
    width: 20px;
    height: 20px;
    transition: fill 0.1s linear;
  }

  .button:focus svg.icon {
    fill: var(--btn-text);
  }
  
  .button:hover svg.icon {
    fill: transparent;
    animation:
      dasharray 2.7s cubic-bezier(0.35, 0, 0.25, 1) forwards,
      filled 0.3s ease-out forwards 1s;
  }
  
  @keyframes dasharray {
    from {
      stroke-dasharray: 0 100;
    }
    to {
      stroke-dasharray: 100 0;
    }
  }
  
  @keyframes filled {
    to {
      fill: var(--btn-text);
    }
  }
`;
