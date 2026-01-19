import { Link } from "wouter";
import { Button } from "@/components/ui-custom";
import { ArrowRight, CheckCircle2, Cloud, Shield, Zap, Server, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Cloud className="text-white h-5 w-5" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-slate-900">CloudStorage Pro</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Recursos</a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Preços</a>
              {user ? (
                <Link href="/dashboard">
                  <Button size="md" className="rounded-full px-6">Acessar Dashboard</Button>
                </Link>
              ) : (
                <Link href="/sign-in">
                  <Button size="md" className="rounded-full px-6" data-testid="button-get-started">Começar</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              🇧🇷 Dados no Brasil
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
              Armazenamento em Nuvem <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                S3-Compatible
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-10 leading-relaxed">
              Solução brasileira de Cloud Storage com preços competitivos, conformidade LGPD, e suporte a S3, SFTP e FTPS.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-full text-lg px-8 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30">
                    Acessar Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/sign-in">
                  <Button size="lg" className="rounded-full text-lg px-8 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30" data-testid="button-start-free">
                    Começar Grátis <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="lg" className="rounded-full text-lg px-8 border-2">
                Ver Documentação
              </Button>
            </div>
          </motion.div>

          {/* Dashboard Preview Image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 rounded-2xl border-4 border-white/50 shadow-2xl overflow-hidden mx-auto max-w-5xl bg-slate-50 relative"
          >
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=2400&q=80&auto=format&fit=crop"
              alt="Preview do Dashboard"
              className="w-full h-auto opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent h-40 bottom-0 top-auto"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Por que escolher o CloudStorage Pro?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Recursos poderosos para gerenciar seus dados com confiança e facilidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Segurança Enterprise",
                description: "Criptografia de ponta a ponta e conformidade com padrões de segurança globais para manter seus dados seguros."
              },
              {
                icon: Globe,
                title: "Dados no Brasil",
                description: "Seus dados ficam em datacenters brasileiros, em total conformidade com a LGPD e leis brasileiras."
              },
              {
                icon: Zap,
                title: "Alta Performance",
                description: "Infraestrutura otimizada para entregar seu conteúdo com latência mínima em todo o Brasil."
              },
              {
                icon: Server,
                title: "Múltiplos Protocolos",
                description: "Acesse via S3, SFTP ou FTPS - compatível com qualquer software de backup do mercado."
              },
              {
                icon: Cloud,
                title: "Escalabilidade Infinita",
                description: "Armazenamento que cresce com você. De gigabytes a petabytes, nós cuidamos da infraestrutura."
              },
              {
                icon: CheckCircle2,
                title: "Preços Competitivos",
                description: "Até 80% mais barato que AWS para armazenamento no Brasil. Sem custos escondidos."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:shadow-lg transition-all"
              >
                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Planos e Preços</h2>
            <p className="text-muted-foreground text-lg">Preços simples e transparentes. Sem taxas escondidas. Cancele quando quiser.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "Grátis",
                priceNote: "",
                features: ["10GB de Armazenamento", "100GB de Transferência", "Suporte por Email", "1 Usuário"]
              },
              {
                name: "Profissional",
                price: "R$ 99",
                priceNote: "/mês",
                featured: true,
                features: ["1TB de Armazenamento", "5TB de Transferência", "Suporte Prioritário", "Acesso SFTP/FTPS", "Até 5 Usuários", "Access Keys Ilimitadas"]
              },
              {
                name: "Enterprise",
                price: "Sob Consulta",
                priceNote: "",
                features: ["Armazenamento Ilimitado", "Transferência Ilimitada", "Suporte 24/7 Dedicado", "SLA Personalizado", "Usuários Ilimitados", "White-Label"]
              },
            ].map((plan, i) => (
              <div key={i} className={`relative p-8 rounded-3xl bg-white border ${plan.featured ? "border-primary shadow-xl scale-105 z-10" : "border-border shadow-sm"} flex flex-col`}>
                {plan.featured && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Mais Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-display font-bold text-slate-900 mb-6">{plan.price}<span className="text-base font-normal text-muted-foreground">{plan.priceNote}</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center text-sm text-slate-600">
                      <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                {user ? (
                  <Link href="/dashboard">
                    <Button variant={plan.featured ? "primary" : "outline"} className="w-full rounded-xl">
                      {plan.name === "Enterprise" ? "Falar com Vendas" : `Escolher ${plan.name}`}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/sign-in">
                    <Button variant={plan.featured ? "primary" : "outline"} className="w-full rounded-xl" data-testid={`button-choose-${plan.name.toLowerCase()}`}>
                      {plan.name === "Enterprise" ? "Falar com Vendas" : `Escolher ${plan.name}`}
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6 text-white">
            Pronto para proteger seus dados?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Comece gratuitamente e aproveite armazenamento em nuvem brasileiro, seguro e compatível com os principais softwares de backup.
          </p>
          <Link href="/sign-in">
            <Button size="lg" variant="secondary" className="rounded-full text-lg px-8 bg-white text-primary hover:bg-white/90">
              Criar Conta Grátis <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="mb-4 md:mb-0 font-semibold text-slate-900">© 2025 CloudStorage Pro - PrimeTI Tecnologia</div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-primary">Política de Privacidade</a>
            <a href="#" className="hover:text-primary">Termos de Uso</a>
            <a href="#" className="hover:text-primary">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
