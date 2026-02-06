import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';
import { X, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import Draggable from 'react-draggable';
import { motion, AnimatePresence } from 'motion/react';
import { Resizable } from 're-resizable';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContactFormData {
  yourEmail: string;
  yourSubject: string;
  yourMessage: string;
}

export const ContactModal = ({ isOpen, onClose }: ContactModalProps) => {
  const { lang } = useLanguage();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const draggableRef = useRef<HTMLDivElement>(null); 
  const [mounted, setMounted] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Toggle body class for global styling hooks (Mobile Header Hiding)
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('contact-modal-open');
    } else {
      document.body.classList.remove('contact-modal-open');
    }
    return () => {
      document.body.classList.remove('contact-modal-open');
    };
  }, [isOpen]);

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    const formData = new FormData();
    const derivedName = data.yourEmail.split('@')[0];
    formData.append('your-name', derivedName);
    formData.append('your-email', data.yourEmail);
    formData.append('your-subject', data.yourSubject || 'Portfolio Inquiry');
    formData.append('your-message', data.yourMessage);

    const FORM_ID = "6300008"; 
    const URL = `https://wognsben97.mycafe24.com/wp-json/contact-form-7/v1/contact-forms/${FORM_ID}/feedback`;

    try {
      const response = await axios.post(URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.status === 'mail_sent') {
        toast.success("Message sent successfully.");
        reset();
        onClose();
      } else {
        toast.error(response.data.message || "Failed to send message.");
      }
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <Draggable 
          handle=".window-handle" 
          defaultPosition={{ 
            x: typeof window !== 'undefined' ? (
              isMobile ? 20 : Math.max(20, window.innerWidth / 2 - 250)
            ) : 20, 
            y: isMobile ? 20 : 100
          }} 
          nodeRef={draggableRef}
          disabled={isMaximized}
        >
          {/* Draggable Wrapper (Position Logic) */}
          <div 
             ref={draggableRef} 
             className={`fixed z-[9999] ${isMaximized ? 'inset-0 !transform-none !w-full !h-full' : isMobile ? 'top-0 left-0 w-[calc(100vw-40px)] h-[70vh]' : 'top-0 left-0 w-fit h-fit'}${lang === 'ko' ? ' notranslate' : ''}`}
             translate={lang === 'ko' ? 'no' : undefined}
             style={isMaximized ? { transform: 'none', width: '100%', height: '100%', top: 0, left: 0 } : isMobile ? { position: 'fixed' } : { position: 'fixed' }}
          >
            {/* Animation Wrapper */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`shadow-2xl bg-background/95 backdrop-blur-md border border-foreground/10 overflow-hidden ${isMaximized ? 'w-full h-full rounded-none' : isMobile ? 'w-full h-full rounded-lg' : 'rounded-lg'}`}
            >
                <Resizable
                  defaultSize={isMobile ? { width: '100%', height: '100%' } : { width: 500, height: 600 }}
                  size={isMaximized ? { width: '100%', height: '100%' } : undefined}
                  minWidth={isMobile ? 300 : 350}
                  minHeight={isMobile ? 300 : 400}
                  maxWidth={isMaximized ? '100%' : 1000}
                  enable={!isMaximized ? { right: true, bottom: true, bottomRight: true } : false}
                  className="flex flex-col h-full relative"
                >
                    {/* macOS/Apple Style Header (Handle) */}
                    <div className="window-handle h-10 bg-muted/20 flex items-center justify-between px-4 cursor-move select-none border-b border-foreground/5 transition-colors hover:bg-muted/30 flex-shrink-0">
                    {/* Left Side - macOS dots */}
                    <div className="flex items-center gap-2">
                        {/* macOS Dots */}
                        <div className="flex gap-1.5 group">
                        <div 
                            className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500/80 transition-colors cursor-pointer flex items-center justify-center" 
                            onClick={onClose}
                        >
                            <X size={8} className="text-black/50 opacity-0 group-hover:opacity-100" />
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 group-hover:bg-amber-500/80 transition-colors" />
                        <div 
                            className="w-2.5 h-2.5 rounded-full bg-green-500/20 group-hover:bg-green-500/80 transition-colors cursor-pointer" 
                            onClick={() => setIsMaximized(!isMaximized)}
                        />
                        </div>
                        
                        <span className="ml-3 text-[9px] uppercase tracking-[0.2em] font-mono opacity-40">New Message</span>
                    </div>
                    
                    {/* Right Side - Controls */}
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsMaximized(!isMaximized)} 
                            className="text-muted-foreground/40 hover:text-foreground transition-colors p-1"
                            title={isMaximized ? "Restore" : "Maximize"}
                        >
                            {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                        <button onClick={onClose} className="text-muted-foreground/40 hover:text-foreground transition-colors p-1">
                            <X size={14} />
                        </button>
                    </div>
                    </div>

                    {/* Content */}
                    <div className="flex-grow flex flex-col overflow-hidden">
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
                        
                        {/* Header Fields (To, From, Subject) */}
                        <div className="px-6 py-2 border-b border-foreground/5 space-y-1 flex-shrink-0">
                        
                        {/* To Field - Static */}
                        <div className="flex items-center py-2 border-b border-foreground/5">
                            <span className="w-16 text-xs font-medium text-muted-foreground">To:</span>
                            <span className="text-sm font-light text-foreground/80">astradiog@gmail.com</span>
                        </div>

                        {/* From Field - Email Input */}
                        <div className="flex items-center py-2 border-b border-foreground/5">
                            <span className="w-16 text-xs font-medium text-muted-foreground">From:</span>
                            <div className="flex-1 relative">
                                <input
                                    {...register("yourEmail", { 
                                    required: true,
                                    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
                                    })}
                                    placeholder="name@example.com"
                                    type="email"
                                    className="w-full bg-transparent text-sm font-light focus:outline-none focus:text-foreground transition-colors placeholder:text-muted-foreground/30"
                                />
                                {errors.yourEmail && <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] text-red-500">Invalid email</span>}
                            </div>
                        </div>

                        {/* Subject Field */}
                        <div className="flex items-center py-2">
                            <span className="w-16 text-xs font-medium text-muted-foreground">Subject:</span>
                            <input
                                {...register("yourSubject")}
                                placeholder="Project Inquiry"
                                className="flex-1 bg-transparent text-sm font-light focus:outline-none focus:text-foreground transition-colors placeholder:text-muted-foreground/30"
                            />
                        </div>
                        </div>

                        {/* Message Body */}
                        <div className="px-6 py-4 flex-grow bg-background/50 flex flex-col">
                        <textarea
                            {...register("yourMessage", { required: true })}
                            placeholder="Write your message..."
                            className="w-full h-full bg-transparent text-sm font-light leading-relaxed focus:outline-none resize-none placeholder:text-muted-foreground/30"
                        />
                        {errors.yourMessage && <span className="text-[9px] text-red-500 mt-1 block">Message is required</span>}
                        </div>

                        {/* Footer / Send Button */}
                        <div className="px-6 py-4 bg-muted/5 border-t border-foreground/5 flex justify-end flex-shrink-0">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="text-[10px] tracking-[0.2em] uppercase hover:text-foreground/60 transition-colors disabled:opacity-50 flex items-center gap-2 bg-foreground text-background px-6 py-2 rounded-full hover:bg-foreground/90"
                        >
                            {isSubmitting ? (
                            <>
                                <Loader2 size={10} className="animate-spin" />
                                SENDING...
                            </>
                            ) : (
                            "SEND MESSAGE"
                            )}
                        </button>
                        </div>
                    </form>
                    </div>
                </Resizable>
            </motion.div>
          </div>
        </Draggable>
      )}
    </AnimatePresence>,
    document.body
  );
};