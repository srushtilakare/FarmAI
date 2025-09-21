import { Button } from "@/components/ui/button"
import Link from "next/link"

interface HeroSectionProps {
  title: string
  subtitle: string
  backgroundImage: string
  primaryAction: {
    text: string
    href: string
  }
  secondaryAction?: {
    text: string
    href: string
  }
}

export function HeroSection({ title, subtitle, backgroundImage, primaryAction, secondaryAction }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
          filter: "brightness(0.7)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />

      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">{title}</h1>
        <p className="text-xl md:text-2xl mb-8 text-balance opacity-90">{subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={primaryAction.href}>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-3">
              {primaryAction.text}
            </Button>
          </Link>
          {secondaryAction && (
            <Link href={secondaryAction.href}>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-3 bg-transparent"
              >
                {secondaryAction.text}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
