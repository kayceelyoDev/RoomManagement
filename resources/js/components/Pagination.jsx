import { Link } from '@inertiajs/react';

export default function Pagination({ links }) {
    return (
        links.length > 3 && (
            <div className="flex flex-wrap justify-center gap-1">
                {links.map((link, key) => (
                    <div key={key}>
                        {link.url === null ? (
                            <div
                                className="px-3 py-2 text-xs font-medium leading-4 text-muted-foreground border border-transparent rounded-md opacity-50 select-none"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <Link
                                className={`block px-3 py-2 text-xs font-medium leading-4 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'bg-card text-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent'
                                }`}
                                href={link.url}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        )}
                    </div>
                ))}
            </div>
        )
    );
}