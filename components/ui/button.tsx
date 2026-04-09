import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

type ButtonVariants = VariantProps<typeof buttonVariants>;
const buttonVariants = cva(
   "inline-flex items-center rounded-md justify-center whitespace-nowrap select-none text-sm font-medium cursor-pointer outline-hidden focus-visible:outline-2 transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
   {
      variants: {
         intent: {
            none: null,
            default: "bg-gray-900 text-background hover:bg-gray-900/90",
            item: "text-gray-500 aria-pressed:text-gray-700 hover:text-foreground outline-none",
            primary: "bg-primary hover:bg-primary-hover text-background outline-offset-2 outline-primary",
            destructive:
               "bg-red-600 text-gray-50 hover:bg-rose-700 dark:bg-red-600 dark:hover:bg-red-500 outline-red-500",
            outline:
               "bg-background border border-border text-gray-700 hover:border-gray-400 hover:bg-gray-100 hover:text-foreground outline-primary outline-offset-2 active:bg-gray-100",
            fillup:
               "bg-background focus-visible:border-gray-100 focus-visible:bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 hover:text-foreground outline-primary outline-offset-2 active:bg-gray-100",
            secondary: "bg-gray-100 text-gray-900 hover:bg-gray-100/80",
            ghost: "border border-transparent text-gray-700 hover:bg-gray-200 hover:border-gray-950/3 hover:text-foreground outline-primary focus-visible:bg-gray-200",
            "danger-ghost":
               "text-red-500 hover:bg-red-500/15 active:bg-red-500/20 hover:text-rose-600  outline-red-500  focus-visible:bg-gray-200",
            link: "text-gray-700 hover:underline underline-offset-4 hover:text-foreground",
         },
         size: {
            none: null,
            xs: "h-7 px-2",
            sm: "h-8 px-3",
            md: "h-10 px-4 py-2",
            lg: "h-12 px-8",
            icon: "size-10",
         },
      },
      defaultVariants: {
         intent: "default",
         size: "md",
      },
   },
);

export interface ButtonProps
   extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonVariants>,
      ButtonVariants {
   asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
   ({ className, type = "button", intent, size, asChild = false, ...props }, ref) => {
      const Comp = asChild ? Slot : "button";
      return <Comp type={type} {...props} className={cn(buttonVariants({ intent, size, className }))} ref={ref} />;
   },
);
Button.displayName = "Button";

export { Button as default, Button, buttonVariants };
