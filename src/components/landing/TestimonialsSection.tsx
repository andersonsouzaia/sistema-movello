import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Maria Silva",
    company: "Restaurante Sabor & Arte",
    role: "Proprietária",
    text: "Aumentamos 40% nas vendas após anunciar na Movello. Os clientes chegam direto pelo QR Code! A geolocalização é perfeita para nosso negócio local.",
    rating: 5,
    avatar: "MS",
  },
  {
    name: "João Santos",
    company: "Academia FitLife",
    role: "Diretor de Marketing",
    text: "A melhor parte é o controle total sobre onde e quando nosso anúncio aparece. As métricas em tempo real nos ajudam a otimizar constantemente.",
    rating: 5,
    avatar: "JS",
  },
  {
    name: "Ana Costa",
    company: "Salão Beleza & Estilo",
    role: "Proprietária",
    text: "Conseguimos atrair clientes de bairros próximos que nem sabiam que existíamos. O investimento se pagou em menos de 2 meses!",
    rating: 5,
    avatar: "AC",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Depoimentos
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground">
            O que nossos clientes <span className="text-gradient-primary">dizem</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-premium p-6 md:p-8 relative"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10">
                <Quote className="w-12 h-12 text-primary" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-muted-foreground leading-relaxed mb-6 text-sm md:text-base">
                "{testimonial.text}"
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-display font-bold text-foreground text-sm md:text-base">
                    {testimonial.name}
                  </h4>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
