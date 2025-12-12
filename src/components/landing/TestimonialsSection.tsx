import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "A Movello aumentou nossos leads em 40% com geolocalização precisa.",
    author: "Carlos Silva",
    role: "CEO, TechFood",
    rating: 5,
  },
  {
    quote: "ROI de 300% no primeiro trimestre. Resultados reais e mensuráveis.",
    author: "Ana Paula",
    role: "Marketing Director, FitnessPro",
    rating: 5,
  },
  {
    quote: "Clientes chegam direto pelo WhatsApp após verem o anúncio.",
    author: "Roberto Costa",
    role: "Proprietário, AutoCenter SP",
    rating: 5,
  },
];

const logos = [
  "TechFood", "FitnessPro", "AutoCenter", "BeautyHub", "PetCare", "FastDelivery"
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
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-semibold mb-4">
            Depoimentos
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground">
            O que nossos clientes dizem
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="card-premium p-8 hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="mb-6">
                <Quote className="w-10 h-10 text-primary/20" />
              </div>

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>

              <p className="text-lg text-foreground font-medium mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-muted-foreground">
                    {testimonial.author[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border-t border-border pt-12"
        >
          <p className="text-center text-muted-foreground mb-8">
            Empresas que já anunciam com a Movello
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16">
            {logos.map((logo, index) => (
              <div
                key={index}
                className="px-6 py-3 bg-muted rounded-xl text-muted-foreground font-semibold hover:bg-primary/5 hover:text-primary transition-colors"
              >
                {logo}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
