
import React from 'react';
import { ArrowRight, ImageIcon } from 'lucide-react';
import { unsplashImage } from '@/data/products';

interface EditorialBannerProps {
  onNavigate: (view: string) => void;
}

/**
 * Responsive Editorial Banner
 *
 * - Complete image visible
 * - No cropping or stretching
 * - Automatically adapts to device width
 * - Mobile: image above content
 * - Desktop: image and content side by side
 * - Existing navigation preserved
 */

export const EditorialBanner: React.FC<
  EditorialBannerProps
> = ({ onNavigate }) => {
  const bannerImage = unsplashImage(
    'photo-1560066984-138dadb4c035'
  );

  return (
    <section
      className="
        w-full
        min-w-0
        overflow-hidden
        bg-[#1b1b1b]
        text-white
      "
      aria-label="Discover the AERON salon collection"
    >
      <div
        className="
          mx-auto
          grid
          w-full
          max-w-[1600px]
          grid-cols-1
          items-stretch
          lg:grid-cols-2
        "
      >
        {/* RESPONSIVE BANNER IMAGE */}

        <div
          className="
            relative
            flex
            min-w-0
            items-center
            justify-center
            overflow-hidden
            bg-[#292621]
            p-4
            sm:p-6
            md:p-8
            lg:order-2
            lg:p-10
          "
        >
          <div
            className="
              flex
              aspect-[4/3]
              w-full
              max-w-[720px]
              items-center
              justify-center
              sm:aspect-[16/10]
              lg:aspect-[4/5]
              xl:aspect-[5/4]
            "
          >
            {bannerImage ? (
              <img
                src={bannerImage}
                alt="Professional salon interior"
                loading="lazy"
                decoding="async"
                draggable={false}
                className="
                  block
                  h-full
                  w-full
                  max-h-full
                  max-w-full
                  object-contain
                  object-center
                "
                style={{
                  objectFit: 'contain',
                  objectPosition: 'center',
                  transform: 'none',
                }}
              />
            ) : (
              <div
                className="
                  flex
                  h-full
                  w-full
                  flex-col
                  items-center
                  justify-center
                  gap-3
                  text-gray-400
                "
              >
                <ImageIcon size={32} />

                <span className="text-sm">
                  AERON Professional
                </span>
              </div>
            )}
          </div>
        </div>

        {/* EDITORIAL CONTENT */}

        <div
          className="
            flex
            min-w-0
            flex-col
            items-start
            justify-center
            px-5
            py-12
            sm:px-8
            sm:py-16
            lg:order-1
            lg:px-12
            lg:py-20
            xl:px-16
          "
        >
          {/* EYEBROW */}

          <p
            className="
              tag
              text-[#c6a77a]
            "
          >
            MADE FOR THE CRAFT
          </p>

          {/* HEADING */}

          <h2
            className="
              serif
              my-5
              max-w-xl
              break-words
              text-[clamp(2rem,5vw,4rem)]
              leading-[1.1]
            "
          >
            Where artistry meets performance.
          </h2>

          {/* DESCRIPTION */}

          <p
            className="
              mb-8
              max-w-md
              break-words
              text-sm
              leading-7
              text-gray-300
              sm:text-base
              sm:leading-8
            "
          >
            Professional-inspired essentials
            designed to support the creativity
            of stylists and beauty enthusiasts.
          </p>

          {/* BUTTON */}

          <button
            type="button"
            onClick={() =>
              onNavigate('Professional Collection')
            }
            className="
              inline-flex
              min-h-12
              w-full
              max-w-sm
              items-center
              justify-center
              gap-2
              bg-[#c6a77a]
              px-5
              py-3
              text-center
              text-xs
              font-bold
              tracking-wider
              text-black
              transition-colors
              hover:bg-white
              min-[420px]:w-auto
              sm:px-6
            "
          >
            DISCOVER THE SALON EDIT

            <ArrowRight
              size={16}
              className="shrink-0"
            />
          </button>
        </div>
      </div>
    </section>
  );
};

export default EditorialBanner;
