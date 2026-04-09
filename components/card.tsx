import * as React from "react";

import { cn } from "@/lib/utils";

function CardRoot({ className, ...props }: React.ComponentProps<"div">) {
   return (
      <div
         data-slot="card"
         style={
            {
               "--padding": 4,
            } as React.CSSProperties
         }
         className={cn(
            "bg-background text-card-foreground flex flex-col rounded-lg shadow-xs ring ring-gray-200",
            className,
         )}
         {...props}
      />
   );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
   return (
      <div
         data-slot="card-header"
         className={cn(
            "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-[calc(var(--padding,0)*var(--spacing,0rem))] pt-[calc(var(--padding,0)*var(--spacing,0rem))] has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-[calc(var(--padding,0)*var(--spacing,0rem))]",
            className,
         )}
         {...props}
      />
   );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
   return <div data-slot="card-title" className={cn("leading-none font-semibold", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
   return <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
   return (
      <div
         data-slot="card-action"
         className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
         {...props}
      />
   );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
   return (
      <div
         data-slot="card-content"
         className={cn("p-[calc(var(--padding,0)*var(--spacing,0rem))]", className)}
         {...props}
      />
   );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
   return (
      <div
         data-slot="card-footer"
         className={cn(
            "flex items-center border-t bg-gray-100 p-[calc(var(--padding,0)*var(--spacing,0rem))]",
            className,
         )}
         {...props}
      />
   );
}

export { CardRoot as CardRoot, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
export const Card = Object.assign(
   {},
   {
      Root: CardRoot,
      Header: CardHeader,
      Footer: CardFooter,
      Title: CardTitle,
      Action: CardAction,
      Description: CardDescription,
      Content: CardContent,
   },
);

export default Card;
