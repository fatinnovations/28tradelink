import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useHeroBanners } from "@/hooks/useHeroBanners";

const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { data: banners = [], isLoading } = useHeroBanners(true);

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % banners.length);

  if (isLoading || banners.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-lg h-[200px] sm:h-[280px] md:h-[350px] bg-primary flex items-center justify-center">
        <div className="text-center text-primary-foreground">
          <h2 className="text-3xl font-bold">Welcome to 28TradeLink</h2>
          <p className="mt-2">Your Malawi Marketplace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden h-[200px] sm:h-[280px] md:h-[350px]">
      <div
        className="flex transition-transform duration-500 h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="min-w-full h-full flex items-center justify-center"
            style={{
              backgroundColor: banner.background_image ? undefined : (banner.background_color || "#3b82f6"),
              backgroundImage: banner.background_image ? `url(${banner.background_image})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              color: banner.text_color || "#ffffff",
            }}
          >
            {/* Overlay for readability when using background images */}
            {banner.background_image && (
              <div className="absolute inset-0 bg-black/30" />
            )}
            <div className="text-center px-4 sm:px-8 relative z-10 max-w-[90%] sm:max-w-none">
              {banner.description && (
                <p className="text-xs sm:text-sm md:text-base opacity-90 mb-1 line-clamp-2">{banner.description}</p>
              )}
              <h2 className="text-xl sm:text-3xl md:text-5xl font-bold mb-1 sm:mb-2 line-clamp-2">{banner.title}</h2>
              {banner.subtitle && (
                <p className="text-sm sm:text-xl md:text-3xl font-semibold mb-2 sm:mb-4 line-clamp-1">{banner.subtitle}</p>
              )}
              {banner.cta_text && banner.cta_link && (
                <Link
                  to={banner.cta_link}
                  className="inline-block bg-white text-foreground px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-sm sm:text-base font-medium hover:bg-opacity-90 transition-colors"
                >
                  {banner.cta_text}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide ? "bg-white w-6" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroBanner;
