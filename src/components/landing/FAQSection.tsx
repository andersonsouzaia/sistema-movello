import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Como funciona a mídia geolocalizada da Movello?",
    answer: "Nossos tablets são instalados nos encostos de bancos de carros de aplicativo. Quando o veículo entra no raio definido pelo anunciante, o anúncio é exibido automaticamente em fullscreen para o passageiro. Tudo acontece via GPS em tempo real.",
  },
  {
    question: "Quanto custa anunciar na Movello?",
    answer: "Os valores variam de acordo com a quantidade de impressões, raio de exibição e duração da campanha. Entre em contato conosco para receber uma proposta personalizada para o seu negócio.",
  },
  {
    question: "Como acompanho os resultados da minha campanha?",
    answer: "Você tem acesso a um painel completo com métricas em tempo real: número de impressões, mapa de calor das exibições, escaneamentos do QR Code e muito mais.",
  },
  {
    question: "Qual o raio mínimo e máximo para exibição?",
    answer: "Você pode configurar raios de 500 metros até 5 quilômetros. Isso permite campanhas ultra-segmentadas para negócios locais ou campanhas mais amplas para alcance regional.",
  },
  {
    question: "Posso alterar minha campanha depois de iniciada?",
    answer: "Sim! Através do App Movello ou do painel web, você pode editar criativos, ajustar raios, pausar ou reativar campanhas a qualquer momento.",
  },
  {
    question: "Como me torno um motorista parceiro?",
    answer: "Basta preencher o formulário de cadastro. Nossa equipe entrará em contato para agendar a instalação gratuita do tablet no seu veículo. Você começa a ganhar assim que os anúncios são exibidos.",
  },
  {
    question: "Os passageiros precisam baixar algum aplicativo?",
    answer: "Não! Os anúncios são exibidos automaticamente no tablet instalado no veículo. O passageiro só precisa escanear o QR Code se quiser interagir com a oferta.",
  },
  {
    question: "Em quais cidades a Movello está presente?",
    answer: "Estamos em constante expansão. Atualmente operamos nas principais capitais e regiões metropolitanas. Entre em contato para verificar a disponibilidade na sua região.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="section-padding bg-muted/30">
      <div className="container-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground">
            Perguntas Frequentes
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="card-premium px-6 border-none"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:text-primary hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
