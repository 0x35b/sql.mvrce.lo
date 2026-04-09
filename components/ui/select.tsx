"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

export type SelectTriggerVariants = VariantProps<typeof selectTriggerVariants>;
export const selectTriggerVariants = cva(
   "flex items-center justify-between w-full rounded-md outline-none text-sm disabled:cursor-not-allowed disabled:opacity-50",
   {
      variants: {
         intent: {
            primary: [
               "bg-gray-100 focus:bg-background aria-expanded:bg-background border border-gray-950/10 bg-clip-padding focus:border-primary aria-expanded:border-primary focus:ring-1 aria-expanded:ring-1 ring-gray-950/10 focus:ring-primary aria-expanded:ring-primary",
               "focus-visible:outline-2 focus-visible:outline-primary",
            ],
            gray: "bg-gray-100 focus:bg-background aria-expanded:bg-background border border-border focus:border-gray-800 aria-expanded:border-gray-800 focus:ring-1 aria-expanded:ring-1 ring-border focus:ring-gray-800 aria-expanded:ring-gray-800",
            opaque:
               "bg-gray-200 focus:bg-gray-100 aria-expanded:bg-gray-100 border border-gray-200 hover:border-border focus:border-gray-800 aria-expanded:border-gray-800 focus:ring-1 aria-expanded:ring-1 ring-border focus:ring-gray-800 aria-expanded:ring-gray-800",
         },
         size: {
            none: null,
            sm: "h-8 px-2",
            md: "h-10 px-3",
            lg: "h-12 px-4",
         },
      },
      defaultVariants: {
         intent: "primary",
         size: "md",
      },
   },
);

const SelectTrigger = React.forwardRef<
   React.ElementRef<typeof SelectPrimitive.Trigger>,
   React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & SelectTriggerVariants
>(({ className, children, intent, size, ...props }, ref) => (
   <SelectPrimitive.Trigger
      ref={ref}
      className={cn(selectTriggerVariants({ intent, size, className }), "[&>span]:line-clamp-1")}
      {...props}
   >
      {children}
      <SelectPrimitive.Icon asChild>
         <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
   </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
   React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
   React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
   <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
   >
      <ChevronUp className="h-4 w-4" />
   </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
   React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
   React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
   <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
   >
      <ChevronDown className="h-4 w-4" />
   </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
   React.ElementRef<typeof SelectPrimitive.Content>,
   React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
   <SelectPrimitive.Portal>
      <SelectPrimitive.Content
         ref={ref}
         className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-zinc-200 bg-white text-zinc-950 shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
            position === "popper" &&
               "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            className,
         )}
         position={position}
         {...props}
      >
         <SelectScrollUpButton />
         <SelectPrimitive.Viewport
            className={cn(
               "p-1",
               position === "popper" &&
                  "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
            )}
         >
            {children}
         </SelectPrimitive.Viewport>
         <SelectScrollDownButton />
      </SelectPrimitive.Content>
   </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
   React.ElementRef<typeof SelectPrimitive.Label>,
   React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
   <SelectPrimitive.Label ref={ref} className={cn("py-1.5 pr-2 pl-8 text-sm font-semibold", className)} {...props} />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
   React.ElementRef<typeof SelectPrimitive.Item>,
   React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
   <SelectPrimitive.Item
      ref={ref}
      className={cn(
         "relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none select-none focus:bg-zinc-100 focus:text-zinc-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-zinc-800 dark:focus:text-zinc-50",
         className,
      )}
      {...props}
   >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
         <SelectPrimitive.ItemIndicator>
            <Check className="h-4 w-4" />
         </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
   </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
   React.ElementRef<typeof SelectPrimitive.Separator>,
   React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
   <SelectPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-zinc-100 dark:bg-zinc-800", className)}
      {...props}
   />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
   Select,
   SelectGroup,
   SelectValue,
   SelectTrigger,
   SelectContent,
   SelectLabel,
   SelectItem,
   SelectSeparator,
   SelectScrollUpButton,
   SelectScrollDownButton,
};
