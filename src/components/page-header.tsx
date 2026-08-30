import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHeader({ title, description, breadcrumbs = [] }: { title: string; description?: string; breadcrumbs?: { label: string; href?: string }[] }) {
  return <header className="mb-8"><nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">{breadcrumbs.map((item, index) => <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">{index > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}{item.href ? <Link href={item.href} className="hover:text-foreground">{item.label}</Link> : <span>{item.label}</span>}</span>)}</nav><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}</header>;
}
