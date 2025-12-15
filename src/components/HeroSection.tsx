import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onShopNow?: () => void;
}

/**
 * HeroSection: Main hero banner for homepage
 * Features: Branding tagline, description, CTA button
 */
export function HeroSection({ onShopNow }: HeroSectionProps) {
  return (
    <div className="relative bg-gradient-to-br from-teal-50 via-white to-teal-50 rounded-2xl overflow-hidden shadow-sm">
      <div className="container mx-auto px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-block px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm">
              Physical Media Store
            </div>
            <h1 className="text-teal-600">
              Buy Physical Media – Books, Newspapers, CDs & DVDs
            </h1>
            <p className="text-xl text-gray-600 max-w-lg">
              Authentic media products with detailed information and fair prices. 
              Experience the joy of owning physical copies of your favorite books, music, and movies.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <Button
                onClick={onShopNow}
                size="lg"
                className="bg-teal-600 hover:bg-teal-700 gap-2"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-teal-600 text-teal-600 hover:bg-teal-50"
              >
                Browse Categories
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 justify-center md:justify-start pt-4">
              <div>
                <div className="text-teal-600">500+</div>
                <div className="text-sm text-gray-600">Products</div>
              </div>
              <div>
                <div className="text-teal-600">Free Shipping</div>
                <div className="text-sm text-gray-600">Orders > 100K VND</div>
              </div>
              <div>
                <div className="text-teal-600">Authentic</div>
                <div className="text-sm text-gray-600">Guaranteed</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="hidden md:block">
            <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1703432778301-a4effdd92fa5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rcyUyMG11c2ljJTIwbWVkaWElMjBzdG9yZXxlbnwxfHx8fDE3NjQ0MjIwMjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="AIMS Media Store"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
