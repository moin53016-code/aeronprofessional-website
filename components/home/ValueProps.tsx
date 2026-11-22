
import React from 'react';
import {
  Truck,
  ShieldCheck,
  Star,
  Headphones,
} from 'lucide-react';

const features = [
  {
    label: 'Shipping information at checkout',
    Icon: Truck,
  },
  {
    label: 'Warranty details by product',
    Icon: ShieldCheck,
  },
  {
    label: 'Professional-inspired quality',
    Icon: Star,
  },
  {
    label: 'Customer care',
    Icon: Headphones,
  },
];

export const ValueProps: React.FC = () => {
  return (
    <section
      className="
        w-full
        min-w-0
        border-b
        border-[#eee]
        bg-white
      "
      aria-label="AERON benefits"
    >
      <div
        className="
          mx-auto
          grid
          w-full
          max-w-7xl
          grid-cols-2
          gap-x-3
          gap-y-6
          px-4
          py-6
          sm:gap-x-6
          sm:px-6
          sm:py-8
          md:grid-cols-4
          lg:px-8
        "
      >
        {features.map(({ label, Icon }) => (
          <div
            key={label}
            className="
              flex
              min-w-0
              flex-col
              items-center
              gap-3
              text-center
              sm:flex-row
              sm:text-left
            "
          >
            <span
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#f6f4ef]
              "
            >
              <Icon
                size={22}
                className="text-[#a88556]"
                aria-hidden="true"
              />
            </span>

            <span
              className="
                min-w-0
                break-words
                text-[11px]
                font-medium
                leading-5
                text-[#292929]
                sm:text-xs
              "
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ValueProps;
