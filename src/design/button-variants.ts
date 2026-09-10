import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md [corner-shape:squircle] text-sm font-medium transition-[filter,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:brightness-110 active:brightness-95",
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:brightness-110 active:brightness-95",
        youtube:
          "bg-[#FF0000] text-white shadow-sm hover:bg-[#CC0000] hover:shadow-md disabled:bg-[#FF0000]/70 disabled:text-white/80",
        "primary-outline":
          "bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-sm hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:shadow-md hover:brightness-110 active:brightness-95",
        outline:
          "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground hover:border-border",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-success text-success-foreground shadow-sm hover:shadow-md hover:brightness-110 active:brightness-95",
        warning:
          "bg-warning text-warning-foreground shadow-sm hover:shadow-md hover:brightness-110 active:brightness-95",
        info: "bg-info text-info-foreground shadow-sm hover:shadow-md hover:brightness-110 active:brightness-95",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export { buttonVariants };
