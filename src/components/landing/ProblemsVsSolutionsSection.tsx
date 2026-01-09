import { motion } from "framer-motion";
import { X, Check, AlertCircle, Target, MapPin, BarChart3, Eye, Settings } from "lucide-react";
import movellinhoMascote from "@/assets/movellinho-mascote.png";

const problems = [
  { icon: AlertCircle, text: "Você paga por quem nunca vê seu anúncio" },
  { icon: Eye, text: "Zero rastreabilidade real" },
  { icon: Target, text: "Público aleatório, sem intenção" },
  { icon: BarChart3, text: "Impressões infladas, resultados baixos" },
  { icon: Settings, text: "Falta de controle sobre onde aparece" },
];

const solutions = [
  { icon: Eye, text: "Exibição fullscreen em tablets" },
  { icon: MapPin, text: "Ativação por GPS em tempo real" },
  { icon: Target, text: "Raio configurável (500m, 1km, 2km, 5km)" },
  { icon: Check, text: "Público 100% relevante" },
  { icon: BarChart3, text: "Métricas completas em tempo real" },
];

const ProblemsVsSolutionsSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Onde o marketing tradicional desperdiça,
            <br />
            <span className="text-gradient-primary">a Movello otimiza.</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
          {/* Problems Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-card rounded-3xl p-6 md:p-8 lg:p-10 border border-border/50 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-movello-orange-light rounded-2xl flex items-center justify-center">
                <X className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg md:text-xl font-display font-bold text-foreground">
                Os problemas do marketing tradicional
              </h3>
            </div>

            <div className="space-y-5">
              {problems.map((problem, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-movello-orange-light/50 rounded-xl"
                >
                  <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <problem.icon className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-foreground font-medium">{problem.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Solutions Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-blue-subtle rounded-3xl p-6 md:p-8 lg:p-10 border border-primary/10"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-display font-bold text-foreground">
                As soluções da Movello
              </h3>
            </div>

            <div className="space-y-5">
              {solutions.map((solution, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <solution.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-foreground font-medium">{solution.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Quote with Speech Bubble */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-16 flex items-center justify-center"
        >
          <div className="relative inline-flex items-center gap-4">
            {/* Movellinho */}
            <img 
              src={movellinhoMascote} 
              alt="Movellinho" 
              className="w-20 h-20 object-contain flex-shrink-0"
              loading="lazy"
            />
            {/* Speech Bubble */}
            <div className="relative bg-card rounded-3xl p-6 shadow-xl border border-border/50 max-w-md">
              <p className="text-2xl lg:text-3xl font-display font-bold text-foreground">
                "Exibição inteligente. <span className="text-gradient-primary">Resultados reais.</span>"
              </p>
              {/* Speech bubble arrow pointing to Movellinho */}
              <div className="absolute -left-3 bottom-10 w-0 h-0 border-t-[12px] border-t-transparent border-r-[16px] border-r-card border-b-[12px] border-b-transparent"></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemsVsSolutionsSection;
