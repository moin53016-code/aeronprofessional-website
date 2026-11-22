
import React from 'react';
import {
  ShieldCheck,
  Star,
  Headphones,
} from 'lucide-react';

const features = [
  {
    title: 'Professional Focus',
    description:
      'Thoughtful styling essentials with a focus on practical performance.',
    Icon: ShieldCheck,
  },
  {
    title: 'Design-Led Tools',
    description:
      'Refined design for the modern beauty routine and salon station.',
    Icon: Star,
  },
  {
    title: 'Here to Help',
    description:
      'Dedicated space for product guidance and customer support.',
    Icon: Headphones,
  },
];

export const BrandDifference: React.FC = () => {
  return (
    <section
      className="
        w-full
        min-w-0
        bg-white
        py-12
        sm:py-16
        lg:py-20
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          px-4
          text-center
          sm:px-6
          lg:px-8
        "
      >
        <p className="tag">
          THE AERON DIFFERENCE
        </p>

        <h2
          className="
            serif
            mx-auto
            mb-9
            mt-3
            max-w-3xl
            break-words
            text-[clamp(1.9rem,5vw,3rem)]
            leading-tight
            sm:mb-12
          "
        >
          Made to Inspire Confidence
        </h2>

        <div
          className="
            grid
            grid-cols-1
            items-stretch
            gap-5
            sm:grid-cols-2
            md:grid-cols-3
            lg:gap-8
          "
        >
          {features.map(({ title, description, Icon }) => (
            <div
              key={title}
              className="
                flex
                min-w-0
                flex-col
                items-center
                rounded-md
                border
                border-[#eeeae4]
                bg-[#faf9f6]
                px-5
                py-8
                sm:px-6
                lg:px-8
                lg:py-10
              "
            >
              <span
                className="
                  mb-5
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                "
              >
                <Icon
                  size={30}
                  className="text-[#a88556]"
                  aria-hidden="true"
                />
              </span>

              <h3
                className="
                  mb-3
                  break-words
                  text-base
                  font-bold
                  text-[#191919]
                  sm:text-lg
                "
              >
                {title}
              </h3>

              <p
                className="
                  max-w-xs
                  break-words
                  text-sm
                  leading-7
                  text-gray-500
                "
              >
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandDifference;
