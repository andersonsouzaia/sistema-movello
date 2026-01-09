import { motion } from "framer-motion";
import { Eye, Building2, Car, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const stats = [
  {
    icon: Eye,
    value: 1000000,
    suffix: "+",
    label: "Impressões por mês",
    color: "text-primary",
  },
  {
    icon: Building2,
    value: 500,
    suffix: "+",
    label: "Empresas anunciando",
    color: "text-primary",
  },
  {
    icon: Car,
    value: 2000,
    suffix: "+",
    label: "Motoristas parceiros",
    color: "text-accent",
  },
  {
    icon: TrendingUp,
    value: 85,
    suffix: "%",
    label: "Taxa de conversão",
    color: "text-primary",
  },
];

const CountUpAnimation = ({ end, duration = 2000, suffix = "", start = false }: { end: number; duration?: number; suffix?: string; start?: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    
    let startTime: number;
    let animationFrame: number;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, start]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const StatsSection = () => {
  return (
    <section className="py-16 md:py-20 lg:pt-8 lg:pb-24 xl:pt-12 xl:pb-28 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Números que impressionam
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
            A Movello em <span className="text-gradient-primary">números</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-premium p-6 md:p-8 text-center overflow-hidden"
            >
              <div className={`w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className={`w-6 h-6 md:w-7 md:h-7 ${stat.color}`} />
              </div>
              <div className={`${stat.value >= 1000000 ? 'text-xl sm:text-2xl md:text-3xl lg:text-3xl' : 'text-2xl sm:text-3xl md:text-4xl lg:text-4xl'} font-display font-bold ${stat.color} mb-2 overflow-hidden px-2`}>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                  className="break-words"
                >
                  <CountUpAnimation end={stat.value} suffix={stat.suffix} start={true} />
                </motion.div>
              </div>
              <p className="text-sm md:text-base text-muted-foreground font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
