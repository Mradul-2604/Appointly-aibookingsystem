import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["effortless", "intelligent", "seamless", "efficient", "automated"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full bg-surface text-on-surface min-h-[80vh] flex items-center pt-20">
      <div className="container mx-auto px-4">
        <div className="flex gap-8 py-20 items-center justify-center flex-col">
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-4xl tracking-tighter text-center font-bold">
              <span className="text-on-surface">Scheduling made</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1 text-primary">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    initial={{ opacity: 0, y: "-100%" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? "-150%" : "150%",
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-on-surface-variant max-w-2xl text-center mx-auto mt-6">
              Experience a sophisticated digital workspace crafted for effortless capability. Let our AI concierge manage your time, so you can focus on what truly matters.
            </p>
          </div>
          
          <div className="flex flex-row gap-3 mt-8">
            <Button size="lg" className="gap-3 primary-gradient text-on-primary rounded-xl px-8 h-14 text-base shadow-xl shadow-primary/20 hover:scale-105 transition-all" asChild>
              <Link to="/chat">
                Book your appointment <MoveRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
