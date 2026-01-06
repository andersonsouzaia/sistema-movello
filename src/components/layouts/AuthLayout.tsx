import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import movelloLogo from '@/assets/movello-logo.png'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-movello-orange/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="w-full py-6 px-4 relative z-10">
        <div className="container-section">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="inline-block">
              <img
                src={movelloLogo}
                alt="Movello"
                className="h-10 sm:h-12 w-auto"
              />
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Title Section */}
          {(title || subtitle) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center mb-8"
            >
              {title && (
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-lg text-muted-foreground">{subtitle}</p>
              )}
            </motion.div>
          )}

          {/* Form Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card-premium p-6 sm:p-8"
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 text-center text-sm text-muted-foreground relative z-10">
        <p>© 2024 Movello. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}

